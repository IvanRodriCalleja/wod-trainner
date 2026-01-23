import { useMemo, useState } from 'react';

import { createTimer } from '../domain/Timer';
import { TimerFrame } from '../domain/TimerFrame';
import { TimerState } from '../domain/TimerState';
import { TrainingTimer } from '../domain/TrainingTimer';
import { useFrameTick } from './useFrameTick';

type UseTimerNewProps = {
	trainingTimer: TrainingTimer;
};

export const useTimerNew = ({ trainingTimer }: UseTimerNewProps) => {
	const [timerState, setPhase] = useState<TimerState>(TimerState.NOT_STARTED);
	const timeline = useMemo(() => createTimer(trainingTimer), [trainingTimer]);
	const [frame, setFrame] = useState<TimerFrame>(timeline.frames[0]);

	const { toggle } = useFrameTick({
		startAtIndex: 1,
		maxTicks: timeline.frames.length,
		onTick: tickIndex => {
			setFrame(timeline.frames[tickIndex]);
		}
	});

	const toggleTimer = () => {
		toggle();
		setPhase(prev => (prev === TimerState.RUNNING ? TimerState.PAUSED : TimerState.RUNNING));
	};

	return { timerState, frame, toggleTimer };
};
