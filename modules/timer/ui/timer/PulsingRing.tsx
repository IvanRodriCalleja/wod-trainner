import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Canvas, Circle } from '@shopify/react-native-skia';
import {
	Easing,
	cancelAnimation,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const PulseCircle = withUniwind(Circle, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});

type PulsingRingProps = {
	colorClassName: string;
	isRunning: boolean;
};

export const PulsingRing = ({ colorClassName, isRunning }: PulsingRingProps) => {
	const [size, setSize] = useState(0);

	const strokeWidth = 2;
	const maxScale = 1.1;
	const padding = (size * maxScale - size) / 2 + strokeWidth;
	const canvasSize = size * maxScale + padding * 2;

	const center = canvasSize / 2;
	const radius = (size - strokeWidth) / 2;

	const scale = useSharedValue(1);
	const opacity = useSharedValue(0.3);

	useEffect(() => {
		if (isRunning) {
			// Scale animation: 1 -> 1.08 -> 1
			scale.value = withRepeat(
				withSequence(
					withTiming(maxScale, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);

			// Opacity animation: 0.3 -> 0 -> 0.3
			opacity.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);
		} else {
			cancelAnimation(scale);
			cancelAnimation(opacity);
			scale.value = 1;
			opacity.value = 0;
		}
	}, [isRunning, scale, opacity]);

	const animatedRadius = useDerivedValue(() => radius * scale.value);
	const animatedOpacity = useDerivedValue(() => opacity.value);

	return (
		<View
			className="absolute inset-0 flex items-center justify-center"
			onLayout={e => setSize(e.nativeEvent.layout.width)}>
			{size > 0 && (
				<Canvas
					style={{
						width: canvasSize,
						height: canvasSize
					}}>
					<PulseCircle
						cx={center}
						cy={center}
						r={animatedRadius}
						style="stroke"
						strokeWidth={strokeWidth}
						colorClassName={colorClassName}
						opacity={animatedOpacity}
					/>
				</Canvas>
			)}
		</View>
	);
};
