import { z } from 'zod';

import { createPreWorkoutFrames, createTimer } from 'modules/timer/domain/Timer';
import { TimerFrame, createTimerFrame } from 'modules/timer/domain/TimerFrame';
import { TimerPhase } from 'modules/timer/domain/TimerPhase';
import { WorkoutType } from 'modules/workout/domain/WorkoutType';

export const emomSchema = z.object({
	time: z.number().nonnegative(),
	rounds: z.number().nonnegative()
});

export type EMOM = z.infer<typeof emomSchema>;

export const compileEmomTimer = (emom: EMOM) => {
	return [
		...createPreWorkoutFrames({ countdownDuration: 10, showGoFrame: true, showPlaceholder: true }),
		...createTrainingFrames(emom)
	];
};

const createTrainingFrames = (emom: EMOM): TimerFrame[] => {
	const totalTime = emom.rounds * emom.time;
	let elapsedFrames = 0;
	return Array.from({ length: emom.rounds }, () =>
		Array.from({ length: emom.time }, (_, i) => {
			const frame = createTimerFrame({
				workoutType: WorkoutType.EMOM,
				remainingTotalTime: totalTime - elapsedFrames,
				progress: (i + 1) / emom.time,
				time: emom.time - i,
				phase: TimerPhase.RUNNING
			});
			elapsedFrames += 1;
			return frame;
		})
	).flat();
};
