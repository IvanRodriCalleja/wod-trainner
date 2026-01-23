import { act, renderHook } from '@testing-library/react-native';

import { useFrameTick } from './useFrameTick';

// Mock state - must be defined before jest.mock
const mockState = {
	callback: null as ((frameInfo: { timestamp: number }) => void) | null,
	isActive: false,
	controller: null as { setActive: jest.Mock; isActive: boolean } | null
};

// Mock react-native-reanimated with inline factory
jest.mock('react-native-reanimated', () => ({
	useFrameCallback: jest.fn(
		(callback: (frameInfo: { timestamp: number }) => void, autostart: boolean) => {
			const controller = {
				setActive: jest.fn((active: boolean) => {
					mockState.isActive = active;
				}),
				get isActive() {
					return mockState.isActive;
				}
			};
			mockState.callback = callback;
			mockState.isActive = autostart;
			mockState.controller = controller;
			return controller;
		}
	)
}));

function resetMockState() {
	mockState.callback = null;
	mockState.isActive = false;
	mockState.controller = null;
}

/**
 * Simulates a frame tick at the given timestamp.
 * This triggers the callback captured from useFrameCallback.
 */
function simulateFrame(timestamp: number) {
	if (mockState.callback && mockState.isActive) {
		mockState.callback({ timestamp });
	}
}

/**
 * Simulates multiple frames at 60fps for a given duration.
 */
function simulateFrames(startTime: number, durationMs: number, fps = 60) {
	const frameInterval = 1000 / fps;
	const frameCount = Math.ceil(durationMs / frameInterval);

	for (let i = 0; i <= frameCount; i++) {
		simulateFrame(startTime + i * frameInterval);
	}
}

describe('useFrameTick', () => {
	beforeEach(() => {
		resetMockState();
	});

	describe('initialization', () => {
		it('starts inactive by default', () => {
			renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick: jest.fn()
				})
			);

			expect(mockState.isActive).toBe(false);
		});

		it('initializes tick index at 0 by default', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());
			simulateFrame(1000);

			expect(onTick).toHaveBeenCalledWith(0);
		});

		it('initializes tick index at startAtIndex when provided', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					startAtIndex: 5,
					onTick
				})
			);

			act(() => result.current.start());
			simulateFrame(1000);

			expect(onTick).toHaveBeenCalledWith(5);
		});
	});

	describe('start()', () => {
		it('activates the frame callback', () => {
			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick: jest.fn()
				})
			);

			expect(mockState.isActive).toBe(false);

			act(() => result.current.start());

			expect(mockState.controller?.setActive).toHaveBeenCalledWith(true);
			expect(mockState.isActive).toBe(true);
		});

		it('triggers immediate tick on first frame', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			expect(onTick).not.toHaveBeenCalled();

			simulateFrame(1000);

			expect(onTick).toHaveBeenCalledTimes(1);
			expect(onTick).toHaveBeenCalledWith(0);
		});
	});

	describe('stop()', () => {
		it('deactivates the frame callback', () => {
			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick: jest.fn()
				})
			);

			act(() => result.current.start());
			expect(mockState.isActive).toBe(true);

			act(() => result.current.stop());

			expect(mockState.controller?.setActive).toHaveBeenLastCalledWith(false);
			expect(mockState.isActive).toBe(false);
		});

		it('prevents further ticks when stopped', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());
			simulateFrame(1000); // tick 0

			act(() => result.current.stop());
			simulateFrame(2000); // should not tick (stopped)

			expect(onTick).toHaveBeenCalledTimes(1);
		});
	});

	describe('toggle()', () => {
		it('activates when inactive', () => {
			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick: jest.fn()
				})
			);

			expect(mockState.isActive).toBe(false);

			act(() => result.current.toggle());

			expect(mockState.isActive).toBe(true);
		});

		it('deactivates when active', () => {
			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick: jest.fn()
				})
			);

			act(() => result.current.start());
			expect(mockState.isActive).toBe(true);

			act(() => result.current.toggle());

			expect(mockState.isActive).toBe(false);
		});
	});

	describe('reset()', () => {
		it('resets tick index to 0', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			// Run for 3 ticks
			act(() => result.current.start());
			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1
			simulateFrame(3000); // tick 2

			// Reset and restart
			act(() => {
				result.current.stop();
				result.current.reset();
				result.current.start();
			});

			simulateFrame(4000); // should be tick 0 again

			expect(onTick).toHaveBeenLastCalledWith(0);
			expect(onTick).toHaveBeenCalledTimes(4);
		});

		it('allows immediate tick after reset (clears lastTickTime)', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());
			simulateFrame(1000); // tick 0
			simulateFrame(1500); // no tick (< 1000ms since last)

			act(() => {
				result.current.stop();
				result.current.reset();
				result.current.start();
			});

			// Should tick immediately regardless of timestamp
			simulateFrame(1600);

			expect(onTick).toHaveBeenCalledTimes(2);
			expect(onTick).toHaveBeenLastCalledWith(0);
		});
	});

	describe('tick timing', () => {
		it('ticks every 1000ms', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0 (immediate)
			simulateFrame(1500); // no tick
			simulateFrame(2000); // tick 1
			simulateFrame(2500); // no tick
			simulateFrame(3000); // tick 2

			expect(onTick).toHaveBeenCalledTimes(3);
			expect(onTick).toHaveBeenNthCalledWith(1, 0);
			expect(onTick).toHaveBeenNthCalledWith(2, 1);
			expect(onTick).toHaveBeenNthCalledWith(3, 2);
		});

		it('does not tick more than once per 1000ms', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(1100);
			simulateFrame(1200);
			simulateFrame(1999); // still no tick
			simulateFrame(2000); // tick 1

			expect(onTick).toHaveBeenCalledTimes(2);
		});

		it('handles 60fps without extra ticks', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			// Simulate 2 seconds at 60fps
			simulateFrames(1000, 2000, 60);

			// Should have ticked at: 1000ms (immediate), 2000ms, 3000ms = 3 ticks
			expect(onTick).toHaveBeenCalledTimes(3);
		});

		it('ticks immediately after long pause (handles resume)', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1
			// Long gap simulating app being paused
			simulateFrame(15000); // tick 2 (gap > 1000ms)

			expect(onTick).toHaveBeenCalledTimes(3);
		});

		it('increments tick index correctly', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			for (let i = 0; i < 5; i++) {
				simulateFrame(1000 + i * 1000);
			}

			expect(onTick).toHaveBeenNthCalledWith(1, 0);
			expect(onTick).toHaveBeenNthCalledWith(2, 1);
			expect(onTick).toHaveBeenNthCalledWith(3, 2);
			expect(onTick).toHaveBeenNthCalledWith(4, 3);
			expect(onTick).toHaveBeenNthCalledWith(5, 4);
		});
	});

	describe('maxTicks', () => {
		it('stops ticking when maxTicks is reached', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 3,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1
			simulateFrame(3000); // tick 2
			simulateFrame(4000); // should stop here (maxTicks reached)
			simulateFrame(5000); // no tick

			expect(onTick).toHaveBeenCalledTimes(3);
		});

		it('deactivates frame callback when maxTicks is reached', () => {
			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 2,
					onTick: jest.fn()
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1
			simulateFrame(3000); // maxTicks reached

			expect(mockState.controller?.setActive).toHaveBeenLastCalledWith(false);
		});

		it('works correctly with maxTicks of 1', () => {
			const onTick = jest.fn();
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 1,
					onTick,
					onComplete
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // complete

			expect(onTick).toHaveBeenCalledTimes(1);
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('respects startAtIndex when checking maxTicks', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 5,
					startAtIndex: 3,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 3
			simulateFrame(2000); // tick 4
			simulateFrame(3000); // complete (index 5 >= maxTicks 5)
			simulateFrame(4000); // no tick

			expect(onTick).toHaveBeenCalledTimes(2);
			expect(onTick).toHaveBeenNthCalledWith(1, 3);
			expect(onTick).toHaveBeenNthCalledWith(2, 4);
		});
	});

	describe('onComplete', () => {
		it('calls onComplete when maxTicks is reached', () => {
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 2,
					onTick: jest.fn(),
					onComplete
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			expect(onComplete).not.toHaveBeenCalled();

			simulateFrame(2000); // tick 1
			expect(onComplete).not.toHaveBeenCalled();

			simulateFrame(3000); // maxTicks reached
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('does not error when onComplete is not provided', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 1,
					onTick
				})
			);

			act(() => result.current.start());

			expect(() => {
				simulateFrame(1000); // tick 0
				simulateFrame(2000); // complete
			}).not.toThrow();
		});

		it('calls onComplete only once', () => {
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 1,
					onTick: jest.fn(),
					onComplete
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // complete
			simulateFrame(3000); // already stopped
			simulateFrame(4000); // still stopped

			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});

	describe('pause and resume', () => {
		it('resumes from where it stopped', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1

			act(() => result.current.stop());

			simulateFrame(3000); // no tick (stopped)
			simulateFrame(4000); // no tick (stopped)

			act(() => result.current.start());

			simulateFrame(10000); // tick 2 (gap > 1000ms triggers tick)

			expect(onTick).toHaveBeenCalledTimes(3);
			expect(onTick).toHaveBeenNthCalledWith(3, 2);
		});

		it('maintains tick index across pause/resume cycles', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			// First run
			act(() => result.current.start());
			simulateFrame(1000); // tick 0
			simulateFrame(2000); // tick 1
			act(() => result.current.stop());

			// Second run
			act(() => result.current.start());
			simulateFrame(10000); // tick 2
			simulateFrame(11000); // tick 3
			act(() => result.current.stop());

			// Third run
			act(() => result.current.start());
			simulateFrame(20000); // tick 4

			expect(onTick).toHaveBeenNthCalledWith(5, 4);
		});
	});

	describe('edge cases', () => {
		it('handles maxTicks of 0', () => {
			const onTick = jest.fn();
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 0,
					onTick,
					onComplete
				})
			);

			act(() => result.current.start());
			simulateFrame(1000);

			expect(onTick).not.toHaveBeenCalled();
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('handles startAtIndex equal to maxTicks', () => {
			const onTick = jest.fn();
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 5,
					startAtIndex: 5,
					onTick,
					onComplete
				})
			);

			act(() => result.current.start());
			simulateFrame(1000);

			expect(onTick).not.toHaveBeenCalled();
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('handles startAtIndex greater than maxTicks', () => {
			const onTick = jest.fn();
			const onComplete = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 5,
					startAtIndex: 10,
					onTick,
					onComplete
				})
			);

			act(() => result.current.start());
			simulateFrame(1000);

			expect(onTick).not.toHaveBeenCalled();
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it('handles rapid start/stop/toggle calls', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => {
				result.current.start();
				result.current.stop();
				result.current.toggle(); // now active
				result.current.toggle(); // now inactive
				result.current.start(); // now active
			});

			expect(mockState.isActive).toBe(true);

			simulateFrame(1000);
			expect(onTick).toHaveBeenCalledTimes(1);
		});

		it('handles timestamp 0', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			simulateFrame(0); // tick 0
			simulateFrame(1000); // tick 1

			expect(onTick).toHaveBeenCalledTimes(2);
		});

		it('handles very large timestamps', () => {
			const onTick = jest.fn();

			const { result } = renderHook(() =>
				useFrameTick({
					maxTicks: 10,
					onTick
				})
			);

			act(() => result.current.start());

			const largeTimestamp = 1e12;
			simulateFrame(largeTimestamp);
			simulateFrame(largeTimestamp + 1000);
			simulateFrame(largeTimestamp + 2000);

			expect(onTick).toHaveBeenCalledTimes(3);
		});
	});
});
