import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { TimerTime } from './TimerTime';

export type TrainingTimer = {
	workoutType: WorkoutType;
	phases: TrainingTimerPhase[];
};

export type TrainingTimerPhase = {
	duration: TimerTime;
	exercise?: unknown; // TODO: Add exercise type
};
