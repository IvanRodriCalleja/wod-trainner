import { useEffect } from 'react';
import { View } from 'react-native';

import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming
} from 'react-native-reanimated';

import { Span } from '@wod-trainer/strict-dom';

import { bgToTextColor } from '../../../domain/timerUtils';

type GoIndicatorDisplayProps = {
	colorClassName: string;
};

export const GoIndicatorDisplay = ({ colorClassName }: GoIndicatorDisplayProps) => {
	const scale = useSharedValue(0.5);
	const opacity = useSharedValue(0);
	const textColorClass = bgToTextColor(colorClassName);

	useEffect(() => {
		// Entrance animation: scale up with spring + fade in
		opacity.value = withTiming(1, { duration: 200 });
		scale.value = withSpring(1, {
			damping: 12,
			stiffness: 200
		});

		// After entrance, start pulsing
		const pulseDelay = setTimeout(() => {
			scale.value = withRepeat(
				withSequence(
					withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);
		}, 300);

		return () => clearTimeout(pulseDelay);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value }]
	}));

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Animated.View style={animatedStyle}>
				<Span className={`text-center text-8xl font-bold ${textColorClass}`}>GO!</Span>
			</Animated.View>
		</View>
	);
};
