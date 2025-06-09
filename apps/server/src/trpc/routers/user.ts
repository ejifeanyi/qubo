import { z } from "zod";
import { router, protectedProcedure } from "../index";

export const userRouter = router({
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.prisma.user.findUnique({
			where: { id: ctx.user.id },
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
				createdAt: true,
			},
		});
	}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			return await ctx.prisma.user.update({
				where: { id: ctx.user.id },
				data: input,
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
				},
			});
		}),
});
