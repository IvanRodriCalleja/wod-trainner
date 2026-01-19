// === Timer Phase (display state) ===

// === Workout Segment Types ===
export type WorkoutSegmentType = 'EMOM' | 'AMRAP' | 'TABATA' | 'FORTIME' | 'REST';

// === INPUT: Workout Configuration ===
export type WorkoutSegment = {
	type: WorkoutSegmentType;
	durationMs: number;
	label?: string; // "Round 1", "Rest", etc.
	colorClassName?: string; // Override color per segment
};

export type WorkoutConfig = {
	segments: WorkoutSegment[];
	includePreCountdown?: boolean; // default true
	preCountdownSeconds?: number; // default 10
	defaultColorClassName?: string; // default 'bg-amber-400'
};

// === OUTPUT: Compiled Timeline ===
export type TimelineFrame = {
	phase: TimerPhase;
	display: string; // "10", "GO!", "00:59"
	segmentType?: WorkoutSegmentType;
	segmentIndex?: number; // Which segment we're in
	segmentLabel?: string; // Label for current segment
	secondInSegment?: number; // Current second within segment (0-indexed)
	totalSecondsInSegment?: number; // Total seconds in this segment
	colorClassName: string;
};

export type CompiledTimeline = TimelineFrame[];

// === Timer State ===
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export type TimerControls = {
	play: () => void;
	pause: () => void;
	reset: () => void;
	toggle: () => void;
};

export type UseTimerReturn = {
	timeline: CompiledTimeline;
	currentFrameIndex: number;
	currentFrame: TimelineFrame | null;
	state: TimerState;
	progress: number; // 0-1 segment progress for circular indicator
	overallProgress: number; // 0-1 progress through entire timeline
	controls: TimerControls;
};

// === Legacy Display Props (for backward compatibility) ===
export type TimerDisplayProps = {
	frame: TimelineFrame | null;
	isPaused?: boolean;
	progress?: number; // 0-1 for circular progress
};
