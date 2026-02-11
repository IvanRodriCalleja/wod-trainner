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

import { useAppTheme } from '@wod-trainer/design-system/providers';

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

// Generate 7-stop symmetric gray gradient for torus cross-section
const sliceGradient = (min: number, max: number): string[] => {
	const d = max - min;
	const v = (n: number) => {
		const c = Math.round(n);
		return `rgba(${c},${c},${c},1)`;
	};
	return [
		v(max),
		v(max - d * 0.25),
		v(max - d * 0.7),
		v(min),
		v(max - d * 0.7),
		v(max - d * 0.25),
		v(max)
	];
};

const gray = (n: number) => `rgba(${n},${n},${n},1)`;

const GRADIENT_POSITIONS = [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1];
const SPECULAR_POSITIONS = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1];

// Torus slices: [baseColor, gradientMin, gradientMax] — symmetric sin curve
const lightTheme = {
	ambientShadow: 'rgba(0,0,0,0.1)',
	contactShadow: 'rgba(0,0,0,0.2)',
	slices: [
		[160, 125, 190],
		[175, 140, 210],
		[190, 155, 225],
		[200, 165, 238],
		[205, 170, 245],
		[200, 165, 238],
		[190, 155, 225],
		[175, 140, 210],
		[160, 125, 190]
	] as [number, number, number][],
	specular: [
		'rgba(255,255,255,0.5)',
		'rgba(255,255,255,0.3)',
		'rgba(255,255,255,0.05)',
		'rgba(255,255,255,0.0)',
		'rgba(255,255,255,0.05)',
		'rgba(255,255,255,0.3)',
		'rgba(255,255,255,0.5)'
	],
	surfaceDarkening: 'rgba(0,0,0,0.03)',
	innerAmbient: 'rgba(0,0,0,0.12)',
	innerShadow: 'rgba(0,0,0,0.32)',
	innerContact: 'rgba(0,0,0,0.25)',
	innerHighlight: 'rgba(255,255,255,0.95)',
	innerShine: [
		'rgba(255,255,255,0.5)',
		'rgba(255,255,255,0.3)',
		'rgba(255,255,255,0.05)',
		'rgba(255,255,255,0.0)',
		'rgba(255,255,255,0.05)',
		'rgba(255,255,255,0.3)',
		'rgba(255,255,255,0.5)'
	],
	edgeColor: 'rgba(170,170,170,0.4)'
};

const darkTheme = {
	ambientShadow: 'rgba(0,0,0,0.4)',
	contactShadow: 'rgba(0,0,0,0.5)',
	slices: [
		[70, 48, 95],
		[80, 55, 108],
		[90, 62, 120],
		[98, 68, 130],
		[102, 72, 138],
		[98, 68, 130],
		[90, 62, 120],
		[80, 55, 108],
		[70, 48, 95]
	] as [number, number, number][],
	specular: [
		'rgba(255,255,255,0.35)',
		'rgba(255,255,255,0.2)',
		'rgba(255,255,255,0.04)',
		'rgba(255,255,255,0.0)',
		'rgba(255,255,255,0.04)',
		'rgba(255,255,255,0.2)',
		'rgba(255,255,255,0.35)'
	],
	surfaceDarkening: 'rgba(0,0,0,0.02)',
	innerAmbient: 'rgba(0,0,0,0.15)',
	innerShadow: 'rgba(0,0,0,0.3)',
	innerContact: 'rgba(0,0,0,0.2)',
	innerHighlight: 'rgba(255,255,255,0.25)',
	innerShine: [
		'rgba(255,255,255,0.3)',
		'rgba(255,255,255,0.18)',
		'rgba(255,255,255,0.03)',
		'rgba(255,255,255,0.0)',
		'rgba(255,255,255,0.03)',
		'rgba(255,255,255,0.18)',
		'rgba(255,255,255,0.3)'
	],
	edgeColor: 'rgba(120,120,120,0.5)'
};

export const CircularProgress = ({ progress, colorClassName }: CircularProgressProps) => {
	const { isDark } = useAppTheme();
	const theme = isDark ? darkTheme : lightTheme;

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
					{/* Elevation shadows */}
					<Circle
						cx={center + 3}
						cy={center + 5}
						r={radius}
						style="stroke"
						strokeWidth={ringWidth + 16}
						color={theme.ambientShadow}>
						<BlurMask blur={20} style="normal" />
					</Circle>
					<Circle
						cx={center + 1}
						cy={center + 2}
						r={radius}
						style="stroke"
						strokeWidth={ringWidth + 4}
						color={theme.contactShadow}>
						<BlurMask blur={6} style="normal" />
					</Circle>

					{/* Torus ring — 9 concentric slices with sweep gradients */}
					{theme.slices.map(([base, min, max], i) => (
						<Circle
							key={i}
							cx={center}
							cy={center}
							r={radius + ringWidth / 2 - (1 + i * 2)}
							style="stroke"
							strokeWidth={3}
							color={gray(base)}>
							<SweepGradient
								c={{ x: center, y: center }}
								colors={sliceGradient(min, max)}
								positions={GRADIENT_POSITIONS}
							/>
						</Circle>
					))}

					{/* Specular highlight — directional gloss along the peak */}
					<Circle
						cx={center}
						cy={center}
						r={radius + ringWidth / 2 - 9}
						style="stroke"
						strokeWidth={2.5}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={theme.specular}
							positions={SPECULAR_POSITIONS}
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
						color={theme.surfaceDarkening}>
						<BlurMask blur={25} style="normal" />
					</Circle>

					{/* Inner circle inset shadows — clipped to outside only */}
					<Group clip={innerCircleClip} invertClip>
						<Circle
							cx={center - 4}
							cy={center + 1}
							r={radius * 0.65 + 15}
							style="stroke"
							strokeWidth={40}
							color={theme.innerAmbient}>
							<BlurMask blur={22} style="normal" />
						</Circle>
						<Circle
							cx={center - 7}
							cy={center + 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={22}
							color={theme.innerShadow}>
							<BlurMask blur={14} style="normal" />
						</Circle>
						<Circle
							cx={center - 4}
							cy={center + 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={10}
							color={theme.innerContact}>
							<BlurMask blur={4} style="normal" />
						</Circle>
						<Circle
							cx={center + 6}
							cy={center - 1}
							r={radius * 0.65}
							style="stroke"
							strokeWidth={20}
							color={theme.innerHighlight}>
							<BlurMask blur={14} style="normal" />
						</Circle>
					</Group>

					{/* Directional shine on inner circle edge */}
					<Circle cx={center} cy={center} r={radius * 0.65} style="stroke" strokeWidth={2.5}>
						<SweepGradient
							c={{ x: center, y: center }}
							colors={theme.innerShine}
							positions={SPECULAR_POSITIONS}
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
						color={theme.edgeColor}
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
