import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";

export const createServer = (): Express => {
	const app = express();

	app
		.disable("x-powered-by")
		.use(morgan("dev"))
		.use(urlencoded({ extended: true }))
		.use(json())
		.use(
			cors({
				origin: ["http://localhost:3000"],
				credentials: true,
			})
		)
		.get("/status", (_, res) => {
			return res.json({ ok: true });
		})
		.get("/auth/callback", async (req, res) => {
			try {
				const { code } = req.query;

				if (!code || typeof code !== "string") {
					return res.redirect(
						"http://localhost:3000/auth-callback?error=no_code"
					);
				}

				res.redirect(
					`http://localhost:3000/auth-callback?code=${encodeURIComponent(code)}`
				);
			} catch (error) {
				console.error("OAuth callback error:", error);
				res.redirect("http://localhost:3000/auth-callback?error=auth_failed");
			}
		});

	app.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({
			router: appRouter,
		})
	);

	return app;
};
