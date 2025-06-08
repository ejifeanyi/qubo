import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI
);

export async function verifyGoogleToken(token: string) {
	try {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		if (!payload) throw new Error("Invalid token payload");

		return {
			googleId: payload.sub,
			email: payload.email!,
			name: payload.name!,
			picture: payload.picture,
			emailVerified: payload.email_verified,
		};
	} catch (error) {
		throw new Error("Invalid Google token");
	}
}
