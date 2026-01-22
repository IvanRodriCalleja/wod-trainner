import { Div } from '@wod-trainer/strict-dom';

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

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={colorClassName} />
			<CircularProgress progress={0.5} colorClassName={colorClassName} isPaused={true} />
			<TimeCounter colorClassName={colorClassName} frame={frame} />
			<PauseOverlay phase={timerState} toggleTimer={toggleTimer} />
		</Div>
	);
};
