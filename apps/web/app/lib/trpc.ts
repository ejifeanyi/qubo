import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/trpc`,
			headers() {
				const token = localStorage.getItem("auth-token");
				return token ? { authorization: `Bearer ${token}` } : {};
			},
		}),
	],
});
