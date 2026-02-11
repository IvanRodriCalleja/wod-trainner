import { useState } from 'react';

import { TimerFrame } from '../domain/TimerFrame';
import { TimerState } from '../domain/TimerState';
import { useFrameTick } from './useFrameTick';

type UseTimerNewProps = {
	initialFrame: TimerFrame;
	maxFrames: number;
	onNextFrame: (frameTickIndex: number) => TimerFrame;
};

export const useTimerNew = ({ initialFrame, maxFrames, onNextFrame }: UseTimerNewProps) => {
	const [timerState, setPhase] = useState<TimerState>(TimerState.NOT_STARTED);

	const [frame, setFrame] = useState<TimerFrame>(initialFrame);

	const { toggle } = useFrameTick({
		startAtIndex: 1,
		maxTicks: maxFrames,
		onTick: tickIndex => {
			setFrame(() => onNextFrame(tickIndex));
		}
	});

	const toggleTimer = () => {
		toggle();
		setPhase(prev => (prev === TimerState.RUNNING ? TimerState.PAUSED : TimerState.RUNNING));
	};

	return { timerState, frame, toggleTimer };
};
