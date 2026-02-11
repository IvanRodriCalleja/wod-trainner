import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
	BlurMask,
	Canvas,
	Circle,
	Group,
	Path,
	Skia,
	SweepGradient
} from '@shopify/react-native-skia';
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
	const grooveWidth = 4;
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
			duration: 1000,
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
					{/* Elevation shadow — whole ring floats above surface */}
					<Circle
						cx={center + 2}
						cy={center + 3}
						r={radius}
						style="stroke"
						strokeWidth={strokeWidth + grooveWidth * 2 + 6}
						color="rgba(0,0,0,0.25)">
						<BlurMask blur={12} style="normal" />
					</Circle>

					{/* === LEVEL 1: Outer groove (recessed channel) === */}
					<Circle
						cx={center}
						cy={center}
						r={radius + strokeWidth / 2 + grooveWidth / 2}
						style="stroke"
						strokeWidth={grooveWidth}
						color="rgba(170,170,170,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(140,140,140,1)',
								'rgba(155,155,155,1)',
								'rgba(185,185,185,1)',
								'rgba(195,195,195,1)',
								'rgba(185,185,185,1)',
								'rgba(155,155,155,1)',
								'rgba(140,140,140,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Shadow between outer groove and bevel */}
					<Circle
						cx={center}
						cy={center}
						r={radius + strokeWidth / 2 + 0.5}
						style="stroke"
						strokeWidth={1.5}
						color="rgba(0,0,0,0.3)">
						<BlurMask blur={1.5} style="normal" />
					</Circle>

					{/* === LEVEL 2: Outer bevel (rising edge) === */}
					<Circle
						cx={center}
						cy={center}
						r={radius + strokeWidth / 2 + 0.5}
						style="stroke"
						strokeWidth={1}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(230,230,230,1)',
								'rgba(210,210,210,1)',
								'rgba(165,165,165,1)',
								'rgba(140,140,140,1)',
								'rgba(165,165,165,1)',
								'rgba(210,210,210,1)',
								'rgba(230,230,230,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Shadow between outer bevel and main ring */}
					<Circle
						cx={center}
						cy={center}
						r={radius + strokeWidth / 2}
						style="stroke"
						strokeWidth={1}
						color="rgba(0,0,0,0.25)">
						<BlurMask blur={1} style="normal" />
					</Circle>

					{/* === LEVEL 3: Main raised ring (the track) === */}
					{/* Convex surface: bright top-left, dark bottom-right */}
					<Circle
						cx={center}
						cy={center}
						r={radius}
						style="stroke"
						strokeWidth={strokeWidth}
						color="rgba(180,180,180,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(220,220,220,1)',
								'rgba(200,200,200,1)',
								'rgba(170,170,170,1)',
								'rgba(140,140,140,1)',
								'rgba(170,170,170,1)',
								'rgba(200,200,200,1)',
								'rgba(220,220,220,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Shadow between main ring and inner bevel */}
					<Circle
						cx={center}
						cy={center}
						r={radius - strokeWidth / 2}
						style="stroke"
						strokeWidth={1}
						color="rgba(0,0,0,0.25)">
						<BlurMask blur={1} style="normal" />
					</Circle>

					{/* === LEVEL 4: Inner bevel (dropping edge) === */}
					{/* Bright top-left, dark bottom-right */}
					<Circle
						cx={center}
						cy={center}
						r={radius - strokeWidth / 2 - 1}
						style="stroke"
						strokeWidth={2}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(240,240,240,1)',
								'rgba(220,220,220,1)',
								'rgba(160,160,160,1)',
								'rgba(120,120,120,1)',
								'rgba(160,160,160,1)',
								'rgba(220,220,220,1)',
								'rgba(240,240,240,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Shadow between inner bevel and inner groove */}
					<Circle
						cx={center}
						cy={center}
						r={radius - strokeWidth / 2 - 2}
						style="stroke"
						strokeWidth={1.5}
						color="rgba(0,0,0,0.3)">
						<BlurMask blur={1.5} style="normal" />
					</Circle>

					{/* === LEVEL 5: Inner groove (recessed channel) === */}
					{/* Concave surface: dark top-left, light bottom-right */}
					<Circle
						cx={center}
						cy={center}
						r={radius - strokeWidth / 2 - grooveWidth / 2 - 2}
						style="stroke"
						strokeWidth={grooveWidth}
						color="rgba(160,160,160,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(100,100,100,1)',
								'rgba(130,130,130,1)',
								'rgba(180,180,180,1)',
								'rgba(200,200,200,1)',
								'rgba(180,180,180,1)',
								'rgba(130,130,130,1)',
								'rgba(100,100,100,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

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
