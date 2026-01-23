import { z } from 'zod';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

export const trainingTimerPhaseSchema = z.object({
	duration: z.number().nonnegative(),
	exercise: z.unknown().optional() // TODO: Add exercise schema
});

export const trainingTimerSchema = z.object({
	workoutType: z.nativeEnum(WorkoutType),
	phases: z.array(trainingTimerPhaseSchema)
});

export type TrainingTimerPhase = z.infer<typeof trainingTimerPhaseSchema>;
export type TrainingTimer = z.infer<typeof trainingTimerSchema>;
