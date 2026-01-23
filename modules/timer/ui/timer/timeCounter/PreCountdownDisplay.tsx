import Animated, { Easing, withTiming } from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';

import { useFadeSlideTransition } from '../../../hooks/useFadeSlideTransition';

type PreCountdownDisplayProps = {
	frame: TimerFrame;
};

export const PreCountdownDisplay = ({ frame }: PreCountdownDisplayProps) => {
	const { animatedStyle, displayValue } = useFadeSlideTransition(frame.time); // TODO: Format

	return (
		<Animated.View
			entering={() => {
				'worklet';
				const duration = 150;
				const easing = Easing.out(Easing.ease);
				return {
					initialValues: { opacity: 0, transform: [{ scale: 0.7 }] },
					animations: {
						opacity: withTiming(1, { duration, easing }),
						transform: [{ scale: withTiming(1, { duration, easing }) }]
					}
				};
			}}
			className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`font-mono-black text-center text-9xl text-red-500`}>{displayValue}</Span>
			</Animated.View>
		</Animated.View>
	);
};
