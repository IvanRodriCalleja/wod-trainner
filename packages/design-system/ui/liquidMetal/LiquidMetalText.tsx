import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
	AlphaType,
	Canvas,
	ColorType,
	Fill,
	ImageShader,
	Shader,
	Skia,
	matchFont
} from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { processImageForLiquidMetal } from './poissonSolver';
import { liquidMetalTextShader } from './textShader';

export type FontWeight =
	| 'normal'
	| 'bold'
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';

export type FontStyle = 'normal' | 'italic';

export type LiquidMetalTextVariant = 'silver' | 'silver-light' | 'gold' | 'bronze' | 'chrome';

export type AnimationMode = 'flow' | 'still' | 'pulse' | 'ripple' | 'shimmer' | 'rotate';
export type Pattern = 'linear' | 'radial' | 'concentric' | 'diagonal-cross' | 'noise';
export type Material =
	| 'default'
	| 'chrome'
	| 'brushed'
	| 'holographic'
	| 'pearl'
	| 'glass'
	| 'oil-slick';

const AnimationModes: Record<AnimationMode, number> = {
	flow: 0,
	still: 1,
	pulse: 2,
	ripple: 3,
	shimmer: 4,
	rotate: 5
};

const Patterns: Record<Pattern, number> = {
	linear: 0,
	radial: 1,
	concentric: 2,
	'diagonal-cross': 3,
	noise: 4
};

const Materials: Record<Material, number> = {
	default: 0,
	chrome: 1,
	brushed: 2,
	holographic: 3,
	pearl: 4,
	glass: 5,
	'oil-slick': 6
};

const Presets: Record<LiquidMetalTextVariant, { light: string; dark: string }> = {
	silver: { light: '#FAFAFF', dark: '#3A3A3A' },
	'silver-light': { light: '#FFFFFF', dark: '#5A5A5A' },
	gold: { light: '#FFE4A0', dark: '#6C5525' },
	bronze: { light: '#E8B87C', dark: '#5D3822' },
	chrome: { light: '#FFFFFF', dark: '#4A4A4A' }
};

export interface LiquidMetalTextProps {
	/** The text to render */
	text: string;
	/** Font size in points */
	fontSize?: number;
	/** Font family name */
	fontFamily?: string;
	/** Font weight */
	fontWeight?: FontWeight;
	/** Font style */
	fontStyle?: FontStyle;
	/** Metal color variant */
	variant?: LiquidMetalTextVariant;
	/** Custom highlight color (overrides variant) */
	colorLight?: string;
	/** Custom shadow color (overrides variant) */
	colorDark?: string;
	/** Background color (default: transparent) */
	colorBack?: string;
	/** Tint color for color burn effect */
	colorTint?: string;
	/** Animation mode */
	animationMode?: AnimationMode;
	/** Stripe pattern */
	pattern?: Pattern;
	/** Material style */
	material?: Material;
	/** Number of stripe repetitions */
	repetition?: number;
	/** Softness of transitions */
	softness?: number;
	/** Red channel shift (chromatic aberration) */
	shiftRed?: number;
	/** Blue channel shift (chromatic aberration) */
	shiftBlue?: number;
	/** Noise distortion amount */
	distortion?: number;
	/** Stripe angle in degrees */
	angle?: number;
	/** Animation speed */
	speed?: number;
	/** Container style */
	style?: object;
}

function parseColor(color: string): [number, number, number, number] {
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		let r: number;
		let g: number;
		let b: number;
		let a = 1;

		if (hex.length === 3) {
			r = parseInt(hex[0] + hex[0], 16) / 255;
			g = parseInt(hex[1] + hex[1], 16) / 255;
			b = parseInt(hex[2] + hex[2], 16) / 255;
		} else if (hex.length === 6) {
			r = parseInt(hex.slice(0, 2), 16) / 255;
			g = parseInt(hex.slice(2, 4), 16) / 255;
			b = parseInt(hex.slice(4, 6), 16) / 255;
		} else if (hex.length === 8) {
			r = parseInt(hex.slice(0, 2), 16) / 255;
			g = parseInt(hex.slice(2, 4), 16) / 255;
			b = parseInt(hex.slice(4, 6), 16) / 255;
			a = parseInt(hex.slice(6, 8), 16) / 255;
		} else {
			return [0.5, 0.5, 0.5, 1];
		}
		return [r, g, b, a];
	}
	return [0.5, 0.5, 0.5, 1];
}

function getFontWeightValue(weight: FontWeight): number {
	const map: Record<string, number> = {
		normal: 400,
		bold: 700,
		'100': 100,
		'200': 200,
		'300': 300,
		'400': 400,
		'500': 500,
		'600': 600,
		'700': 700,
		'800': 800,
		'900': 900
	};
	return map[weight] ?? 400;
}

function rasterizeText(
	text: string,
	fontSize: number,
	fontFamily: string,
	fontWeight: FontWeight,
	fontStyle: FontStyle
): { pixels: Uint8Array; width: number; height: number } | null {
	try {
		const font = matchFont({
			fontFamily,
			fontSize,
			fontWeight: getFontWeightValue(fontWeight) as any,
			fontStyle: fontStyle as any
		});

		if (!font) return null;

		const textWidth = font.measureText(text).width;
		const metrics = font.getMetrics();
		const ascent = Math.abs(metrics.ascent);
		const descent = Math.abs(metrics.descent);

		const width = Math.ceil(textWidth);
		const height = Math.ceil(ascent + descent);

		if (width <= 0 || height <= 0) return null;

		const surface = Skia.Surface.MakeOffscreen(width, height);
		if (!surface) return null;

		const canvas = surface.getCanvas();
		canvas.clear(Skia.Color('transparent'));

		const paint = Skia.Paint();
		paint.setColor(Skia.Color('white'));
		paint.setAntiAlias(true);

		canvas.drawText(text, 0, ascent, paint, font);

		const image = surface.makeImageSnapshot();
		if (!image) return null;

		const pixels = image.readPixels(0, 0, {
			width,
			height,
			colorType: ColorType.RGBA_8888,
			alphaType: AlphaType.Unpremul
		});

		if (!pixels) return null;

		return { pixels: new Uint8Array(pixels), width, height };
	} catch (e) {
		console.warn('Error rasterizing text:', e);
		return null;
	}
}

export function LiquidMetalText({
	text,
	fontSize = 48,
	fontFamily = Platform.select({
		ios: 'Helvetica Neue',
		android: 'sans-serif',
		default: 'sans-serif'
	}),
	fontWeight = 'bold',
	fontStyle = 'normal',
	variant = 'silver',
	colorLight,
	colorDark,
	colorBack = '#00000000',
	colorTint = '#FFFFFF',
	animationMode = 'flow',
	pattern = 'linear',
	material = 'default',
	repetition = 3,
	softness = 0.15,
	shiftRed = 0.5,
	shiftBlue = 0.5,
	distortion = 0.03,
	angle = 45,
	speed = 1,
	style
}: LiquidMetalTextProps) {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [processedImage, setProcessedImage] = useState<ReturnType<
		typeof Skia.Image.MakeImage
	> | null>(null);

	const time = useSharedValue(0);

	useFrameCallback(frameInfo => {
		time.value = ((frameInfo.timestamp ?? 0) / 1000) * speed;
	});

	// Rasterize and process text
	useEffect(() => {
		const result = rasterizeText(text, fontSize, fontFamily, fontWeight, fontStyle);
		if (!result) {
			setDimensions({ width: 0, height: 0 });
			setProcessedImage(null);
			return;
		}

		const { pixels, width, height } = result;
		setDimensions({ width, height });

		const processed = processImageForLiquidMetal(pixels, width, height);
		const data = Skia.Data.fromBytes(processed);
		const skImage = Skia.Image.MakeImage(
			{ width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
			data,
			width * 4
		);
		setProcessedImage(skImage);
	}, [text, fontSize, fontFamily, fontWeight, fontStyle]);

	// Compile shader
	const shaderEffect = useMemo(() => {
		try {
			return Skia.RuntimeEffect.Make(liquidMetalTextShader);
		} catch (e) {
			console.error('Text shader compilation error:', e);
			return null;
		}
	}, []);

	// Parse colors
	const preset = Presets[variant];
	const lightColor = colorLight ?? preset.light;
	const darkColor = colorDark ?? preset.dark;

	const colorBackParsed = useMemo(() => parseColor(colorBack), [colorBack]);
	const colorTintParsed = useMemo(() => parseColor(colorTint), [colorTint]);
	const colorLightParsed = useMemo(() => {
		const [r, g, b] = parseColor(lightColor);
		return [r, g, b] as [number, number, number];
	}, [lightColor]);
	const colorDarkParsed = useMemo(() => {
		const [r, g, b] = parseColor(darkColor);
		return [r, g, b] as [number, number, number];
	}, [darkColor]);

	const uniforms = useDerivedValue(
		() => ({
			u_resolution: [dimensions.width, dimensions.height],
			u_time: time.value,
			u_colorBack: colorBackParsed,
			u_colorTint: colorTintParsed,
			u_colorLight: colorLightParsed,
			u_colorDark: colorDarkParsed,
			u_softness: softness,
			u_repetition: repetition,
			u_shiftRed: shiftRed,
			u_shiftBlue: shiftBlue,
			u_distortion: distortion,
			u_angle: angle,
			u_speed: speed,
			u_animationMode: AnimationModes[animationMode],
			u_pattern: Patterns[pattern],
			u_material: Materials[material]
		}),
		[
			dimensions,
			time,
			colorBackParsed,
			colorTintParsed,
			colorLightParsed,
			colorDarkParsed,
			softness,
			repetition,
			shiftRed,
			shiftBlue,
			distortion,
			angle,
			speed,
			animationMode,
			pattern,
			material
		]
	);

	if (!shaderEffect || dimensions.width === 0 || dimensions.height === 0 || !processedImage) {
		return <View style={[styles.container, style]} />;
	}

	return (
		<View style={[styles.container, { width: dimensions.width, height: dimensions.height }, style]}>
			<Canvas style={{ width: dimensions.width, height: dimensions.height }}>
				<Fill>
					<Shader source={shaderEffect} uniforms={uniforms}>
						<ImageShader
							image={processedImage}
							fit="fill"
							x={0}
							y={0}
							width={dimensions.width}
							height={dimensions.height}
						/>
					</Shader>
				</Fill>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {}
});

export default LiquidMetalText;
