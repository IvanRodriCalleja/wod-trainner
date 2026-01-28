export { LiquidMetalText, default as LiquidMetalTextDefault } from './LiquidMetalText';
export type {
	AnimationMode,
	FontStyle,
	FontWeight,
	LiquidMetalTextProps,
	LiquidMetalTextVariant,
	Material,
	Pattern
} from './LiquidMetalText';

export { liquidMetalTextShader } from './textShader';

export {
	liquidMetalShader,
	LiquidMetalAnimationModes,
	LiquidMetalMaterials,
	LiquidMetalPatterns,
	LiquidMetalShapes
} from './shaders';
export type {
	LiquidMetalAnimationMode,
	LiquidMetalMaterial,
	LiquidMetalPattern,
	LiquidMetalShape
} from './shaders';

export { processImageForLiquidMetal, createPlaceholderImageData } from './poissonSolver';
