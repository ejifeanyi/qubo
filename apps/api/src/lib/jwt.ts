import jwt from "jsonwebtoken";

const JWT_SECRET =
	"547e52e670d4868b96f1f965bb74a99ecc95654ea7020a18d8b6908d2391ee43";

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required");
}

export interface JWTPayload {
	userId: string;
	iat?: number;
	exp?: number;
}

export function generateToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET as string) as unknown as JWTPayload;
	} catch {
		return null;
	}
}
