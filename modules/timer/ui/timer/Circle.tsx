import { useState } from 'react';
import { View } from 'react-native';

import { BlurMask, Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import {
	Easing,
	useAnimatedReaction,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const UnfilledCircle = withUniwind(Circle, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});

const FilledCircle = withUniwind(Path, {
	color: {
		fromClassName: 'colorClassName',
		styleProperty: 'backgroundColor'
	}
});

type CircularProgressProps = {
	progress: number;
	colorClassName: string;
	isPaused: boolean;
};

export const CircularProgress = ({ progress, colorClassName, isPaused }: CircularProgressProps) => {
	const strokeWidth = 12;
	const [size, setSize] = useState(0);

	// Padding to prevent glow from being cut off
	const glowSize = 20;
	const padding = glowSize + 8;
	const canvasSize = size + padding * 2;

	const radius = (size - strokeWidth) / 2;
	const center = canvasSize / 2;

	// Create the full circle path ONCE (not inside animation)
	const circlePath = Skia.Path.Make();
	circlePath.addCircle(center, center, radius);

	// Animated values
	const progressValue = useSharedValue(0);
	const glowOpacity = useSharedValue(0.15);

	useAnimatedReaction(
		() => progress,
		(current, previous) => {
			if (current === previous) return;
			progressValue.value = withTiming(current, {
				duration: 100,
				easing: Easing.linear
			});
		},
		[progress]
	);

	useAnimatedReaction(
		() => isPaused,
		(paused, previousPaused) => {
			if (paused === previousPaused) return;
			if (paused) {
				glowOpacity.value = withTiming(0, { duration: 300 });
			} else {
				glowOpacity.value = withRepeat(
					withSequence(
						withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
						withTiming(0.1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
					),
					-1,
					true
				);
			}
		},
		[isPaused]
	);

	// Animate the "end" prop (0 to 1)
	const animatedEnd = useDerivedValue(() => progressValue.value);
	const animatedOpacity = useDerivedValue(() => (isPaused ? 0.5 : 1));

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
					{/* Background circle */}
					<UnfilledCircle
						cx={center}
						cy={center}
						r={radius}
						style="stroke"
						strokeWidth={strokeWidth}
						colorClassName="bg-neutral-500"
					/>

					{/* Progress arc */}
					<Group
						opacity={animatedOpacity}
						transform={[{ rotate: -Math.PI / 2 }]}
						origin={{ x: center, y: center }}>
						<FilledCircle
							path={circlePath}
							style="stroke"
							strokeWidth={strokeWidth}
							colorClassName={colorClassName}
							strokeCap="round"
							start={0}
							end={animatedEnd}
						/>
					</Group>

					{/* Glow effect (on top) */}
					<Group
						opacity={glowOpacity}
						transform={[{ rotate: -Math.PI / 2 }]}
						origin={{ x: center, y: center }}>
						<FilledCircle
							path={circlePath}
							style="stroke"
							strokeWidth={strokeWidth + 12}
							colorClassName={colorClassName}
							strokeCap="round"
							start={0}
							end={animatedEnd}>
							<BlurMask blur={28} style="normal" />
						</FilledCircle>
					</Group>
				</Canvas>
			)}
		</View>
	);
};
