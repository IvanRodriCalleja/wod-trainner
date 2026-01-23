import { Div } from '@wod-trainer/strict-dom';

import { TimerState } from '../domain/TimerState';
import { TrainingTimer } from '../domain/TrainingTimer';
import { useTimerNew } from '../hooks/useTimerNew';
import { CircularProgress } from './timer/Circle';
import { PauseOverlay } from './timer/PauseOverlay';
import { PulsingRing } from './timer/PulsingRing';
import { TimeCounter } from './timer/TimeCounter';

const bgColorClassName = 'bg-amber-500';
const textColorClassName = 'text-amber-500';

type TimerProps = {
	trainingTimer: TrainingTimer;
};

export const Timer = ({ trainingTimer }: TimerProps) => {
	const { timerState, frame, toggleTimer } = useTimerNew({ trainingTimer });

	const isRunning = timerState === TimerState.RUNNING;

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={bgColorClassName} isRunning={isRunning} />
			<CircularProgress progress={frame.progress} colorClassName={bgColorClassName} />
			<TimeCounter textColorClassName={textColorClassName} frame={frame} />
			<PauseOverlay phase={timerState} toggleTimer={toggleTimer} />
		</Div>
	);
};
