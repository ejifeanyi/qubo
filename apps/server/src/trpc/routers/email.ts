import { z } from "zod";
import { router, protectedProcedure } from "../index";

export const emailRouter = router({
	getEmails: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.string().optional(),
				categoryId: z.string().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { limit, cursor, categoryId } = input;

			const emails = await ctx.prisma.email.findMany({
				where: {
					userId: ctx.user.id,
					...(categoryId && { categoryId }),
				},
				include: {
					category: true,
				},
				orderBy: { receivedAt: "desc" },
				take: limit + 1,
				cursor: cursor ? { id: cursor } : undefined,
			});

			let nextCursor: typeof cursor | undefined = undefined;
			if (emails.length > limit) {
				const nextItem = emails.pop();
				nextCursor = nextItem!.id;
			}

			return {
				emails,
				nextCursor,
			};
		}),

	getCategories: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.prisma.category.findMany({
			where: { userId: ctx.user.id },
			orderBy: { name: "asc" },
		});
	}),

	createCategory: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(50),
				color: z.string().regex(/^#[0-9A-F]{6}$/i),
				description: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			return await ctx.prisma.category.create({
				data: {
					...input,
					userId: ctx.user.id,
				},
			});
		}),

	categorizeEmail: protectedProcedure
		.input(
			z.object({
				emailId: z.string(),
				categoryId: z.string().nullable(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			return await ctx.prisma.email.update({
				where: {
					id: input.emailId,
					userId: ctx.user.id,
				},
				data: {
					categoryId: input.categoryId,
				},
			});
		}),
});
