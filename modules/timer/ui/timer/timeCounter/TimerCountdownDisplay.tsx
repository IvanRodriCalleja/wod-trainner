import { View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { formatTime } from 'modules/timer/domain/TimerTime';

import { bgToTextColor } from '../../../domain/timerUtils';

type TimerCountdownDisplayProps = {
	colorClassName: string;
	frame: TimerFrame;
};

export const TimerCountdownDisplay = ({ colorClassName, frame }: TimerCountdownDisplayProps) => {
	const opacity = useSharedValue(1);
	const textColorClass = bgToTextColor(colorClassName); // TODO: Review

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value
	}));

	const formattedTime = formatTime(frame.time);

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
