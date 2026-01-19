import { useState } from 'react';

import { TimerState } from '../domain/TimerState';
import { useFrameTick } from './useFrameTick';

export const useTimerNew = () => {
	const [timerState, setPhase] = useState<TimerState>(TimerState.NOT_STARTED);

	useFrameTick({
		onTick: tickIndex => {
			console.log('tick', tickIndex);
		},
		isRunning: timerState === TimerState.RUNNING
	});

	return { timerState };
};
