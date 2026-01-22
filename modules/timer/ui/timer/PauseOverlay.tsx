import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { Div } from '@wod-trainer/strict-dom';

type PauseOverlayProps = {
	visible: boolean;
	color: string;
	onPress?: () => void;
};

const Blur = withUniwind(BlurView);

const PlayIcon = withUniwind(Ionicons, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});
export const PauseOverlay = ({ visible, color, onPress }: PauseOverlayProps) => {
	const showProgress = useSharedValue(0);
	const breathingScale = useSharedValue(1);
	const pressScale = useSharedValue(1);
	const rippleScale = useSharedValue(0);
	const rippleOpacity = useSharedValue(0);

	useEffect(() => {
		showProgress.value = withSpring(visible ? 1 : 0, {
			stiffness: 300,
			damping: 25
		});

		if (visible) {
			breathingScale.value = withRepeat(
				withSequence(
					withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);
		} else {
			breathingScale.value = withTiming(1, { duration: 200 });
		}
	}, [visible, showProgress, breathingScale]);

	const pointerEvents = useDerivedValue(() => (showProgress.value > 0.5 ? 'auto' : 'none'));

	const containerStyle = useAnimatedStyle(() => ({
		opacity: showProgress.value,
		transform: [{ scale: interpolate(showProgress.value, [0, 1], [0.8, 1]) }],
		pointerEvents: pointerEvents.value
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

	return (
		<Animated.View style={containerStyle} className="absolute inset-0 z-20">
			<Animated.View style={breathingStyle}>
				<Pressable
					style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
					onPress={onPress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}>
					<Div
						className={`relative aspect-square w-[40%] overflow-hidden rounded-full border-2 border-emerald-600`}>
						<Div className="absolute inset-0 bg-emerald-500/40" />
						<Animated.View style={[styles.ripple, rippleStyle]} />
						{/* in terms of positioning and zIndex-ing everything before the BlurView will be blurred */}
						<Blur
							className="flex h-full w-full items-center justify-center"
							blurType="light"
							blurAmount={16}>
							<PlayIcon name="play" size={92} colorClassName="bg-emerald-400" />
						</Blur>
					</Div>
				</Pressable>
			</Animated.View>
		</Animated.View>
	);
};

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
