import { Pressable, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { withUniwind } from 'uniwind';

import { Div } from '@wod-trainer/strict-dom';

import { TimerState } from '../../domain/TimerState';

type PauseOverlayProps = {
	phase: TimerState;
	toggleTimer: () => void;
};

const Blur = withUniwind(BlurView);

const PlayIcon = withUniwind(Ionicons, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});
export const PauseOverlay = ({ phase, toggleTimer }: PauseOverlayProps) => {
	const showPlayButton = phase === TimerState.NOT_STARTED || phase === TimerState.PAUSED;

	// Initialize based on initial state - visible if NOT_STARTED or PAUSED
	const showProgress = useSharedValue(showPlayButton ? 1 : 0);
	const breathingScale = useSharedValue(1);
	const pressScale = useSharedValue(1);
	const rippleScale = useSharedValue(0);
	const rippleOpacity = useSharedValue(0);

	const startBreathingAnimation = () => {
		breathingScale.value = withRepeat(
			withSequence(
				withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
				withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
			),
			-1,
			true
		);
	};

	const stopBreathingAnimation = () => {
		breathingScale.value = withTiming(1, { duration: 200 });
	};

	const containerStyle = useAnimatedStyle(() => ({
		opacity: showProgress.value,
		transform: [{ scale: interpolate(showProgress.value, [0, 1], [0.8, 1]) }]
	}));

	const dimmingOverlayStyle = useAnimatedStyle(() => ({
		opacity: interpolate(showProgress.value, [0, 1], [0, 0.5])
	}));

	const breathingStyle = useAnimatedStyle(() => ({
		transform: [{ scale: breathingScale.value * pressScale.value }]
	}));

	const rippleStyle = useAnimatedStyle(() => ({
		transform: [{ scale: rippleScale.value }],
		opacity: rippleOpacity.value
	}));

	const handlePressIn = () => {
		// Scale animation
		pressScale.value = withSpring(0.92, { stiffness: 400, damping: 15 });
		// Ripple animation
		rippleScale.value = 0;
		rippleOpacity.value = 0.6;
		rippleScale.value = withTiming(2.5, { duration: 400, easing: Easing.out(Easing.ease) });
		rippleOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
	};

	const handlePressOut = () => {
		pressScale.value = withSpring(1, { stiffness: 400, damping: 15 });
	};

	const handlePress = () => {
		if (phase === TimerState.COMPLETED) return;

		if (showPlayButton) {
			// Visible → Running: fade-out, then toggle
			stopBreathingAnimation();
			showProgress.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) }, () => {
				scheduleOnRN(toggleTimer);
			});
		} else {
			// Running → Paused: toggle, then fade-in
			toggleTimer();
			showProgress.value = withSpring(1, { stiffness: 300, damping: 25 }, () => {
				scheduleOnRN(startBreathingAnimation);
			});
		}
	};

	return (
		<Animated.View className="absolute inset-0 z-20">
			{/* Dimming overlay */}
			<Animated.View
				style={dimmingOverlayStyle}
				className="absolute inset-0 rounded-full bg-black"
				pointerEvents="none"
			/>
			<Pressable
				className="h-full w-full items-center justify-center"
				onPress={handlePress}
				onPressIn={showPlayButton ? handlePressIn : undefined}
				onPressOut={showPlayButton ? handlePressOut : undefined}>
				<Animated.View
					style={[containerStyle, breathingStyle]}
					pointerEvents={showPlayButton ? 'auto' : 'none'}>
					<Div
						className={`relative aspect-square w-[120] overflow-hidden rounded-full border-2 border-emerald-600`}>
						<Div className="absolute inset-0 bg-emerald-500/40" />
						<Animated.View style={[styles.ripple, rippleStyle]} />
						{/* in terms of positioning and zIndex-ing everything before the BlurView will be blurred */}
						<Blur
							className="flex h-full w-full items-center justify-center"
							blurType="light"
							blurAmount={16}>
							<PlayIcon name="play" size={92} colorClassName="bg-emerald-400" className="ml-2.5" />
						</Blur>
					</Div>
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
};

// TODO: ReMOVE FOR UNIWIND

const styles = StyleSheet.create({
	ripple: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: '100%',
		height: '100%',
		marginLeft: '-50%',
		marginTop: '-50%',
		borderRadius: 9999,
		backgroundColor: 'rgba(255, 255, 255, 0.4)'
	}
});
