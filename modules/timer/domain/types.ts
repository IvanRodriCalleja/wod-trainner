export enum TimerPhase {
	PRE_COUNTDOWN = 'PRE_COUNTDOWN',
	GO = 'GO',
	RUNNING = 'RUNNING'
}

export type TimerDisplayProps = {
	phase: TimerPhase;
	// For PRE_COUNTDOWN phase
	countdownValue?: number; // 10 -> 1
	// For RUNNING phase
	timeRemainingMs?: number; // Milliseconds remaining
	totalTimeMs?: number; // Total duration in ms
	isPaused?: boolean;
	// Theming
	colorClassName?: string; // e.g., 'bg-emerald-400'
};
