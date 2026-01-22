import { Text, View } from 'react-native';

import Animated from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { useFadeSlideTransition } from '../../../hooks/useFadeSlideTransition';

type PreCountdownDisplayProps = {
	colorClassName: string;
};

export const PreCountdownDisplay = ({ colorClassName }: PreCountdownDisplayProps) => {
	const { animatedStyle, displayValue } = useFadeSlideTransition(10);

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`font-mono-black text-center text-8xl text-neutral-500`}>00:00</Span>
			</Animated.View>
		</View>
	);
};
