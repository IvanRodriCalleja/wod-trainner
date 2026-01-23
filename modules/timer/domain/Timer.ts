import { z } from 'zod';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { TimerFrame, createTimerFrame, timerFrameSchema } from './TimerFrame';
import { TimerPhase } from './TimerPhase';
import { TrainingTimer, TrainingTimerPhase, trainingTimerSchema } from './TrainingTimer';

// Schema & Types
export const timerConfigSchema = z.object({
	countdownDuration: z.number().int().nonnegative().default(10),
	showPlaceholder: z.boolean().default(true),
	showGoFrame: z.boolean().default(true)
});

export const timerSchema = z.object({
	name: z.string().optional(),
	frames: z.array(timerFrameSchema)
});

export type TimerConfig = z.infer<typeof timerConfigSchema>;
export type Timer = z.infer<typeof timerSchema>;

const DEFAULT_CONFIG: TimerConfig = {
	countdownDuration: 10,
	showPlaceholder: true,
	showGoFrame: true
};

// Validation
const validateInput = (input: unknown): TrainingTimer => trainingTimerSchema.parse(input);

const filterValidPhases = (phases: TrainingTimerPhase[]): TrainingTimerPhase[] =>
	phases.filter(phase => phase.duration > 0);

// Pre-workout frame creators
const createPlaceholderFrame = (): TimerFrame =>
	createTimerFrame({
		phase: TimerPhase.PLACEHOLDER,
		workoutType: WorkoutType.REST,
		time: 0,
		remainingTotalTime: 0,
		progress: 0
	});

const createCountdownFrames = (duration: number): TimerFrame[] =>
	Array.from({ length: duration }, (_, i) =>
		createTimerFrame({
			phase: TimerPhase.PRE_COUNTDOWN,
			workoutType: WorkoutType.REST,
			time: duration - i,
			remainingTotalTime: 0,
			progress: 0
		})
	);

const createGoFrame = (): TimerFrame =>
	createTimerFrame({
		phase: TimerPhase.GO,
		workoutType: WorkoutType.REST,
		time: 0,
		remainingTotalTime: 0,
		progress: 0
	});

const createPreWorkoutFrames = (config: TimerConfig): TimerFrame[] => [
	...(config.showPlaceholder ? [createPlaceholderFrame()] : []),
	...createCountdownFrames(config.countdownDuration),
	...(config.showGoFrame ? [createGoFrame()] : [])
];

// Training frame creators
const createPhaseFrames = (
	phase: TrainingTimerPhase,
	workoutType: WorkoutType,
	totalTime: number,
	elapsedFrames: number
): TimerFrame[] => {
	const duration = phase.duration;

	return Array.from({ length: duration }, (_, i) =>
		createTimerFrame({
			phase: TimerPhase.RUNNING,
			workoutType,
			time: duration - i,
			remainingTotalTime: totalTime - elapsedFrames - i,
			progress: (i + 1) / duration
		})
	);
};

const createTrainingFrames = (trainingTimer: TrainingTimer): TimerFrame[] => {
	const validPhases = filterValidPhases(trainingTimer.phases);
	const totalTime = validPhases.reduce((acc, phase) => acc + phase.duration, 0);

	const { frames } = validPhases.reduce<{ frames: TimerFrame[]; elapsedFrames: number }>(
		(acc, phase) => {
			const phaseFrames = createPhaseFrames(
				phase,
				trainingTimer.workoutType,
				totalTime,
				acc.elapsedFrames
			);

			return {
				frames: [...acc.frames, ...phaseFrames],
				elapsedFrames: acc.elapsedFrames + phase.duration
			};
		},
		{ frames: [], elapsedFrames: 0 }
	);

	return frames;
};

// Main factory
export const createTimer = (input: unknown, config: Partial<TimerConfig> = {}): Timer => {
	const trainingTimer = validateInput(input);
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };

	return {
		frames: [...createPreWorkoutFrames(resolvedConfig), ...createTrainingFrames(trainingTimer)]
	};
};
