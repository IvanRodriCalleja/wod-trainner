import { z } from 'zod';

export const emomSchema = z.object({
	time: z.number().nonnegative(),
	rounds: z.number().nonnegative()
});

export type EMOM = z.infer<typeof emomSchema>;
