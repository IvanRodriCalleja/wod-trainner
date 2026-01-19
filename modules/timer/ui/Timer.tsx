import { Div } from '@wod-trainer/strict-dom';

import { TimerState } from '../domain/TimerState';
import { useTimerNew } from '../hooks/useTimerNew';
import { CircularProgress } from './timer/Circle';
import { PauseOverlay } from './timer/PauseOverlay';
import { PulsingRing } from './timer/PulsingRing';
import { TimeCounter } from './timer/TimeCounter';

const colorClassName = 'bg-amber-400';

export const Timer = () => {
	const { timerState } = useTimerNew();

	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={colorClassName} />
			<CircularProgress progress={0.5} colorClassName={colorClassName} isPaused={true} />
			<TimeCounter colorClassName={colorClassName} />
			<PauseOverlay
				visible={timerState === TimerState.NOT_STARTED}
				colorClassName={colorClassName}
			/>
		</Div>
	);
};
