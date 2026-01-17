import { View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { bgToTextColor, formatTime } from '../../../domain/timerUtils';

type TimerCountdownDisplayProps = {
	colorClassName: string;
};

export const TimerCountdownDisplay = ({ colorClassName }: TimerCountdownDisplayProps) => {
	const opacity = useSharedValue(1);
	const textColorClass = bgToTextColor(colorClassName);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value
	}));

	const formattedTime = formatTime(10000);

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`text-center text-7xl font-bold tabular-nums ${textColorClass}`}>
					{formattedTime}
				</Span>
			</Animated.View>
		</View>
	);
};
