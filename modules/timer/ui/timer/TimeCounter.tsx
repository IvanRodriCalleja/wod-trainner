import { TimerPhase } from 'modules/timer/domain/types';

import { GoIndicatorDisplay } from './timeCounter/GoIndicatorDisplay';
import { PreCountdownDisplay } from './timeCounter/PreCountdownDisplay';
import { TimerCountdownDisplay } from './timeCounter/TimerCountdownDisplay';

type TimeCounterProps = {
	colorClassName: string;
};

export const TimeCounter = ({ colorClassName }: TimeCounterProps) => {
	const phase = TimerPhase.PRE_COUNTDOWN;

	return (
		<>
			{phase === TimerPhase.PRE_COUNTDOWN && (
				<PreCountdownDisplay colorClassName={colorClassName} />
			)}
			{phase === TimerPhase.GO && <GoIndicatorDisplay colorClassName={colorClassName} />}
			{phase === TimerPhase.RUNNING && <TimerCountdownDisplay colorClassName={colorClassName} />}
		</>
	);
};
