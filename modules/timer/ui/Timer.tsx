import { Div } from '@wod-trainer/strict-dom';

import { CircularProgress } from './timer/Circle';
import { PulsingRing } from './timer/PulsingRing';

const colorClassName = 'bg-amber-400';

export const Timer = () => {
	return (
		<Div className="relative flex aspect-square w-full items-center justify-center">
			<PulsingRing colorClassName={colorClassName} />
			<CircularProgress
				progress={0.75} // 0 to 1
				colorClassName={colorClassName}
				isPaused={false}
			/>
		</Div>
	);
};
