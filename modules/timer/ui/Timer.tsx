import { Div } from '@wod-trainer/strict-dom';

import { TimerState } from '../domain/TimerState';
import { TrainingTimer } from '../domain/TrainningTimer';
import { useTimerNew } from '../hooks/useTimerNew';
import { CircularProgress } from './timer/Circle';
import { PauseOverlay } from './timer/PauseOverlay';
import { PulsingRing } from './timer/PulsingRing';
import { TimeCounter } from './timer/TimeCounter';

const colorClassName = 'bg-amber-400';

type TimerProps = {
	trainingTimer: TrainingTimer;
};

export const Timer = ({ trainingTimer }: TimerProps) => {
	const { timerState, frame, toggleTimer } = useTimerNew({ trainingTimer });

	const isRunning = timerState === TimerState.RUNNING;

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={colorClassName} isRunning={isRunning} />
			<CircularProgress progress={frame.progress} colorClassName={colorClassName} />
			<TimeCounter colorClassName={colorClassName} frame={frame} />
			<PauseOverlay phase={timerState} toggleTimer={toggleTimer} />
		</Div>
	);
};
