import { useEffect, useState } from 'react';

import { Div } from '@wod-trainer/strict-dom';

import { TimerPhase } from '../domain/types';
import { CircularProgress } from './timer/Circle';
import { PulsingRing } from './timer/PulsingRing';
import { TimeCounter } from './timer/TimeCounter';

const colorClassName = 'bg-amber-400';

// Demo timer duration in ms
const DEMO_TIMER_DURATION = 30000; // 30 seconds

export const Timer = () => {
	const [phase, setPhase] = useState<TimerPhase>(TimerPhase.PRE_COUNTDOWN);
	const [countdownValue, setCountdownValue] = useState(10);
	const [timeRemainingMs, setTimeRemainingMs] = useState(DEMO_TIMER_DURATION);

	useEffect(() => {
		// Pre-countdown phase: 10 -> 1
		if (phase === TimerPhase.PRE_COUNTDOWN) {
			if (countdownValue > 1) {
				const timer = setTimeout(() => {
					setCountdownValue(prev => prev - 1);
				}, 1000);
				return () => clearTimeout(timer);
			} else {
				// Transition to GO phase
				const timer = setTimeout(() => {
					setPhase(TimerPhase.GO);
				}, 1000);
				return () => clearTimeout(timer);
			}
		}

		// GO phase: show for 1 second then start timer
		if (phase === TimerPhase.GO) {
			const timer = setTimeout(() => {
				setPhase(TimerPhase.RUNNING);
			}, 1000);
			return () => clearTimeout(timer);
		}

		// Running phase: countdown the timer
		if (phase === TimerPhase.RUNNING && timeRemainingMs > 0) {
			const timer = setInterval(() => {
				setTimeRemainingMs(prev => Math.max(0, prev - 100));
			}, 100);
			return () => clearInterval(timer);
		}
	}, [phase, countdownValue, timeRemainingMs]);

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={colorClassName} />
			<CircularProgress progress={0.5} colorClassName={colorClassName} isPaused={false} />
			<TimeCounter colorClassName={colorClassName} />
		</Div>
	);
};
