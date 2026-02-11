import { Div } from '@wod-trainer/strict-dom';

import { TimerFrame } from '../domain/TimerFrame';
import { TimerState } from '../domain/TimerState';
import { useTimerNew } from '../hooks/useTimerNew';
import { CircularProgress } from './timer/Circle';
import { PauseOverlay } from './timer/PauseOverlay';
import { PulsingRing } from './timer/PulsingRing';
import { TimeCounter } from './timer/TimeCounter';

const bgColorClassName = 'bg-amber-500';
const textColorClassName = 'text-amber-500';

type TimerProps = {
	initialFrame: TimerFrame;
	maxFrames: number;
	onNextFrame: (frameTickIndex: number) => TimerFrame;
};

export const Timer = ({ initialFrame, maxFrames, onNextFrame }: TimerProps) => {
	const { timerState, frame, toggleTimer } = useTimerNew({ initialFrame, maxFrames, onNextFrame });

	const isRunning = timerState === TimerState.RUNNING;

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={bgColorClassName} isRunning={isRunning} />
			<CircularProgress progress={frame.progress} colorClassName={bgColorClassName} />
			<TimeCounter textColorClassName={textColorClassName} frame={frame} />
			{/*<PauseOverlay phase={timerState} toggleTimer={toggleTimer} />*/}
		</Div>
	);
};
