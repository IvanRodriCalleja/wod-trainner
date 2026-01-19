import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
};

const Blur = withUniwind(BlurView);

const PlayIcon = withUniwind(Ionicons, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});
export const PauseOverlay = ({ visible, color }: PauseOverlayProps) => {
	/*const showProgress = useSharedValue(0);
	const breathingScale = useSharedValue(1);

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
		transform: [{ scale: breathingScale.value }]
	}));*/

	return (
		/*<Animated.View
			style={containerStyle}
			className="absolute inset-0 z-20 flex items-center justify-center">
			<Animated.View style={breathingStyle}>
				<Div className="relative inset-0 aspect-square w-[60%] rounded-full bg-red-500 opacity-10">
					<BlurView
						blurType="light"
						blurAmount={100}
						reducedTransparencyFallbackColor="white"
						style={{
							position: 'absolute',
							backgroundColor: 'blue',
							bottom: 0,
							left: 0,
							width: '100%',
							height: '50%'
						}}
					/>
				</Div>
			</Animated.View>
		</Animated.View>*/

		<Div
			className={`relative inset-0 aspect-square w-[40%] overflow-hidden rounded-full border-2 border-emerald-600`}>
			<Div className="absolute inset-0 bg-emerald-500/40" />
			{/* in terms of positioning and zIndex-ing everything before the BlurView will be blurred */}
			<Blur
				className="flex h-full w-full items-center justify-center"
				blurType="light"
				blurAmount={16}>
				<PlayIcon name="play" size={92} colorClassName="bg-emerald-400" />
			</Blur>
		</Div>
	);
};
