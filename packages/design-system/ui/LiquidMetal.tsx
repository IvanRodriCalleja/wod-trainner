import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
	AlphaType,
	Canvas,
	ColorType,
	Fill,
	ImageShader,
	Shader,
	Skia,
	useImage
} from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import {
	createPlaceholderImageData,
	processImageForLiquidMetal
} from './liquidMetal/poissonSolver';
import {
	type LiquidMetalAnimationMode,
	LiquidMetalAnimationModes,
	type LiquidMetalMaterial,
	LiquidMetalMaterials,
	type LiquidMetalPattern,
	LiquidMetalPatterns,
	type LiquidMetalShape,
	LiquidMetalShapes,
	liquidMetalShader
} from './liquidMetal/shaders';

// ============================================================================
// Color Utilities
// ============================================================================

/** Metal colors configuration */
export interface LiquidMetalColors {
	/** Highlight/light reflection color */
	colorLight: string;
	/** Shadow/dark reflection color */
	colorDark: string;
	/** Background color (behind transparent areas) */
	colorBack?: string;
	/** Tint overlay color (color burn blend on highlights) */
	colorTint?: string;
}

/** Convert HSL to hex color */
function hslToHex(h: number, s: number, l: number): string {
	const hue = ((h % 360) + 360) % 360;
	const sat = Math.max(0, Math.min(1, s));
	const light = Math.max(0, Math.min(1, l));

	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = light - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;
	if (hue < 60) {
		r = c;
		g = x;
	} else if (hue < 120) {
		r = x;
		g = c;
	} else if (hue < 180) {
		g = c;
		b = x;
	} else if (hue < 240) {
		g = x;
		b = c;
	} else if (hue < 300) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}

	const toHex = (n: number) =>
		Math.round((n + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Parse hex color to RGB values (0-255) */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const h = hex.replace('#', '');
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16)
	};
}

/** Lighten a hex color */
function lightenColor(hex: string, amount: number): string {
	const { r, g, b } = hexToRgb(hex);
	const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`.toUpperCase();
}

/** Darken a hex color */
function darkenColor(hex: string, amount: number): string {
	const { r, g, b } = hexToRgb(hex);
	const darken = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`.toUpperCase();
}

// ============================================================================
// Metal Color Generators
// ============================================================================

/**
 * Create silver metal colors (matches original paper-design shader)
 * High contrast, cool white highlights with near-black shadows
 */
export function createSilverMetal(): LiquidMetalColors {
	return {
		colorLight: '#FAFAFF', // Cool white with slight blue
		colorDark: '#1A1A1A', // Near black
		colorTint: '#FFFFFF'
	};
}

/**
 * Create light silver metal colors
 * Lower contrast, softer appearance
 */
export function createSilverLightMetal(): LiquidMetalColors {
	return {
		colorLight: '#FFFFFF',
		colorDark: '#6A6A6A',
		colorTint: '#FFFFFF'
	};
}

/**
 * Create gold metal colors
 * Warm golden tones
 */
export function createGoldMetal(): LiquidMetalColors {
	return {
		colorLight: '#FFE4A0',
		colorDark: '#5C4515',
		colorTint: '#FFFAF0'
	};
}

/**
 * Create bronze/copper metal colors
 */
export function createBronzeMetal(): LiquidMetalColors {
	return {
		colorLight: '#E8B87C',
		colorDark: '#3D2812',
		colorTint: '#FFF5E6'
	};
}

/**
 * Create metal colors from a hue value (0-360)
 * Automatically generates complementary light/dark pair
 */
export function createMetalFromHue(
	hue: number,
	options?: {
		saturation?: number;
		lightContrast?: number;
	}
): LiquidMetalColors {
	const { saturation = 0.3, lightContrast = 0.85 } = options ?? {};

	return {
		colorLight: hslToHex(hue, saturation * 0.5, 0.95),
		colorDark: hslToHex(hue, saturation, 0.1 + (1 - lightContrast) * 0.3),
		colorTint: hslToHex(hue, saturation * 0.2, 0.98)
	};
}

/**
 * Create metal colors from a brand/base color
 * Derives light and dark variants automatically
 */
export function createMetalFromColor(
	baseColor: string,
	options?: {
		lightAmount?: number;
		darkAmount?: number;
	}
): LiquidMetalColors {
	const { lightAmount = 0.85, darkAmount = 0.85 } = options ?? {};

	return {
		colorLight: lightenColor(baseColor, lightAmount),
		colorDark: darkenColor(baseColor, darkAmount),
		colorTint: lightenColor(baseColor, 0.95)
	};
}

/**
 * Create fully custom metal colors
 */
export function createCustomMetal(
	colorLight: string,
	colorDark: string,
	colorTint?: string,
	colorBack?: string
): LiquidMetalColors {
	return { colorLight, colorDark, colorTint, colorBack };
}

// Pre-built variant generators
export const metalVariants = {
	silver: createSilverMetal,
	'silver-light': createSilverLightMetal,
	gold: createGoldMetal,
	bronze: createBronzeMetal,
	purple: () => createMetalFromHue(280, { saturation: 0.5 }),
	blue: () => createMetalFromHue(210, { saturation: 0.5 }),
	pink: () => createMetalFromHue(330, { saturation: 0.5 }),
	yellow: () => createMetalFromHue(55, { saturation: 0.6 }),
	green: () => createMetalFromHue(120, { saturation: 0.5 }),
	red: () => createMetalFromHue(0, { saturation: 0.5 }),
	cyan: () => createMetalFromHue(180, { saturation: 0.5 }),
	orange: () => createMetalFromHue(30, { saturation: 0.6 })
} as const;

/** Available metal variant presets */
export type LiquidMetalVariant = keyof typeof metalVariants;

/** Metal color presets - for backward compatibility */
export const LiquidMetalPresets: Record<LiquidMetalVariant, { light: string; dark: string }> =
	Object.fromEntries(
		Object.entries(metalVariants).map(([key, generator]) => {
			const colors = generator();
			return [key, { light: colors.colorLight, dark: colors.colorDark }];
		})
	) as Record<LiquidMetalVariant, { light: string; dark: string }>;

export interface LiquidMetalProps {
	width?: number | string;
	height?: number | string;
	/** Image source - URL string or local require/import (e.g., require('./image.png')) */
	image?: string | number;
	/** SVG string content for the mask (alternative to image) */
	svg?: string;
	/** Target size for SVG rasterization (default: 512) */
	svgSize?: number;
	/** Highlight/reflection color - use generator functions like createSilverMetal() */
	colorLight?: string;
	/** Shadow/dark color - use generator functions like createSilverMetal() */
	colorDark?: string;
	/** Background color (behind transparent areas) */
	colorBack?: string;
	/** Tint overlay color (color burn blend on highlights) */
	colorTint?: string;
	shape?: LiquidMetalShape;
	/** Animation mode (default: "flow") */
	animationMode?: LiquidMetalAnimationMode;
	/** Stripe pattern (default: "linear") */
	pattern?: LiquidMetalPattern;
	/** Material style (default: "default") */
	material?: LiquidMetalMaterial;
	repetition?: number;
	softness?: number;
	shiftRed?: number;
	shiftBlue?: number;
	distortion?: number;
	contour?: number;
	angle?: number;
	speed?: number;
	scale?: number;
	fit?: 'contain' | 'cover' | 'none';
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

/**
 * Rasterize SVG string to pixel data using Skia
 */
function rasterizeSvg(
	svgString: string,
	targetSize: number
): { pixels: Uint8Array; width: number; height: number } | null {
	try {
		// Parse SVG
		const svgDom = Skia.SVG.MakeFromString(svgString);
		if (!svgDom) {
			console.warn('Failed to parse SVG');
			return null;
		}

		// Get SVG dimensions
		const svgWidth = svgDom.width();
		const svgHeight = svgDom.height();

		if (svgWidth <= 0 || svgHeight <= 0) {
			console.warn('Invalid SVG dimensions');
			return null;
		}

		// Calculate target dimensions preserving aspect ratio
		const aspectRatio = svgWidth / svgHeight;
		let width: number;
		let height: number;

		if (aspectRatio > 1) {
			width = targetSize;
			height = Math.round(targetSize / aspectRatio);
		} else {
			height = targetSize;
			width = Math.round(targetSize * aspectRatio);
		}

		// Create offscreen surface
		const surface = Skia.Surface.MakeOffscreen(width, height);
		if (!surface) {
			console.warn('Failed to create offscreen surface');
			return null;
		}

		const canvas = surface.getCanvas();

		// Clear with transparent background
		canvas.clear(Skia.Color('transparent'));

		// Scale to fit target size
		const scaleX = width / svgWidth;
		const scaleY = height / svgHeight;
		canvas.scale(scaleX, scaleY);

		// Draw SVG
		canvas.drawSvg(svgDom);

		// Get the image from surface
		const image = surface.makeImageSnapshot();
		if (!image) {
			console.warn('Failed to create image snapshot');
			return null;
		}

		// Read pixels
		const pixels = image.readPixels(0, 0, {
			width,
			height,
			colorType: ColorType.RGBA_8888,
			alphaType: AlphaType.Unpremul
		});

		if (!pixels) {
			console.warn('Failed to read pixels from SVG image');
			return null;
		}

		return {
			pixels: new Uint8Array(pixels),
			width,
			height
		};
	} catch (e) {
		console.warn('Error rasterizing SVG:', e);
		return null;
	}
}

/**
 * Fetch SVG from URL and return as string
 */
async function fetchSvgFromUrl(url: string): Promise<string | null> {
	try {
		const response = await fetch(url);
		const contentType = response.headers.get('content-type');

		if (contentType?.includes('image/svg+xml') || url.endsWith('.svg')) {
			return await response.text();
		}
		return null;
	} catch (e) {
		console.warn('Failed to fetch SVG:', e);
		return null;
	}
}

// Default colors from silver metal (matches original paper-design shader)
const DEFAULT_METAL = createSilverMetal();

export function LiquidMetal({
	width,
	height,
	image,
	svg,
	svgSize = 512,
	colorLight = DEFAULT_METAL.colorLight,
	colorDark = DEFAULT_METAL.colorDark,
	colorBack = '#00000000',
	colorTint = DEFAULT_METAL.colorTint ?? '#ffffff',
	shape = 'none',
	animationMode = 'flow',
	pattern = 'linear',
	material = 'default',
	repetition = 2,
	softness = 0.1,
	shiftRed = 0.3,
	shiftBlue = 0.3,
	distortion = 0.07,
	contour = 0.4,
	angle = 70,
	speed = 1,
	scale = 0.6,
	fit = 'contain',
	style
}: LiquidMetalProps) {
	const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
	const [imageAspectRatio, setImageAspectRatio] = useState(1);

	// Determine if dimensions are numeric
	const numericWidth = typeof width === 'number' ? width : undefined;
	const numericHeight = typeof height === 'number' ? height : undefined;

	// Calculate canvas size based on props and aspect ratio
	const canvasSize = useMemo(() => {
		// Both numeric dimensions provided - use them directly
		if (numericWidth !== undefined && numericHeight !== undefined) {
			return { width: numericWidth, height: numericHeight };
		}

		// Only width provided - calculate height from aspect ratio
		if (numericWidth !== undefined && numericHeight === undefined) {
			return {
				width: numericWidth,
				height: Math.round(numericWidth / imageAspectRatio)
			};
		}

		// Only height provided - calculate width from aspect ratio
		if (numericHeight !== undefined && numericWidth === undefined) {
			return {
				width: Math.round(numericHeight * imageAspectRatio),
				height: numericHeight
			};
		}

		// Percentage or no dimensions - use layout measurements
		return layoutSize;
	}, [numericWidth, numericHeight, imageAspectRatio, layoutSize]);

	// Calculate the style dimensions for the container
	const containerDimensions = useMemo(() => {
		const dims: { width?: number | string; height?: number | string } = {};

		if (numericWidth !== undefined && numericHeight !== undefined) {
			dims.width = numericWidth;
			dims.height = numericHeight;
		} else if (numericWidth !== undefined) {
			dims.width = numericWidth;
			dims.height = Math.round(numericWidth / imageAspectRatio);
		} else if (numericHeight !== undefined) {
			dims.width = Math.round(numericHeight * imageAspectRatio);
			dims.height = numericHeight;
		} else {
			// Fallback to percentage or default
			dims.width = width ?? '100%';
			dims.height = height ?? '100%';
		}

		return dims;
	}, [numericWidth, numericHeight, width, height, imageAspectRatio]);
	const [processedSkiaImage, setProcessedSkiaImage] = useState<ReturnType<
		typeof Skia.Image.MakeImage
	> | null>(null);
	const [svgContent, setSvgContent] = useState<string | null>(null);

	// Check if image is an SVG URL (only strings can be SVG URLs)
	const isSvgUrl = typeof image === 'string' && image.endsWith('.svg');

	// Load raster image if provided (PNG/JPEG/WebP or local require)
	const skiaImage = useImage(image && !isSvgUrl ? image : null);

	// Animation time
	const time = useSharedValue(0);

	useFrameCallback(frameInfo => {
		time.value = ((frameInfo.timestamp ?? 0) / 1000) * speed;
	});

	// Fetch SVG from URL if image is an SVG URL
	useEffect(() => {
		if (isSvgUrl && typeof image === 'string') {
			fetchSvgFromUrl(image).then(content => {
				if (content) {
					setSvgContent(content);
				}
			});
		} else if (svg) {
			setSvgContent(svg);
		} else {
			setSvgContent(null);
		}
	}, [image, svg, isSvgUrl]);

	// Process SVG content
	useEffect(() => {
		if (svgContent) {
			const rasterized = rasterizeSvg(svgContent, svgSize);

			if (rasterized) {
				const { pixels, width: imgWidth, height: imgHeight } = rasterized;
				setImageAspectRatio(imgWidth / imgHeight);

				// Process through Poisson solver
				const processed = processImageForLiquidMetal(pixels, imgWidth, imgHeight);

				// Create Skia image
				const data = Skia.Data.fromBytes(processed);
				const skImg = Skia.Image.MakeImage(
					{
						width: imgWidth,
						height: imgHeight,
						colorType: ColorType.RGBA_8888,
						alphaType: AlphaType.Unpremul
					},
					data,
					imgWidth * 4
				);
				setProcessedSkiaImage(skImg);
			} else {
				// Fallback to placeholder
				createPlaceholder();
			}
		}
	}, [svgContent, svgSize]);

	// Process raster image when loaded
	useEffect(() => {
		if (skiaImage && image && !isSvgUrl) {
			const imgWidth = skiaImage.width();
			const imgHeight = skiaImage.height();
			setImageAspectRatio(imgWidth / imgHeight);

			try {
				const pixels = skiaImage.readPixels(0, 0, {
					width: imgWidth,
					height: imgHeight,
					colorType: ColorType.RGBA_8888,
					alphaType: AlphaType.Unpremul
				});

				if (pixels) {
					const processed = processImageForLiquidMetal(new Uint8Array(pixels), imgWidth, imgHeight);

					const data = Skia.Data.fromBytes(processed);
					const skImg = Skia.Image.MakeImage(
						{
							width: imgWidth,
							height: imgHeight,
							colorType: ColorType.RGBA_8888,
							alphaType: AlphaType.Unpremul
						},
						data,
						imgWidth * 4
					);
					setProcessedSkiaImage(skImg);
				}
			} catch (e) {
				console.warn('Failed to process image:', e);
				createPlaceholder();
			}
		}
	}, [skiaImage, image, isSvgUrl]);

	// Create placeholder for shape-based rendering
	const createPlaceholder = useCallback(() => {
		const placeholder = createPlaceholderImageData();
		const data = Skia.Data.fromBytes(placeholder);
		const skImg = Skia.Image.MakeImage(
			{ width: 1, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
			data,
			4
		);
		setProcessedSkiaImage(skImg);
		setImageAspectRatio(1);
	}, []);

	// Initialize placeholder if no image/svg
	useEffect(() => {
		if (!image && !svg) {
			createPlaceholder();
		}
	}, [image, svg, createPlaceholder]);

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

	// Parse metal colors (defaults are set in function parameters from DEFAULT_METAL)
	const colorLightParsed = useMemo(() => {
		const [r, g, b] = parseColor(colorLight);
		return [r, g, b] as [number, number, number];
	}, [colorLight]);

	const colorDarkParsed = useMemo(() => {
		const [r, g, b] = parseColor(colorDark);
		return [r, g, b] as [number, number, number];
	}, [colorDark]);

	const fitMode = fit === 'contain' ? 1 : fit === 'cover' ? 2 : 0;
	const isImage = image || svg ? 1.0 : 0.0;

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
			u_shape: LiquidMetalShapes[shape],
			u_isImage: isImage,
			u_scale: scale,
			u_fit: fitMode,
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
		shape,
		isImage,
		scale,
		fitMode,
		animationMode,
		pattern,
		material
	]);

	const handleLayout = useCallback((event: any) => {
		const { width: w, height: h } = event.nativeEvent.layout;
		setLayoutSize({ width: w, height: h });
	}, []);

	if (!shaderEffect) {
		return (
			<View style={[styles.container, style, containerDimensions]}>
				<View style={[styles.fallback, { backgroundColor: colorBack }]} />
			</View>
		);
	}

	return (
		<View style={[styles.container, style, containerDimensions]} onLayout={handleLayout}>
			{canvasSize.width > 0 && canvasSize.height > 0 && processedSkiaImage && (
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
	container: {
		// overflow removed to allow content to overflow parent
	},
	fallback: {
		flex: 1
	}
});

export default LiquidMetal;
