import { useEffect, useRef, useState } from 'react';

import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming
} from 'react-native-reanimated';

const ANIMATION_DURATION = 150;
const SCALE_START = 0.7;

/**
 * Hook for fade-scale transitions on value changes
 * Old value fades out while scaling down, new value fades in from small to normal
 */
export const useFadeSlideTransition = <T extends number | string>(value: T) => {
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);
	// TODO: Is it needed the displayValue? it shouldn't
	const [displayValue, setDisplayValue] = useState(value);
	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		// Animate out (fade + scale down), then animate in (fade + scale up from small)
		opacity.value = withSequence(
			withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) }),
			withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) })
		);

		scale.value = withSequence(
			withTiming(SCALE_START, {
				duration: ANIMATION_DURATION,
				easing: Easing.out(Easing.ease)
			}),
			// Jump to small size instantly for the new value
			withTiming(SCALE_START, { duration: 0 }),
			withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) })
		);

		// Update the display value at the midpoint of the animation
		const timeout = setTimeout(() => {
			setDisplayValue(value);
		}, ANIMATION_DURATION);

		return () => clearTimeout(timeout);
	}, [value]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value }]
	}));

	return { animatedStyle, displayValue };
};
