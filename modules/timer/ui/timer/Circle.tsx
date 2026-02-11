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
	const ringWidth = 18;
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

	// Clip path for inner circle — used to prevent shadows from bleeding inside
	const innerCircleClip = Skia.Path.Make();
	innerCircleClip.addCircle(center, center, radius * 0.65);

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
					{/* Elevation shadow — subtle, not too offset */}
					{/* Soft wide ambient shadow */}
					<Circle
						cx={center + 3}
						cy={center + 5}
						r={radius}
						style="stroke"
						strokeWidth={ringWidth + 16}
						color="rgba(0,0,0,0.1)">
						<BlurMask blur={20} style="normal" />
					</Circle>

					{/* Tighter contact shadow */}
					<Circle
						cx={center + 1}
						cy={center + 2}
						r={radius}
						style="stroke"
						strokeWidth={ringWidth + 4}
						color="rgba(0,0,0,0.2)">
						<BlurMask blur={6} style="normal" />
					</Circle>

					{/*
						Smooth torus ring — 9 thin concentric circles
						simulating a rounded cross-section.
						Brightness follows sin curve: dark edges → bright center.
						Each has a sweep gradient for directional light.
					*/}

					{/* Slice 1 — outer edge (darkest) */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 1}
						style="stroke"
						strokeWidth={3}
						color="rgba(160,160,160,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(190,190,190,1)',
								'rgba(170,170,170,1)',
								'rgba(140,140,140,1)',
								'rgba(125,125,125,1)',
								'rgba(140,140,140,1)',
								'rgba(170,170,170,1)',
								'rgba(190,190,190,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 2 */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 3}
						style="stroke"
						strokeWidth={3}
						color="rgba(175,175,175,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(210,210,210,1)',
								'rgba(190,190,190,1)',
								'rgba(160,160,160,1)',
								'rgba(140,140,140,1)',
								'rgba(160,160,160,1)',
								'rgba(190,190,190,1)',
								'rgba(210,210,210,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 3 */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 5}
						style="stroke"
						strokeWidth={3}
						color="rgba(190,190,190,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(225,225,225,1)',
								'rgba(210,210,210,1)',
								'rgba(180,180,180,1)',
								'rgba(155,155,155,1)',
								'rgba(180,180,180,1)',
								'rgba(210,210,210,1)',
								'rgba(225,225,225,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 4 — approaching peak */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 7}
						style="stroke"
						strokeWidth={3}
						color="rgba(200,200,200,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(238,238,238,1)',
								'rgba(222,222,222,1)',
								'rgba(192,192,192,1)',
								'rgba(165,165,165,1)',
								'rgba(192,192,192,1)',
								'rgba(222,222,222,1)',
								'rgba(238,238,238,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 5 — peak (brightest) */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 9}
						style="stroke"
						strokeWidth={3}
						color="rgba(205,205,205,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(245,245,245,1)',
								'rgba(230,230,230,1)',
								'rgba(198,198,198,1)',
								'rgba(170,170,170,1)',
								'rgba(198,198,198,1)',
								'rgba(230,230,230,1)',
								'rgba(245,245,245,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 6 — past peak */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 11}
						style="stroke"
						strokeWidth={3}
						color="rgba(200,200,200,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(238,238,238,1)',
								'rgba(222,222,222,1)',
								'rgba(192,192,192,1)',
								'rgba(165,165,165,1)',
								'rgba(192,192,192,1)',
								'rgba(222,222,222,1)',
								'rgba(238,238,238,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 7 */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 13}
						style="stroke"
						strokeWidth={3}
						color="rgba(190,190,190,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(225,225,225,1)',
								'rgba(210,210,210,1)',
								'rgba(180,180,180,1)',
								'rgba(155,155,155,1)',
								'rgba(180,180,180,1)',
								'rgba(210,210,210,1)',
								'rgba(225,225,225,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 8 */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 15}
						style="stroke"
						strokeWidth={3}
						color="rgba(175,175,175,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(210,210,210,1)',
								'rgba(190,190,190,1)',
								'rgba(160,160,160,1)',
								'rgba(140,140,140,1)',
								'rgba(160,160,160,1)',
								'rgba(190,190,190,1)',
								'rgba(210,210,210,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Slice 9 — inner edge (darkest) */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 17}
						style="stroke"
						strokeWidth={3}
						color="rgba(160,160,160,1)">
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(190,190,190,1)',
								'rgba(170,170,170,1)',
								'rgba(140,140,140,1)',
								'rgba(125,125,125,1)',
								'rgba(140,140,140,1)',
								'rgba(170,170,170,1)',
								'rgba(190,190,190,1)'
							]}
							positions={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
						/>
					</Circle>

					{/* Specular highlight — directional gloss along the peak */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 9}
						style="stroke"
						strokeWidth={2.5}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(255,255,255,0.5)',
								'rgba(255,255,255,0.3)',
								'rgba(255,255,255,0.05)',
								'rgba(255,255,255,0.0)',
								'rgba(255,255,255,0.05)',
								'rgba(255,255,255,0.3)',
								'rgba(255,255,255,0.5)'
							]}
							positions={[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]}
						/>
						<BlurMask blur={1.5} style="normal" />
					</Circle>

					{/* Surface darkening — subtle shadow from outer ring inward */}
					<Circle
						cx={center}
						cy={center}
						r={radius - ringWidth / 2 - 5}
						style="stroke"
						strokeWidth={50}
						color="rgba(0,0,0,0.03)">
						<BlurMask blur={25} style="normal" />
					</Circle>

					{/* Clip shadows to only show OUTSIDE the inner circle */}
					<Group clip={innerCircleClip} invertClip>
						{/* Wide ambient shadow — right side (where light is blocked by rim) */}
						<Circle
							cx={center - 4}
							cy={center + 1}
							r={radius * 0.65 + 15}
							style="stroke"
							strokeWidth={40}
							color="rgba(0,0,0,0.12)">
							<BlurMask blur={22} style="normal" />
						</Circle>

						{/* Dark shadow on right inner edge (rim blocks light from right) */}
						<Circle
							cx={center - 7}
							cy={center + 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={22}
							color="rgba(0,0,0,0.32)">
							<BlurMask blur={14} style="normal" />
						</Circle>

						{/* Tight contact shadow on right edge */}
						<Circle
							cx={center - 4}
							cy={center + 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={10}
							color="rgba(0,0,0,0.25)">
							<BlurMask blur={4} style="normal" />
						</Circle>

						{/* Light highlight on left inner edge (light reflects off far wall) */}
						<Circle
							cx={center + 6}
							cy={center - 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={20}
							color="rgba(255,255,255,0.95)">
							<BlurMask blur={14} style="normal" />
						</Circle>
					</Group>

					{/* Directional shine on inner circle edge */}
					<Circle
						cx={center}
						cy={center}
						r={radius * 0.65}
						style="stroke"
						strokeWidth={2.5}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={[
								'rgba(255,255,255,0.5)',
								'rgba(255,255,255,0.3)',
								'rgba(255,255,255,0.05)',
								'rgba(255,255,255,0.0)',
								'rgba(255,255,255,0.05)',
								'rgba(255,255,255,0.3)',
								'rgba(255,255,255,0.5)'
							]}
							positions={[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]}
						/>
						<BlurMask blur={1.5} style="normal" />
					</Circle>

					{/* Edge definition */}
					<Circle
						cx={center}
						cy={center}
						r={radius * 0.65}
						style="stroke"
						strokeWidth={1.5}
						color="rgba(170,170,170,0.4)"
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
