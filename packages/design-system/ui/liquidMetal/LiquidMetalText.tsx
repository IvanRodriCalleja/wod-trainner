import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
	AlphaType,
	Canvas,
	ColorType,
	Fill,
	ImageShader,
	matchFont,
	Shader,
	Skia
} from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { createPlaceholderImageData, processImageForLiquidMetal } from './poissonSolver';
import {
	type LiquidMetalAnimationMode,
	LiquidMetalAnimationModes,
	type LiquidMetalMaterial,
	LiquidMetalMaterials,
	type LiquidMetalPattern,
	LiquidMetalPatterns,
	liquidMetalShader
} from './shaders';

// Re-export types for convenience
export type { LiquidMetalAnimationMode, LiquidMetalMaterial, LiquidMetalPattern };

/** Font weight type */
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

/** Font style type */
export type FontStyle = 'normal' | 'italic';

/** Available metal variant presets */
export type LiquidMetalVariant =
	| 'silver'
	| 'silver-light'
	| 'gold'
	| 'bronze'
	| 'purple'
	| 'blue'
	| 'pink'
	| 'yellow'
	| 'green'
	| 'red'
	| 'cyan'
	| 'orange';

/** Metal color presets */
export const LiquidMetalPresets: Record<LiquidMetalVariant, { light: string; dark: string }> = {
	silver: { light: '#FAFAFF', dark: '#1A1A1A' },
	'silver-light': { light: '#FFFFFF', dark: '#4A4A4A' },
	gold: { light: '#FFE4A0', dark: '#5C4515' },
	bronze: { light: '#E8B87C', dark: '#3D2812' },
	purple: { light: '#E8C4FF', dark: '#2A1040' },
	blue: { light: '#C4E4FF', dark: '#0A2840' },
	pink: { light: '#FFC4E8', dark: '#401028' },
	yellow: { light: '#FFFF90', dark: '#4A4500' },
	green: { light: '#C4FFC4', dark: '#0A400A' },
	red: { light: '#FFC4C4', dark: '#400A0A' },
	cyan: { light: '#C4FFFF', dark: '#0A4040' },
	orange: { light: '#FFD4A0', dark: '#402008' }
};

export interface LiquidMetalTextProps {
	/** The text to render */
	text: string;
	/** Font size in points (default: 64) */
	fontSize?: number;
	/** Font family name */
	fontFamily?: string;
	/** Font weight (default: 'bold') */
	fontWeight?: FontWeight;
	/** Font style (default: 'normal') */
	fontStyle?: FontStyle;
	/** Metal variant preset (default: 'silver') */
	variant?: LiquidMetalVariant;
	/** Custom highlight color (overrides variant) */
	colorLight?: string;
	/** Custom shadow color (overrides variant) */
	colorDark?: string;
	/** Background color (default: transparent) */
	colorBack?: string;
	/** Tint overlay color */
	colorTint?: string;
	/** Animation mode (default: 'flow') */
	animationMode?: LiquidMetalAnimationMode;
	/** Stripe pattern (default: 'linear') */
	pattern?: LiquidMetalPattern;
	/** Material style (default: 'default') */
	material?: LiquidMetalMaterial;
	/** Stripe repetition count (default: 1.5 - optimized for text) */
	repetition?: number;
	/** Softness of reflections (default: 0.15 - optimized for text) */
	softness?: number;
	/** Red channel shift for chromatic aberration (default: 0.3) */
	shiftRed?: number;
	/** Blue channel shift for chromatic aberration (default: 0.3) */
	shiftBlue?: number;
	/** Noise distortion amount (default: 0.05 - optimized for text) */
	distortion?: number;
	/** Edge contour strength (default: 0.25 - optimized for text to reduce dark areas) */
	contour?: number;
	/** Stripe angle in degrees (default: 70) */
	angle?: number;
	/** Animation speed multiplier (default: 1) */
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

	const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (rgbMatch) {
		return [
			parseInt(rgbMatch[1]) / 255,
			parseInt(rgbMatch[2]) / 255,
			parseInt(rgbMatch[3]) / 255,
			rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
		];
	}

	return [0.5, 0.5, 0.5, 1];
}

/** Map font weight string to numeric value */
function getFontWeightValue(weight: FontWeight): number {
	const weightMap: Record<string, number> = {
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
	return weightMap[weight] ?? 400;
}

/**
 * Find the actual bounding box of visible pixels (ignoring faint antialiasing)
 */
function findContentBounds(
	pixels: Uint8Array,
	width: number,
	height: number,
	alphaThreshold: number = 20
): { minX: number; minY: number; maxX: number; maxY: number } | null {
	let minX = width;
	let minY = height;
	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const alpha = pixels[(y * width + x) * 4 + 3];
			if (alpha > alphaThreshold) {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
	}

	if (maxX < minX || maxY < minY) return null;
	return { minX, minY, maxX, maxY };
}

/**
 * Crop pixels to bounding box with padding for shader lighting calculations
 */
function cropPixelsWithPadding(
	pixels: Uint8Array,
	srcWidth: number,
	srcHeight: number,
	bounds: { minX: number; minY: number; maxX: number; maxY: number },
	padding: number
): { pixels: Uint8Array; width: number; height: number } {
	// Calculate padded bounds, clamped to source dimensions
	const paddedMinX = Math.max(0, bounds.minX - padding);
	const paddedMinY = Math.max(0, bounds.minY - padding);
	const paddedMaxX = Math.min(srcWidth - 1, bounds.maxX + padding);
	const paddedMaxY = Math.min(srcHeight - 1, bounds.maxY + padding);

	const newWidth = paddedMaxX - paddedMinX + 1;
	const newHeight = paddedMaxY - paddedMinY + 1;
	const newPixels = new Uint8Array(newWidth * newHeight * 4);

	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			const srcX = paddedMinX + x;
			const srcY = paddedMinY + y;
			const srcIdx = (srcY * srcWidth + srcX) * 4;
			const dstIdx = (y * newWidth + x) * 4;
			newPixels[dstIdx] = pixels[srcIdx];
			newPixels[dstIdx + 1] = pixels[srcIdx + 1];
			newPixels[dstIdx + 2] = pixels[srcIdx + 2];
			newPixels[dstIdx + 3] = pixels[srcIdx + 3];
		}
	}

	return { pixels: newPixels, width: newWidth, height: newHeight };
}

/**
 * Rasterize text to pixel data using Skia - crops to exact content bounds
 */
function rasterizeText(
	text: string,
	fontSize: number,
	fontFamily?: string,
	fontWeight: FontWeight = 'bold',
	fontStyle: FontStyle = 'normal'
): { pixels: Uint8Array; width: number; height: number } | null {
	try {
		const font = matchFont({
			fontFamily: fontFamily ?? Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
			fontSize,
			fontWeight: getFontWeightValue(fontWeight) as any,
			fontStyle: fontStyle as any
		});

		if (!font) {
			console.warn('Failed to create font');
			return null;
		}

		// Render to oversized canvas first, then crop to actual content
		const textWidth = font.measureText(text).width;
		const metrics = font.getMetrics();
		const ascent = Math.abs(metrics.ascent);
		const descent = Math.abs(metrics.descent);

		// Add margin for rendering, will crop later
		const renderWidth = Math.ceil(textWidth + fontSize);
		const renderHeight = Math.ceil(ascent + descent + fontSize);

		const surface = Skia.Surface.MakeOffscreen(renderWidth, renderHeight);
		if (!surface) {
			console.warn('Failed to create offscreen surface for text');
			return null;
		}

		const canvas = surface.getCanvas();
		canvas.clear(Skia.Color('transparent'));

		const paint = Skia.Paint();
		paint.setColor(Skia.Color('white'));
		paint.setAntiAlias(true);

		// Draw text with margin
		const x = fontSize / 2;
		const y = fontSize / 2 + ascent;
		canvas.drawText(text, x, y, paint, font);

		const image = surface.makeImageSnapshot();
		if (!image) {
			console.warn('Failed to create image snapshot from text');
			return null;
		}

		const pixels = image.readPixels(0, 0, {
			width: renderWidth,
			height: renderHeight,
			colorType: ColorType.RGBA_8888,
			alphaType: AlphaType.Unpremul
		});

		if (!pixels) {
			console.warn('Failed to read pixels from text image');
			return null;
		}

		// Find actual content bounds and crop with padding for shader lighting
		const pixelArray = new Uint8Array(pixels);
		const bounds = findContentBounds(pixelArray, renderWidth, renderHeight, 50);

		if (!bounds) {
			console.warn('No content found in rendered text');
			return null;
		}

		// Add padding proportional to font size for proper shader lighting
		// The shader's bump calculation needs margin around content
		const padding = Math.ceil(fontSize * 0.15);
		return cropPixelsWithPadding(pixelArray, renderWidth, renderHeight, bounds, padding);
	} catch (e) {
		console.warn('Error rasterizing text:', e);
		return null;
	}
}

/**
 * Rasterize text and process it for liquid metal effect
 * Returns both the Skia image and dimensions
 */
function rasterizeAndProcessText(
	text: string,
	fontSize: number,
	fontFamily?: string,
	fontWeight: FontWeight = 'bold',
	fontStyle: FontStyle = 'normal'
): { skiaImage: ReturnType<typeof Skia.Image.MakeImage>; width: number; height: number } | null {
	const rasterized = rasterizeText(text, fontSize, fontFamily, fontWeight, fontStyle);
	if (!rasterized) return null;

	const { pixels, width, height } = rasterized;

	// Process through Poisson solver
	const processed = processImageForLiquidMetal(pixels, width, height);

	// Create Skia image
	const data = Skia.Data.fromBytes(processed);
	const skiaImage = Skia.Image.MakeImage(
		{
			width,
			height,
			colorType: ColorType.RGBA_8888,
			alphaType: AlphaType.Unpremul
		},
		data,
		width * 4
	);

	return skiaImage ? { skiaImage, width, height } : null;
}

/**
 * LiquidMetalText - Renders text with liquid metal shader effect
 *
 * This component takes text and applies the liquid metal shader effect to it.
 * The text is rasterized to pixels, processed through a Poisson solver to generate
 * edge gradients, and then rendered with the liquid metal shader.
 *
 * The component automatically sizes itself to fit the text content.
 */
export function LiquidMetalText({
	text,
	fontSize = 64,
	fontFamily,
	fontWeight = 'bold',
	fontStyle = 'normal',
	variant = 'silver',
	colorLight,
	colorDark,
	colorBack = '#00000000',
	colorTint = '#ffffff',
	animationMode = 'flow',
	pattern = 'linear',
	material = 'default',
	repetition = 1.5, // Lower than default for text - fewer stripes
	softness = 0.15, // Slightly higher for smoother transitions on text
	shiftRed = 0.3,
	shiftBlue = 0.3,
	distortion = 0.05, // Lower distortion for cleaner text
	contour = 0.25, // Lower contour to reduce dark edge effects
	angle = 70,
	speed = 1,
	style
}: LiquidMetalTextProps) {
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [imageAspectRatio, setImageAspectRatio] = useState(1);
	const [processedSkiaImage, setProcessedSkiaImage] = useState<ReturnType<
		typeof Skia.Image.MakeImage
	> | null>(null);

	// Rasterize and process text once - returns both image and dimensions
	const textResult = useMemo(() => {
		if (text) {
			return rasterizeAndProcessText(text, fontSize, fontFamily, fontWeight, fontStyle);
		}
		return null;
	}, [text, fontSize, fontFamily, fontWeight, fontStyle]);

	// Update state when text result changes
	useEffect(() => {
		if (textResult) {
			setProcessedSkiaImage(textResult.skiaImage);
			setImageAspectRatio(textResult.width / textResult.height);
			setCanvasSize({ width: textResult.width, height: textResult.height });
		} else {
			// Create placeholder if text rasterization failed
			const placeholder = createPlaceholderImageData();
			const data = Skia.Data.fromBytes(placeholder);
			const skImg = Skia.Image.MakeImage(
				{ width: 1, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
				data,
				4
			);
			setProcessedSkiaImage(skImg);
			setImageAspectRatio(1);
			setCanvasSize({ width: 0, height: 0 });
		}
	}, [textResult]);

	// Animation time
	const time = useSharedValue(0);

	useFrameCallback(frameInfo => {
		time.value = ((frameInfo.timestamp ?? 0) / 1000) * speed;
	});

	// Compile shader
	const shaderEffect = useMemo(() => {
		try {
			const effect = Skia.RuntimeEffect.Make(liquidMetalShader);
			if (!effect) {
				console.error('Shader compilation returned null');
			}
			return effect;
		} catch (e) {
			console.error('Shader compilation error:', e);
			return null;
		}
	}, []);

	const colorBackParsed = useMemo(() => parseColor(colorBack), [colorBack]);
	const colorTintParsed = useMemo(() => parseColor(colorTint), [colorTint]);

	// Get metal colors from variant preset, with optional custom overrides
	const colorLightParsed = useMemo(() => {
		const preset = LiquidMetalPresets[variant];
		const color = colorLight ?? preset.light;
		const [r, g, b] = parseColor(color);
		return [r, g, b] as [number, number, number];
	}, [variant, colorLight]);

	const colorDarkParsed = useMemo(() => {
		const preset = LiquidMetalPresets[variant];
		const color = colorDark ?? preset.dark;
		const [r, g, b] = parseColor(color);
		return [r, g, b] as [number, number, number];
	}, [variant, colorDark]);

	const uniforms = useDerivedValue(() => {
		return {
			u_resolution: [canvasSize.width, canvasSize.height],
			u_time: time.value,
			u_imageAspectRatio: imageAspectRatio,
			u_colorBack: colorBackParsed,
			u_colorTint: colorTintParsed,
			u_colorLight: colorLightParsed,
			u_colorDark: colorDarkParsed,
			u_softness: softness,
			u_repetition: repetition,
			u_shiftRed: shiftRed,
			u_shiftBlue: shiftBlue,
			u_distortion: distortion,
			u_contour: contour,
			u_angle: angle,
			u_shape: 0, // none - we're using image mode for text
			u_isImage: 1.0, // Always image mode for text
			u_scale: 1.0, // Full scale for text
			u_fit: 0, // none - text is already sized correctly
			u_animationMode: LiquidMetalAnimationModes[animationMode],
			u_pattern: LiquidMetalPatterns[pattern],
			u_material: LiquidMetalMaterials[material]
		};
	}, [
		canvasSize,
		time,
		imageAspectRatio,
		colorBackParsed,
		colorTintParsed,
		colorLightParsed,
		colorDarkParsed,
		softness,
		repetition,
		shiftRed,
		shiftBlue,
		distortion,
		contour,
		angle,
		animationMode,
		pattern,
		material
	]);

	if (!shaderEffect || canvasSize.width === 0 || canvasSize.height === 0) {
		return (
			<View
				style={[
					styles.container,
					{ width: canvasSize.width || 'auto', height: canvasSize.height || 'auto' },
					style
				]}>
				<View style={[styles.fallback, { backgroundColor: colorBack }]} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { width: canvasSize.width, height: canvasSize.height }, style]}>
			{processedSkiaImage && (
				<Canvas
					style={{
						width: canvasSize.width,
						height: canvasSize.height
					}}>
					<Fill>
						<Shader source={shaderEffect} uniforms={uniforms}>
							<ImageShader
								image={processedSkiaImage}
								fit="fill"
								x={0}
								y={0}
								width={canvasSize.width}
								height={canvasSize.height}
							/>
						</Shader>
					</Fill>
				</Canvas>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {},
	fallback: {
		flex: 1
	}
});

export default LiquidMetalText;
