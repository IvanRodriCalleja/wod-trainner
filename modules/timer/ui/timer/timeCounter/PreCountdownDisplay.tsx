import { View } from 'react-native';

import Animated from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';

import { useFadeSlideTransition } from '../../../hooks/useFadeSlideTransition';

type PreCountdownDisplayProps = {
	frame: TimerFrame;
};

export const PreCountdownDisplay = ({ frame }: PreCountdownDisplayProps) => {
	const { animatedStyle, displayValue } = useFadeSlideTransition(frame.time); // TODO: Format

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`font-mono-black text-center text-9xl text-red-500`}>{displayValue}</Span>
			</Animated.View>
		</View>
	);
};
