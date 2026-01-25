/**
 * Poisson Solver for React Native
 * 100% compatible port from @paper-design/shaders
 *
 * Generates distance field gradients from shape edges for the LiquidMetal effect.
 */

// Configuration for Poisson solver
export const POISSON_CONFIG = {
	workingSize: 256, // Size to solve at (mobile-optimized)
	iterations: 40 // SOR iterations for convergence
};

interface SparsePixelData {
	interiorPixels: Uint32Array;
	boundaryPixels: Uint32Array;
	pixelCount: number;
	neighborIndices: Int32Array;
}

/**
 * Process image data to generate edge gradient for liquid metal effect.
 * R channel = edge gradient (Poisson-solved distance field)
 * G channel = original alpha (opacity mask)
 */
export const processImageForLiquidMetal = (
	imageData: Uint8Array,
	width: number,
	height: number
): Uint8Array => {
	// Build masks using TypedArrays
	const shapeMask = new Uint8Array(width * height);
	const boundaryMask = new Uint8Array(width * height);

	// First pass: identify shape pixels based on alpha
	let shapePixelCount = 0;
	for (let i = 0, idx = 0; i < imageData.length; i += 4, idx++) {
		const a = imageData[i + 3];
		const isShape = a > 0 ? 1 : 0;
		shapeMask[idx] = isShape;
		shapePixelCount += isShape;
	}

	// If no shape pixels, return empty result
	if (shapePixelCount === 0) {
		return createPlaceholderImageData();
	}

	// Boundary detection with 8-connectivity
	const boundaryIndices: number[] = [];
	const interiorIndices: number[] = [];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;
			if (!shapeMask[idx]) continue;

			let isBoundary = false;

			if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
				isBoundary = true;
			} else {
				// Check all 8 neighbors
				isBoundary =
					!shapeMask[idx - 1] || // left
					!shapeMask[idx + 1] || // right
					!shapeMask[idx - width] || // top
					!shapeMask[idx + width] || // bottom
					!shapeMask[idx - width - 1] || // top-left
					!shapeMask[idx - width + 1] || // top-right
					!shapeMask[idx + width - 1] || // bottom-left
					!shapeMask[idx + width + 1]; // bottom-right
			}

			if (isBoundary) {
				boundaryMask[idx] = 1;
				boundaryIndices.push(idx);
			} else {
				interiorIndices.push(idx);
			}
		}
	}

	// Build sparse data structure
	const sparseData = buildSparseData(
		shapeMask,
		boundaryMask,
		new Uint32Array(interiorIndices),
		new Uint32Array(boundaryIndices),
		width,
		height
	);

	// Solve Poisson equation with Red-Black SOR
	const u = solvePoissonSparse(sparseData, shapeMask, width, height);

	// Find max value for normalization
	let maxVal = 0;
	for (let i = 0; i < interiorIndices.length; i++) {
		const idx = interiorIndices[i];
		if (u[idx] > maxVal) maxVal = u[idx];
	}

	// Generate output image data
	// R channel = edge gradient (inverted distance field)
	// G channel = original alpha
	const output = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;
			const px = idx * 4;
			const originalAlpha = imageData[idx * 4 + 3];

			if (!shapeMask[idx]) {
				// Background pixel
				output[px] = 255; // R - gradient (255 = edge)
				output[px + 1] = 0; // G - alpha (0 = transparent)
				output[px + 2] = 255;
				output[px + 3] = 255;
			} else {
				// Shape pixel
				const poissonRatio = maxVal > 0 ? u[idx] / maxVal : 0;
				const gray = Math.round(255 * (1 - poissonRatio));
				output[px] = gray; // R - gradient
				output[px + 1] = originalAlpha; // G - original alpha
				output[px + 2] = 255;
				output[px + 3] = 255;
			}
		}
	}

	return output;
};

const buildSparseData = (
	shapeMask: Uint8Array,
	boundaryMask: Uint8Array,
	interiorPixels: Uint32Array,
	boundaryPixels: Uint32Array,
	width: number,
	height: number
): SparsePixelData => {
	const pixelCount = interiorPixels.length;
	const neighborIndices = new Int32Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const idx = interiorPixels[i];
		const x = idx % width;
		const y = Math.floor(idx / width);

		// East neighbor
		neighborIndices[i * 4 + 0] = x < width - 1 && shapeMask[idx + 1] ? idx + 1 : -1;
		// West neighbor
		neighborIndices[i * 4 + 1] = x > 0 && shapeMask[idx - 1] ? idx - 1 : -1;
		// North neighbor
		neighborIndices[i * 4 + 2] = y > 0 && shapeMask[idx - width] ? idx - width : -1;
		// South neighbor
		neighborIndices[i * 4 + 3] = y < height - 1 && shapeMask[idx + width] ? idx + width : -1;
	}

	return {
		interiorPixels,
		boundaryPixels,
		pixelCount,
		neighborIndices
	};
};

const solvePoissonSparse = (
	sparseData: SparsePixelData,
	shapeMask: Uint8Array,
	width: number,
	height: number
): Float32Array => {
	const ITERATIONS = POISSON_CONFIG.iterations;
	const C = 0.01; // Controls gradient spread
	const omega = 1.9; // SOR relaxation parameter (1.8-1.95 optimal)

	const u = new Float32Array(width * height);
	const { interiorPixels, neighborIndices, pixelCount } = sparseData;

	// Pre-classify pixels as red or black for Red-Black SOR
	const redPixels: number[] = [];
	const blackPixels: number[] = [];

	for (let i = 0; i < pixelCount; i++) {
		const idx = interiorPixels[i];
		const x = idx % width;
		const y = Math.floor(idx / width);

		if ((x + y) % 2 === 0) {
			redPixels.push(i);
		} else {
			blackPixels.push(i);
		}
	}

	// Red-Black SOR iterations
	for (let iter = 0; iter < ITERATIONS; iter++) {
		// Red pass
		for (const i of redPixels) {
			const idx = interiorPixels[i];

			const eastIdx = neighborIndices[i * 4 + 0];
			const westIdx = neighborIndices[i * 4 + 1];
			const northIdx = neighborIndices[i * 4 + 2];
			const southIdx = neighborIndices[i * 4 + 3];

			let sumN = 0;
			if (eastIdx >= 0) sumN += u[eastIdx];
			if (westIdx >= 0) sumN += u[westIdx];
			if (northIdx >= 0) sumN += u[northIdx];
			if (southIdx >= 0) sumN += u[southIdx];

			const newValue = (C + sumN) / 4;
			u[idx] = omega * newValue + (1 - omega) * u[idx];
		}

		// Black pass
		for (const i of blackPixels) {
			const idx = interiorPixels[i];

			const eastIdx = neighborIndices[i * 4 + 0];
			const westIdx = neighborIndices[i * 4 + 1];
			const northIdx = neighborIndices[i * 4 + 2];
			const southIdx = neighborIndices[i * 4 + 3];

			let sumN = 0;
			if (eastIdx >= 0) sumN += u[eastIdx];
			if (westIdx >= 0) sumN += u[westIdx];
			if (northIdx >= 0) sumN += u[northIdx];
			if (southIdx >= 0) sumN += u[southIdx];

			const newValue = (C + sumN) / 4;
			u[idx] = omega * newValue + (1 - omega) * u[idx];
		}
	}

	return u;
};

/**
 * Create a 1x1 placeholder image for shape-based rendering (no image)
 */
export const createPlaceholderImageData = (): Uint8Array => {
	// 1x1 white pixel with full alpha
	// R=255 (edge), G=255 (opaque), B=255, A=255
	return new Uint8Array([255, 255, 255, 255]);
};
