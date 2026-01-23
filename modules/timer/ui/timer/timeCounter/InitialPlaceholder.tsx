import Animated, { Easing, withTiming } from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { formatTime } from 'modules/timer/domain/TimerTime';

type PreCountdownDisplayProps = {
	frame: TimerFrame;
};

export const InitialPlaceholder = ({ frame }: PreCountdownDisplayProps) => {
	return (
		<Animated.View
			exiting={() => {
				'worklet';
				const duration = 250;
				const easing = Easing.out(Easing.ease);
				return {
					initialValues: { opacity: 1, transform: [{ scale: 1 }] },
					animations: {
						opacity: withTiming(0, { duration, easing }),
						transform: [{ scale: withTiming(0, { duration, easing }) }]
					}
				};
			}}
			className="absolute inset-0 flex items-center justify-center"
		>
			<Span className={`font-mono-black text-center text-8xl text-neutral-500`}>
				{formatTime(frame.time)}
			</Span>
		</Animated.View>
	);
};
