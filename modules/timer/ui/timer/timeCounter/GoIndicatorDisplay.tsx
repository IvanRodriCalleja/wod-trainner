import { View } from 'react-native';

import Animated, {
	Easing,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
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

	useAnimatedReaction(
		() => 1,
		(_, previous) => {
			if (previous !== null) return; // Only run on mount

			// Entrance animation: fade in
			opacity.value = withTiming(1, { duration: 200 });

			// Scale: spring entrance, then pulse after delay
			scale.value = withSequence(
				withSpring(1, { damping: 12, stiffness: 200 }),
				withDelay(
					100,
					withRepeat(
						withSequence(
							withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
							withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
						),
						-1,
						true
					)
				)
			);
		},
		[]
	);

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
