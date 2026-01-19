import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { TimerPhase } from './TimerPhase';
import { TimerTime } from './TimerTime';

export type TimerFrame = {
	phase: TimerPhase;
	workoutType: WorkoutType;
	time: TimerTime;
	remainingTotalTime: TimerTime;
};
