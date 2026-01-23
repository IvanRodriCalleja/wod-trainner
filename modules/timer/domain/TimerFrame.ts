import { z } from 'zod';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { TimerPhase } from './TimerPhase';

export const timerFrameSchema = z.object({
	phase: z.nativeEnum(TimerPhase),
	workoutType: z.nativeEnum(WorkoutType),
	time: z.number().nonnegative(),
	remainingTotalTime: z.number().nonnegative(),
	progress: z.number().min(0).max(1)
});

export type TimerFrame = z.infer<typeof timerFrameSchema>;

export const createTimerFrame = (input: TimerFrame): TimerFrame => input;
