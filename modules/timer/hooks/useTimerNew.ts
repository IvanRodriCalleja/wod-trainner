import { useMemo, useState } from 'react';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { TimerFrame } from '../domain/TimerFrame';
import { TimerPhase } from '../domain/TimerPhase';
import { TimerState } from '../domain/TimerState';
import { TrainingTimer } from '../domain/TrainningTimer';
import { useFrameTick } from './useFrameTick';

type UseTimerNewProps = {
	trainingTimer: TrainingTimer;
};

const initialPlaceholderFrame: TimerFrame = {
	phase: TimerPhase.PLACEHOLDER,
	workoutType: WorkoutType.REST,
	time: 0,
	remainingTotalTime: 0,
	progress: 0
};

const countDownFrames: TimerFrame[] = Array.from({ length: 10 }, (_, i) => ({
	phase: TimerPhase.PRE_COUNTDOWN,
	workoutType: WorkoutType.REST,
	time: 10 - i,
	remainingTotalTime: 0, // Not shown for count down
	progress: 0
}));

const goFrame: TimerFrame = {
	phase: TimerPhase.GO,
	workoutType: WorkoutType.REST,
	time: 0,
	remainingTotalTime: 0,
	progress: 0
};

const compileTrainingTimer = (trainingTimer: TrainingTimer): TimerFrame[] => {
	const totalTrainingTime = trainingTimer.phases.reduce((acc, phase) => acc + phase.duration, 0);

	let frameCount = 0;

	return trainingTimer.phases
		.map(phase => {
			const secondsInPase = phase.duration;

			// We create as many frames as seconds in the pase, one frame per second
			const frames = Array.from({ length: secondsInPase }, (_, i) => {
				frameCount++;
				const progress = 1 - (secondsInPase - i) / secondsInPase;

				return {
					phase: TimerPhase.RUNNING,
					workoutType: trainingTimer.workoutType,
					time: secondsInPase - i,
					remainingTotalTime: totalTrainingTime - frameCount,
					progress
				} satisfies TimerFrame;
			});

			return frames;
		})
		.flatMap(frames => frames);
};

export const useTimerNew = ({ trainingTimer }: UseTimerNewProps) => {
	const [timerState, setPhase] = useState<TimerState>(TimerState.NOT_STARTED);
	const timeline = useMemo(
		() => [
			initialPlaceholderFrame,
			...countDownFrames,
			goFrame,
			...compileTrainingTimer(trainingTimer)
		],
		[trainingTimer]
	);
	const [frame, setFrame] = useState<TimerFrame>(timeline[0]);

	const { toggle } = useFrameTick({
		startAtIndex: 1,
		maxTicks: timeline.length,
		onTick: tickIndex => {
			setFrame(timeline[tickIndex]);
		}
	});

	const toggleTimer = () => {
		toggle();
		setPhase(prev => (prev === TimerState.RUNNING ? TimerState.PAUSED : TimerState.RUNNING));
	};

	return { timerState, frame, toggleTimer };
};
