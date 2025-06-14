import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { router, publicProcedure, protectedProcedure } from "../index";
import { GmailService } from "../../services/gmailService";

const googleClient = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET
);

const gmailService = new GmailService();

export const authRouter = router({
	getGoogleAuthUrl: publicProcedure.query(() => {
		return { url: gmailService.getAuthUrl() };
	}),

	handleGoogleCallback: publicProcedure
		.input(z.object({ code: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const tokens = await gmailService.getTokens(input.code);

				const ticket = await googleClient.verifyIdToken({
					idToken: tokens.id_token!,
					audience: process.env.GOOGLE_CLIENT_ID,
				});

				const payload = ticket.getPayload();
				if (!payload?.email) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid token",
					});
				}

				const { sub: googleId, email, name, picture } = payload;

				let user = await ctx.prisma.user.findUnique({
					where: { email },
				});

				if (!user) {
					user = await ctx.prisma.user.create({
						data: {
							email,
							name,
							image: picture,
							googleId,
						},
					});

					await ctx.prisma.category.createMany({
						data: [
							{
								name: "Work",
								userId: user.id,
								isDefault: true,
								color: "#3b82f6",
							},
							{
								name: "Personal",
								userId: user.id,
								isDefault: true,
								color: "#10b981",
							},
							{
								name: "Promotions",
								userId: user.id,
								isDefault: true,
								color: "#f59e0b",
							},
							{
								name: "Social",
								userId: user.id,
								isDefault: true,
								color: "#8b5cf6",
							},
						],
					});
				}

				await gmailService.storeTokens(user.id, tokens);

				const jwtToken = jwt.sign(
					{ userId: user.id },
					process.env.JWT_SECRET!,
					{ expiresIn: "7d" }
				);

				return {
					token: jwtToken,
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						image: user.image,
					},
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Authentication failed",
				});
			}
		}),

	me: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),
});
