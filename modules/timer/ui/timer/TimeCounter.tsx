import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { TimerPhase } from 'modules/timer/domain/TimerPhase';

import { GoIndicatorDisplay } from './timeCounter/GoIndicatorDisplay';
import { InitialPlaceholder } from './timeCounter/InitialPlaceholder';
import { PreCountdownDisplay } from './timeCounter/PreCountdownDisplay';
import { TimerCountdownDisplay } from './timeCounter/TimerCountdownDisplay';

type TimeCounterProps = {
	textColorClassName: string;
	frame: TimerFrame;
};

export const TimeCounter = ({ textColorClassName, frame }: TimeCounterProps) => {
	return (
		<>
			{frame.phase === TimerPhase.PLACEHOLDER && <InitialPlaceholder frame={frame} />}
			{frame.phase === TimerPhase.PRE_COUNTDOWN && <PreCountdownDisplay frame={frame} />}
			{frame.phase === TimerPhase.GO && (
				<GoIndicatorDisplay textColorClassName={textColorClassName} />
			)}
			{frame.phase === TimerPhase.RUNNING && (
				<TimerCountdownDisplay textColorClassName={textColorClassName} frame={frame} />
			)}
		</>
	);
};
