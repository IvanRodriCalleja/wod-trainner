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

export interface LiquidMetalProps {
	width?: number | string;
	height?: number | string;
	/** Image URL for the mask (PNG/JPEG/WebP - must have transparent background) */
	image?: string;
	/** SVG string content for the mask (alternative to image) */
	svg?: string;
	/** Target size for SVG rasterization (default: 512) */
	svgSize?: number;
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

export function LiquidMetal({
	width = '100%',
	height = '100%',
	image,
	svg,
	svgSize = 512,
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
	style
}: LiquidMetalProps) {
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [imageAspectRatio, setImageAspectRatio] = useState(1);
	const [processedSkiaImage, setProcessedSkiaImage] = useState<ReturnType<
		typeof Skia.Image.MakeImage
	> | null>(null);
	const [svgContent, setSvgContent] = useState<string | null>(null);

	// Load raster image if provided (PNG/JPEG/WebP)
	const skiaImage = useImage(image && !image.endsWith('.svg') ? image : null);

	// Animation time
	const time = useSharedValue(0);

	useFrameCallback(frameInfo => {
		time.value = ((frameInfo.timestamp ?? 0) / 1000) * speed;
	});

	// Fetch SVG from URL if image is an SVG URL
	useEffect(() => {
		if (image?.endsWith('.svg')) {
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
	}, [image, svg]);

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
		if (skiaImage && image && !image.endsWith('.svg')) {
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
	}, [skiaImage, image]);

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
		setCanvasSize({ width: w, height: h });
	}, []);

	if (!shaderEffect) {
		return (
			<View style={[styles.container, style, { width, height }]}>
				<View style={[styles.fallback, { backgroundColor: colorBack }]} />
			</View>
		);
	}

	return (
		<View style={[styles.container, style, { width, height }]} onLayout={handleLayout}>
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
