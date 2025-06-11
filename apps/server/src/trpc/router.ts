import { router } from "./index";
import { authRouter } from "./routers/auth";
import { emailRouter } from "./routers/email";
import { gmailRouter } from "./routers/gmail";
import { userRouter } from "./routers/user";


export const appRouter = router({
	auth: authRouter,
	user: userRouter,
	email: emailRouter,
	gmail: gmailRouter,
});

export type AppRouter = typeof appRouter;
