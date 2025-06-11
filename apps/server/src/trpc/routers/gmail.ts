import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { GmailService } from "../../services/gmailService";

const gmailService = new GmailService();
const syncEmitter = new EventEmitter();

export const gmailRouter = router({
	startSync: protectedProcedure.mutation(async ({ ctx }) => {
		const user = await ctx.prisma.user.findUnique({
			where: { id: ctx.user.id },
			select: { syncInProgress: true, accessToken: true },
		});

		if (!user?.accessToken) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Gmail not connected. Please reconnect your Google account.",
			});
		}

		if (user.syncInProgress) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Sync already in progress",
			});
		}

		gmailService
			.bulkSyncEmails(ctx.user.id, (progress, total) => {
				syncEmitter.emit(`sync-${ctx.user.id}`, { progress, total });
			})
			.catch((error) => {
				syncEmitter.emit(`sync-${ctx.user.id}`, { error: error.message });
			});

		return { success: true };
	}),

	syncProgress: protectedProcedure.subscription(({ ctx }) => {
		return observable<{ progress?: number; total?: number; error?: string }>(
			(emit) => {
				const onProgress = (data: any) => emit.next(data);

				syncEmitter.on(`sync-${ctx.user.id}`, onProgress);

				return () => {
					syncEmitter.off(`sync-${ctx.user.id}`, onProgress);
				};
			}
		);
	}),

	getEmails: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.string().optional(),
				categoryId: z.string().optional(),
				search: z.string().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const where: any = {
				userId: ctx.user.id,
				...(input.categoryId && { categoryId: input.categoryId }),
				...(input.search && {
					OR: [
						{ subject: { contains: input.search, mode: "insensitive" } },
						{ from: { contains: input.search, mode: "insensitive" } },
						{ snippet: { contains: input.search, mode: "insensitive" } },
					],
				}),
			};

			const emails = await ctx.prisma.email.findMany({
				where,
				include: {
					category: true,
				},
				orderBy: { receivedAt: "desc" },
				take: input.limit + 1,
				...(input.cursor && {
					cursor: { id: input.cursor },
					skip: 1,
				}),
			});

			let nextCursor: string | undefined;
			if (emails.length > input.limit) {
				const nextItem = emails.pop();
				nextCursor = nextItem!.id;
			}

			return {
				emails,
				nextCursor,
			};
		}),

	getEmail: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const email = await ctx.prisma.email.findFirst({
				where: {
					id: input.id,
					userId: ctx.user.id,
				},
				include: {
					category: true,
				},
			});

			if (!email) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Email not found",
				});
			}

			return email;
		}),

	updateEmail: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				isRead: z.boolean().optional(),
				isStarred: z.boolean().optional(),
				categoryId: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { id, ...updateData } = input;

			const email = await ctx.prisma.email.updateMany({
				where: {
					id,
					userId: ctx.user.id,
				},
				data: updateData,
			});

			if (email.count === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Email not found",
				});
			}

			return { success: true };
		}),

	getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.prisma.user.findUnique({
			where: { id: ctx.user.id },
			select: {
				syncInProgress: true,
				lastSyncAt: true,
				accessToken: true,
				_count: {
					select: { emails: true },
				},
			},
		});

		return {
			syncInProgress: user?.syncInProgress || false,
			lastSyncAt: user?.lastSyncAt,
			isConnected: !!user?.accessToken,
			emailCount: user?._count.emails || 0,
		};
	}),
});
