import { router } from "./index";
import { authRouter } from "./routers/auth";
import { emailRouter } from "./routers/email";
import { userRouter } from "./routers/user";


export const appRouter = router({
	auth: authRouter,
	user: userRouter,
	email: emailRouter,
});

export type AppRouter = typeof appRouter;
