import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

// Capture the frame callback so we can invoke it manually in tests
let frameCallback: ((frameInfo: { timestamp: number }) => void) | null = null;
let isCallbackActive = false;

// Mock react-native (required because it uses Flow syntax Bun can't parse)
mock.module('react-native', () => ({
	View: 'View',
	Text: 'Text',
	Platform: { OS: 'ios' }
}));

// Mock react-native-reanimated
mock.module('react-native-reanimated', () => ({
	useFrameCallback: (callback: (frameInfo: { timestamp: number }) => void, active: boolean) => {
		frameCallback = callback;
		isCallbackActive = active;
	},
	runOnJS: (fn: Function) => fn
}));

// Import after mocking
const { useFrameTick } = await import('./useFrameTick');
const { renderHook } = await import('@testing-library/react-native');

// Helper to simulate frame ticks
const simulateFrame = (timestamp: number) => {
	if (frameCallback && isCallbackActive) {
		frameCallback({ timestamp });
	}
};

describe('useFrameTick (real hook)', () => {
	beforeEach(() => {
		frameCallback = null;
		isCallbackActive = false;
	});

	afterEach(() => {
		frameCallback = null;
		isCallbackActive = false;
	});

	it('should call onTick immediately on first frame when running', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: true
			})
		);

		simulateFrame(1000);
		expect(ticks).toEqual([0]);
	});

	it('should not call onTick when not running', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: false
			})
		);

		simulateFrame(1000);
		expect(ticks).toEqual([]);
	});

	it('should call onTick every 1000ms', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: true
			})
		);

		simulateFrame(1000); // tick 0
		simulateFrame(1500); // no tick
		simulateFrame(2000); // tick 1
		simulateFrame(2500); // no tick
		simulateFrame(3000); // tick 2

		expect(ticks).toEqual([0, 1, 2]);
	});

	it('should handle pause/resume by ticking immediately after gap', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: true
			})
		);

		simulateFrame(1000); // tick 0
		simulateFrame(2000); // tick 1
		simulateFrame(10000); // tick 2 (immediately, gap > 1000ms)

		expect(ticks).toEqual([0, 1, 2]);
	});

	it('should maintain tick index across frames', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: true
			})
		);

		for (let i = 0; i < 5; i++) {
			simulateFrame(1000 + i * 1000);
		}

		expect(ticks).toEqual([0, 1, 2, 3, 4]);
	});

	it('should handle high-frequency frames without extra ticks', () => {
		const ticks: number[] = [];

		renderHook(() =>
			useFrameTick({
				onTick: (index: number) => ticks.push(index),
				isRunning: true
			})
		);

		// Simulate 60fps for 2 seconds
		for (let i = 0; i < 120; i++) {
			simulateFrame(1000 + i * 16.67);
		}

		expect(ticks.length).toBe(2);
	});
});
