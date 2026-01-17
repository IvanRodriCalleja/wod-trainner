import { View } from 'react-native';

import Animated from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { bgToTextColor } from '../../../domain/timerUtils';
import { useFadeSlideTransition } from '../../../hooks/useFadeSlideTransition';

type PreCountdownDisplayProps = {
	colorClassName: string;
};

export const PreCountdownDisplay = ({ colorClassName }: PreCountdownDisplayProps) => {
	const { animatedStyle, displayValue } = useFadeSlideTransition(10);
	const textColorClass = bgToTextColor(colorClassName);

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`text-center text-9xl font-bold ${textColorClass}`}>{displayValue}</Span>
			</Animated.View>
		</View>
	);
};
