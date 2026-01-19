import {
	CompiledTimeline,
	TimelineFrame,
	TimerPhase,
	WorkoutConfig,
	WorkoutSegment
} from './types';

const DEFAULT_COLOR = 'bg-amber-400';
const DEFAULT_PRE_COUNTDOWN_SECONDS = 10;

/**
 * Formats seconds into MM:SS display string
 */
function formatSecondsDisplay(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generates PRE_COUNTDOWN frames (10 -> 1)
 */
function generatePreCountdownFrames(seconds: number, colorClassName: string): TimelineFrame[] {
	const frames: TimelineFrame[] = [];

	for (let i = seconds; i >= 1; i--) {
		frames.push({
			phase: TimerPhase.PRE_COUNTDOWN,
			display: i.toString(),
			colorClassName
		});
	}

	return frames;
}

/**
 * Generates GO frame
 */
function generateGoFrame(colorClassName: string): TimelineFrame {
	return {
		phase: TimerPhase.GO,
		display: 'GO!',
		colorClassName
	};
}

/**
 * Generates RUNNING frames for a workout segment
 * Counts down from duration to 1 second
 */
function generateSegmentFrames(
	segment: WorkoutSegment,
	segmentIndex: number,
	defaultColor: string
): TimelineFrame[] {
	const frames: TimelineFrame[] = [];
	const totalSeconds = Math.floor(segment.durationMs / 1000);
	const colorClassName = segment.colorClassName ?? defaultColor;

	// Count down from totalSeconds to 1
	for (let second = 0; second < totalSeconds; second++) {
		const remainingSeconds = totalSeconds - second;
		frames.push({
			phase: TimerPhase.RUNNING,
			display: formatSecondsDisplay(remainingSeconds),
			segmentType: segment.type,
			segmentIndex,
			segmentLabel: segment.label,
			secondInSegment: second,
			totalSecondsInSegment: totalSeconds,
			colorClassName
		});
	}

	return frames;
}

/**
 * Compiles a WorkoutConfig into a linear timeline of frames
 * Each frame represents 1 second of display
 */
export function compileTimeline(config: WorkoutConfig): CompiledTimeline {
	const {
		segments,
		includePreCountdown = true,
		preCountdownSeconds = DEFAULT_PRE_COUNTDOWN_SECONDS,
		defaultColorClassName = DEFAULT_COLOR
	} = config;

	const timeline: CompiledTimeline = [];

	// 1. Add PRE_COUNTDOWN frames if enabled
	if (includePreCountdown) {
		timeline.push(...generatePreCountdownFrames(preCountdownSeconds, defaultColorClassName));
	}

	// 2. Add GO frame
	timeline.push(generateGoFrame(defaultColorClassName));

	// 3. Add frames for each workout segment
	segments.forEach((segment, index) => {
		timeline.push(...generateSegmentFrames(segment, index, defaultColorClassName));
	});

	return timeline;
}

/**
 * Calculates the total duration of a compiled timeline in milliseconds
 */
export function getTimelineDurationMs(timeline: CompiledTimeline): number {
	return timeline.length * 1000;
}

/**
 * Gets the frame at a specific elapsed time
 */
export function getFrameAtTime(
	timeline: CompiledTimeline,
	elapsedMs: number
): { frame: TimelineFrame | null; index: number } {
	const index = Math.floor(elapsedMs / 1000);

	if (index < 0) {
		return { frame: timeline[0] ?? null, index: 0 };
	}

	if (index >= timeline.length) {
		return { frame: timeline[timeline.length - 1] ?? null, index: timeline.length - 1 };
	}

	return { frame: timeline[index], index };
}

/**
 * Calculates overall progress through the timeline (0-1)
 */
export function calculateTimelineProgress(
	timeline: CompiledTimeline,
	currentIndex: number
): number {
	if (timeline.length <= 1) return 1;
	return currentIndex / (timeline.length - 1);
}

/**
 * Calculates progress within the current segment (0-1)
 * Useful for the circular progress indicator
 */
export function calculateSegmentProgress(frame: TimelineFrame | null): number {
	if (!frame) return 0;

	if (frame.phase === TimerPhase.PRE_COUNTDOWN) {
		// Pre-countdown doesn't show segment progress
		return 0;
	}

	if (frame.phase === TimerPhase.GO) {
		return 1;
	}

	// RUNNING phase
	if (
		frame.secondInSegment !== undefined &&
		frame.totalSecondsInSegment !== undefined &&
		frame.totalSecondsInSegment > 0
	) {
		return (frame.secondInSegment + 1) / frame.totalSecondsInSegment;
	}

	return 0;
}
