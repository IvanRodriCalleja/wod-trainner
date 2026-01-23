import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BlurMask, Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
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
};

export const CircularProgress = ({ progress, colorClassName }: CircularProgressProps) => {
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

	useEffect(() => {
		progressValue.value = withTiming(progress, {
			duration: 100,
			easing: Easing.linear
		});
	}, [progress]);

	// Animate the "end" prop (0 to 1)
	const animatedEnd = useDerivedValue(() => progressValue.value);

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
					<Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: center, y: center }}>
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
						opacity={0.3}
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
