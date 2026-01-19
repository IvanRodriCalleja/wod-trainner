import { useCallback, useMemo, useState } from 'react';

import { useFrameCallback } from 'react-native-reanimated';

import {
	calculateSegmentProgress,
	calculateTimelineProgress,
	compileTimeline,
	getFrameAtTime
} from '../domain/timelineCompiler';
import {
	CompiledTimeline,
	TimelineFrame,
	TimerControls,
	TimerState,
	UseTimerReturn,
	WorkoutConfig
} from '../domain/types';

type UseTimerOptions = {
	onComplete?: () => void;
	onFrameChange?: (frame: TimelineFrame, index: number) => void;
};

export function useTimer(config: WorkoutConfig, options: UseTimerOptions = {}): UseTimerReturn {
	const { onComplete, onFrameChange } = options;

	// Compile timeline once (memoized)
	const timeline: CompiledTimeline = useMemo(() => compileTimeline(config), [config]);

	// Timer state
	const [state, setState] = useState<TimerState>('idle');
	const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
	const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
	const [pausedElapsed, setPausedElapsed] = useState(0);

	// Current frame derived from index
	const currentFrame = timeline[currentFrameIndex] ?? null;

	// Progress calculations
	const overallProgress = calculateTimelineProgress(timeline, currentFrameIndex);
	const segmentProgress = calculateSegmentProgress(currentFrame);

	// Frame callback for precise timing (runs on UI thread)
	useFrameCallback(frameInfo => {
		if (state !== 'running' || startTimestamp === null) return;

		const elapsedMs = frameInfo.timestamp - startTimestamp + pausedElapsed;
		const { index } = getFrameAtTime(timeline, elapsedMs);

		// Only update if frame changed
		if (index !== currentFrameIndex) {
			setCurrentFrameIndex(index);

			const frame = timeline[index];
			if (frame && onFrameChange) {
				onFrameChange(frame, index);
			}

			// Check for completion
			if (index >= timeline.length - 1) {
				setState('completed');
				onComplete?.();
			}
		}
	}, state === 'running');

	// Controls
	const play = useCallback(() => {
		if (state === 'completed') {
			// Reset and play
			setCurrentFrameIndex(0);
			setPausedElapsed(0);
		}
		setStartTimestamp(performance.now());
		setState('running');
	}, [state]);

	const pause = useCallback(() => {
		if (state === 'running' && startTimestamp !== null) {
			// Save elapsed time before pausing
			const elapsed = performance.now() - startTimestamp + pausedElapsed;
			setPausedElapsed(elapsed);
			setStartTimestamp(null);
			setState('paused');
		}
	}, [state, startTimestamp, pausedElapsed]);

	const reset = useCallback(() => {
		setStartTimestamp(null);
		setPausedElapsed(0);
		setCurrentFrameIndex(0);
		setState('idle');
	}, []);

	const toggle = useCallback(() => {
		if (state === 'running') {
			pause();
		} else {
			play();
		}
	}, [state, play, pause]);

	const controls: TimerControls = useMemo(
		() => ({
			play,
			pause,
			reset,
			toggle
		}),
		[play, pause, reset, toggle]
	);

	return {
		timeline,
		currentFrameIndex,
		currentFrame,
		state,
		progress: segmentProgress,
		overallProgress,
		controls
	};
}
