import { PropsWithChildren } from 'react';

import {
	useReanimatedKeyboardAnimation,
	useWindowDimensions
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const KeyboardAvoidingContainer = ({ children }: PropsWithChildren) => {
	const { height } = useWindowDimensions();

	const { progress } = useReanimatedKeyboardAnimation();

	const rStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: withTiming(progress.get() === 1 ? -height * 0.15 : 0, {
						duration: 250
					})
				}
			]
		};
	});

	return <Animated.View style={rStyle}>{children}</Animated.View>;
};
