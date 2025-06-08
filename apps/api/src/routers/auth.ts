import { z } from "zod";
import { procedure, router } from "../lib/trpc";
import { verifyGoogleToken } from "../lib/google-auth";
import { generateToken, verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { OAuth2Client } from "google-auth-library";
import { gmailService } from "../services/gmail-service";
import { sessionManager } from "../session-manager";

const googleClient = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI
);

export const authRouter = router({
	getGoogleAuthUrl: procedure.query(() => {
		const scopes = [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/gmail.readonly",
		];

		const authUrl = googleClient.generateAuthUrl({
			access_type: "offline",
			scope: scopes,
			prompt: "consent",
		});

		return { authUrl };
	}),

	googleCallback: procedure
		.input(z.object({ code: z.string() }))
		.mutation(async ({ input }) => {
			const { tokens } = await googleClient.getToken(input.code);

			if (!tokens.id_token) {
				throw new Error("No ID token received");
			}

			const googleUser = await verifyGoogleToken(tokens.id_token);

			let user = await prisma.user.findUnique({
				where: { email: googleUser.email },
			});

			const isFirstLogin = !user;

			if (!user) {
				user = await prisma.user.create({
					data: {
						email: googleUser.email,
						name: googleUser.name,
						googleId: googleUser.googleId,
						picture: googleUser.picture,
						emailVerified: googleUser.emailVerified,
						googleAccessToken: tokens.access_token,
						googleRefreshToken: tokens.refresh_token,
						googleTokenExpiry: tokens.expiry_date
							? new Date(tokens.expiry_date)
							: null,
					},
				});
			} else {
				user = await prisma.user.update({
					where: { email: googleUser.email },
					data: {
						name: googleUser.name,
						googleId: googleUser.googleId,
						picture: googleUser.picture,
						emailVerified: googleUser.emailVerified,
						googleAccessToken: tokens.access_token,
						googleRefreshToken: tokens.refresh_token,
						googleTokenExpiry: tokens.expiry_date
							? new Date(tokens.expiry_date)
							: null,
						lastLogin: new Date(),
					},
				});
			}

			const jwtToken = generateToken(user.id);

			if (tokens.access_token) {
				if (isFirstLogin) {
					gmailService
						.fetchAllEmails(tokens.access_token, user.id)
						.catch(console.error);
				} else {
					gmailService
						.fetchNewEmails(tokens.access_token, user.id)
						.catch(console.error);
				}

				sessionManager.addSession(user.id);
			}

			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					picture: user.picture,
				},
				token: jwtToken,
			};
		}),

	me: procedure
		.input(z.object({ token: z.string() }))
		.query(async ({ input }) => {
			const decoded = verifyToken(input.token);
			if (!decoded) {
				throw new Error("Invalid token");
			}

			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
				select: {
					id: true,
					email: true,
					name: true,
					picture: true,
					createdAt: true,
				},
			});

			if (!user) {
				throw new Error("User not found");
			}

			sessionManager.refreshSession(user.id);

			return user;
		}),

	heartbeat: procedure
		.input(z.object({ token: z.string() }))
		.mutation(async ({ input }) => {
			const decoded = verifyToken(input.token);
			if (!decoded) {
				throw new Error("Invalid token");
			}

			sessionManager.refreshSession(decoded.userId);

			return { success: true };
		}),

	logout: procedure
		.input(z.object({ token: z.string() }))
		.mutation(async ({ input }) => {
			const decoded = verifyToken(input.token);
			if (!decoded) {
				throw new Error("Invalid token");
			}

			sessionManager.removeSession(decoded.userId);

			return { success: true };
		}),

	syncEmails: procedure
		.input(z.object({ token: z.string() }))
		.mutation(async ({ input }) => {
			const decoded = verifyToken(input.token);
			if (!decoded) {
				throw new Error("Invalid token");
			}

			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
				select: {
					id: true,
					googleAccessToken: true,
				},
			});

			if (!user?.googleAccessToken) {
				throw new Error("No Google access token found");
			}

			await gmailService.fetchNewEmails(user.googleAccessToken, user.id);

			return { success: true };
		}),
});
