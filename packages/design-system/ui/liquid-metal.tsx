import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
	AlphaType,
	Canvas,
	ColorType,
	Fill,
	ImageShader,
	Shader,
	Skia,
	matchFont,
	useImage
} from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
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

/** Metal color presets - [light/highlight color, dark/shadow color] as RGB hex */
export const LiquidMetalPresets: Record<LiquidMetalVariant, { light: string; dark: string }> = {
	silver: {
		light: '#FAFAFF', // Cool white highlight
		dark: '#1A1A1A' // Near black shadow
	},
	'silver-light': {
		light: '#FFFFFF', // Pure white highlight
		dark: '#4A4A4A' // Medium gray shadow (lighter contrast)
	},
	gold: {
		light: '#FFE4A0', // Warm golden highlight
		dark: '#5C4515' // Dark brown-gold shadow
	},
	bronze: {
		light: '#E8B87C', // Copper-orange highlight
		dark: '#3D2812' // Dark brown shadow
	},
	purple: {
		light: '#E8C4FF', // Lavender highlight
		dark: '#2A1040' // Deep purple shadow
	},
	blue: {
		light: '#C4E4FF', // Light sky blue highlight
		dark: '#0A2840' // Deep navy shadow
	},
	pink: {
		light: '#FFC4E8', // Soft pink highlight
		dark: '#401028' // Deep magenta shadow
	},
	yellow: {
		light: '#FFFF90', // Bright yellow highlight
		dark: '#4A4500' // Dark olive shadow
	},
	green: {
		light: '#C4FFC4', // Mint green highlight
		dark: '#0A400A' // Deep forest shadow
	},
	red: {
		light: '#FFC4C4', // Soft red highlight
		dark: '#400A0A' // Deep crimson shadow
	},
	cyan: {
		light: '#C4FFFF', // Aqua highlight
		dark: '#0A4040' // Deep teal shadow
	},
	orange: {
		light: '#FFD4A0', // Peach/orange highlight
		dark: '#402008' // Dark burnt orange shadow
	}
};

/** Image source - can be a URL string or a local require/import (e.g., require('./image.png')) */
export type LiquidMetalImageSource = string | number;

export interface LiquidMetalProps {
	width?: number | string;
	height?: number | string;
	/** Image source for the mask (PNG/JPEG/WebP - must have transparent background). Can be a URL string or local require/import */
	image?: LiquidMetalImageSource;
	/** SVG string content for the mask (alternative to image) */
	svg?: string;
	/** Target size for SVG rasterization (default: 512) */
	svgSize?: number;
	/** Text to render with liquid metal effect (alternative to image/svg) */
	text?: string;
	/** Font size for text rendering (default: 64) */
	fontSize?: number;
	/** Font family for text rendering */
	fontFamily?: string;
	/** Font weight for text rendering (default: 'bold') */
	fontWeight?:
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
	/** Font style for text rendering (default: 'normal') */
	fontStyle?: 'normal' | 'italic';
	/** Metal variant preset (default: "silver") */
	variant?: LiquidMetalVariant;
	/** Custom highlight color (overrides variant) */
	colorLight?: string;
	/** Custom shadow color (overrides variant) */
	colorDark?: string;
	colorBack?: string;
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
	/** When true, lighting follows the stripe angle instead of fixed Y-axis (default: false) */
	lightFollowsAngle?: boolean;
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

/**
 * Load SVG content from a local asset (require/import)
 */
async function loadLocalSvgAsset(assetModule: number): Promise<string | null> {
	try {
		const asset = Asset.fromModule(assetModule);
		await asset.downloadAsync();

		if (!asset.localUri) {
			console.warn('Failed to get local URI for SVG asset');
			return null;
		}

		// Check if it's an SVG file
		if (!asset.localUri.endsWith('.svg')) {
			return null;
		}

		// Fetch the local file content
		const response = await fetch(asset.localUri);
		return await response.text();
	} catch (e) {
		console.warn('Failed to load local SVG asset:', e);
		return null;
	}
}

/**
 * Check if an image source is likely an SVG (either URL or local asset)
 */
function isLikelySvgAsset(image: LiquidMetalImageSource): boolean {
	if (typeof image === 'string') {
		return image.endsWith('.svg');
	}
	// For local assets, we need to check the asset metadata
	if (typeof image === 'number') {
		try {
			const asset = Asset.fromModule(image);
			return asset.type === 'svg';
		} catch {
			return false;
		}
	}
	return false;
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
 * Crop pixels to bounding box
 */
function cropPixels(
	pixels: Uint8Array,
	srcWidth: number,
	bounds: { minX: number; minY: number; maxX: number; maxY: number }
): { pixels: Uint8Array; width: number; height: number } {
	const newWidth = bounds.maxX - bounds.minX + 1;
	const newHeight = bounds.maxY - bounds.minY + 1;
	const newPixels = new Uint8Array(newWidth * newHeight * 4);

	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			const srcX = bounds.minX + x;
			const srcY = bounds.minY + y;
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
	fontWeight:
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
		| '900' = 'bold',
	fontStyle: 'normal' | 'italic' = 'normal',
	maxWidth?: number
): { pixels: Uint8Array; width: number; height: number } | null {
	try {
		const fontWeightMap: Record<string, number> = {
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

		const font = matchFont({
			fontFamily: fontFamily ?? Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
			fontSize,
			fontWeight: fontWeightMap[fontWeight] as any,
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

		// Find actual content bounds and crop
		const pixelArray = new Uint8Array(pixels);
		const bounds = findContentBounds(pixelArray, renderWidth, renderHeight, 50);

		if (!bounds) {
			console.warn('No content found in rendered text');
			return null;
		}

		return cropPixels(pixelArray, renderWidth, bounds);
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
	fontWeight:
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
		| '900' = 'bold',
	fontStyle: 'normal' | 'italic' = 'normal'
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

export function LiquidMetal({
	width: widthProp,
	height: heightProp,
	image,
	svg,
	svgSize = 512,
	text,
	fontSize = 64,
	fontFamily,
	fontWeight = 'bold',
	fontStyle = 'normal',
	variant = 'silver',
	colorLight,
	colorDark,
	colorBack = '#aaaaac',
	colorTint = '#ffffff',
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
	lightFollowsAngle = false,
	style
}: LiquidMetalProps) {
	// Rasterize and process text once - returns both image and dimensions
	const textResult = useMemo(() => {
		if (text && !image && !svg) {
			return rasterizeAndProcessText(text, fontSize, fontFamily, fontWeight, fontStyle);
		}
		return null;
	}, [text, fontSize, fontFamily, fontWeight, fontStyle, image, svg]);

	// Determine final width/height - use text dimensions if available
	const width = widthProp ?? textResult?.width;
	const height = heightProp ?? textResult?.height;

	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [imageAspectRatio, setImageAspectRatio] = useState(1);
	const [processedSkiaImage, setProcessedSkiaImage] = useState<ReturnType<
		typeof Skia.Image.MakeImage
	> | null>(null);
	const [svgContent, setSvgContent] = useState<string | null>(null);

	// Set processed image from text result
	useEffect(() => {
		if (textResult) {
			setProcessedSkiaImage(textResult.skiaImage);
			setImageAspectRatio(textResult.width / textResult.height);
		}
	}, [textResult]);

	// Check if image is an SVG (URL string or local asset)
	const isSvg = useMemo(() => {
		if (!image) return false;
		return isLikelySvgAsset(image);
	}, [image]);

	// Load raster image if provided (PNG/JPEG/WebP) - works with both URL strings and require() results
	// Skip if it's an SVG - those are handled separately
	const skiaImage = useImage(image && !isSvg ? image : null);

	// Animation time
	const time = useSharedValue(0);

	useFrameCallback(frameInfo => {
		time.value = ((frameInfo.timestamp ?? 0) / 1000) * speed;
	});

	// Load SVG content from URL, local asset, or svg prop
	useEffect(() => {
		if (svg) {
			// Direct SVG string provided
			setSvgContent(svg);
		} else if (image && isSvg) {
			if (typeof image === 'string') {
				// SVG URL - fetch it
				fetchSvgFromUrl(image).then(content => {
					if (content) {
						setSvgContent(content);
					}
				});
			} else if (typeof image === 'number') {
				// Local SVG asset - load from expo-asset
				loadLocalSvgAsset(image).then(content => {
					if (content) {
						setSvgContent(content);
					}
				});
			}
		} else {
			setSvgContent(null);
		}
	}, [image, svg, isSvg]);

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

	// Process SVG content
	useEffect(() => {
		if (svgContent) {
			const rasterized = rasterizeSvg(svgContent, svgSize);

			if (rasterized) {
				const { pixels, width: imgWidth, height: imgHeight } = rasterized;
				setImageAspectRatio(imgWidth / imgHeight);

				const processed = processImageForLiquidMetal(pixels, imgWidth, imgHeight);

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
				createPlaceholder();
			}
		}
	}, [svgContent, svgSize, createPlaceholder]);

	// Process raster image when loaded - scale to target size for performance
	useEffect(() => {
		if (skiaImage && image && !isSvg) {
			const imgWidth = skiaImage.width();
			const imgHeight = skiaImage.height();
			const aspectRatio = imgWidth / imgHeight;
			setImageAspectRatio(aspectRatio);

			try {
				// Process at smaller size for performance (2x display size, max 128)
				const maxProcessSize = 128;
				const targetWidth =
					typeof width === 'number'
						? Math.min(Math.round(width * 2), maxProcessSize)
						: maxProcessSize;
				const targetHeight =
					typeof height === 'number'
						? Math.min(Math.round(height * 2), maxProcessSize)
						: Math.round(targetWidth / aspectRatio);

				// Scale image down for processing
				const surface = Skia.Surface.MakeOffscreen(targetWidth, targetHeight);
				if (!surface) {
					createPlaceholder();
					return;
				}

				const canvas = surface.getCanvas();
				canvas.clear(Skia.Color('transparent'));

				const srcRect = { x: 0, y: 0, width: imgWidth, height: imgHeight };
				const dstRect = { x: 0, y: 0, width: targetWidth, height: targetHeight };
				const paint = Skia.Paint();
				canvas.drawImageRect(skiaImage, srcRect, dstRect, paint);

				const scaledImage = surface.makeImageSnapshot();
				if (!scaledImage) {
					createPlaceholder();
					return;
				}

				const pixels = scaledImage.readPixels(0, 0, {
					width: targetWidth,
					height: targetHeight,
					colorType: ColorType.RGBA_8888,
					alphaType: AlphaType.Unpremul
				});

				if (pixels) {
					const processed = processImageForLiquidMetal(
						new Uint8Array(pixels),
						targetWidth,
						targetHeight
					);

					const data = Skia.Data.fromBytes(processed);
					const skImg = Skia.Image.MakeImage(
						{
							width: targetWidth,
							height: targetHeight,
							colorType: ColorType.RGBA_8888,
							alphaType: AlphaType.Unpremul
						},
						data,
						targetWidth * 4
					);
					setProcessedSkiaImage(skImg);
				}
			} catch (e) {
				console.warn('Failed to process image:', e);
				createPlaceholder();
			}
		}
	}, [skiaImage, image, isSvg, width, height, createPlaceholder]);

	// Initialize placeholder if no image/svg/text, or if text rasterization failed
	useEffect(() => {
		if (!image && !svg && !text) {
			createPlaceholder();
		} else if (text && !image && !svg && !textResult) {
			// Text was provided but rasterization failed
			createPlaceholder();
		}
	}, [image, svg, text, textResult, createPlaceholder]);

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

	const fitMode = fit === 'contain' ? 1 : fit === 'cover' ? 2 : 0;
	const isImage = image || svg || text ? 1.0 : 0.0;

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
			u_material: LiquidMetalMaterials[material],
			u_lightFollowsAngle: lightFollowsAngle ? 1.0 : 0.0
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
		material,
		lightFollowsAngle
	]);

	const handleLayout = useCallback((event: any) => {
		const { width: w, height: h } = event.nativeEvent.layout;
		setCanvasSize({ width: w, height: h });
	}, []);

	if (!shaderEffect) {
		return (
			<View style={[styles.container, { width, height }, style]}>
				<View style={[styles.fallback, { backgroundColor: colorBack }]} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { width, height }, style]} onLayout={handleLayout}>
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
