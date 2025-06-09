import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const createContext = async ({ req }: CreateExpressContextOptions) => {
	const token = req.headers.authorization?.replace("Bearer ", "");

	let user = null;
	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
				userId: string;
			};
			user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			});
		} catch (error) {
			// Token invalid, user remains null
		}
	}

	return {
		user,
		prisma,
	};
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.user,
		},
	});
});
