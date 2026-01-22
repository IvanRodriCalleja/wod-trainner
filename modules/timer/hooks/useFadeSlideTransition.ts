import { useEffect, useRef, useState } from 'react';

import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming
} from 'react-native-reanimated';

const ANIMATION_DURATION = 150;
const SLIDE_DISTANCE = 20;

/**
 * Hook for fade-slide transitions on value changes
 * Old value fades out sliding up, new value fades in from below
 */
export const useFadeSlideTransition = <T extends number | string>(value: T) => {
	const opacity = useSharedValue(1);
	const translateY = useSharedValue(0);
	// TODO: Is it needed the displayValue? it shouldn't
	const [displayValue, setDisplayValue] = useState(value);
	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		// Animate out (fade + slide up), then animate in (fade + slide from below)
		opacity.value = withSequence(
			withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) }),
			withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) })
		);

		translateY.value = withSequence(
			withTiming(-SLIDE_DISTANCE, {
				duration: ANIMATION_DURATION,
				easing: Easing.out(Easing.ease)
			}),
			// Jump to bottom position instantly
			withTiming(SLIDE_DISTANCE, { duration: 0 }),
			withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) })
		);

		// Update the display value at the midpoint of the animation
		const timeout = setTimeout(() => {
			setDisplayValue(value);
		}, ANIMATION_DURATION);

		return () => clearTimeout(timeout);
	}, [value]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }]
	}));

	return { animatedStyle, displayValue };
};
