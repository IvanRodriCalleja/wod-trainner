import { ZodError } from 'zod';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

import { createTimer } from './Timer';
import { TimerPhase } from './TimerPhase';
import { TrainingTimer } from './TrainingTimer';

describe('Timer', () => {
	describe('createTimer', () => {
		describe('frame structure', () => {
			it('creates correct frame sequence: placeholder -> countdown -> GO -> training frames', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer);

				// 1 placeholder + 10 countdown + 1 GO + 3 training = 15 frames
				expect(timer.frames.length).toBe(15);

				// Verify frame sequence by phase
				expect(timer.frames[0].phase).toBe(TimerPhase.PLACEHOLDER);

				for (let i = 1; i <= 10; i++) {
					expect(timer.frames[i].phase).toBe(TimerPhase.PRE_COUNTDOWN);
				}

				expect(timer.frames[11].phase).toBe(TimerPhase.GO);

				for (let i = 12; i < 15; i++) {
					expect(timer.frames[i].phase).toBe(TimerPhase.RUNNING);
				}
			});

			it('creates 12 frames (1 placeholder + 10 countdown + 1 GO) for empty phases', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.EMOM,
					phases: []
				};

				const timer = createTimer(trainingTimer);

				expect(timer.frames.length).toBe(12);
				expect(timer.frames[0].phase).toBe(TimerPhase.PLACEHOLDER);
				expect(timer.frames[11].phase).toBe(TimerPhase.GO);
			});
		});

		describe('placeholder frame', () => {
			it('has correct initial values', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.AMRAP,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const placeholderFrame = timer.frames[0];

				expect(placeholderFrame).toEqual({
					phase: TimerPhase.PLACEHOLDER,
					workoutType: WorkoutType.REST, // Always REST for placeholder
					time: 0,
					remainingTotalTime: 0,
					progress: 0
				});
			});
		});

		describe('countdown frames', () => {
			it('creates 10 countdown frames counting down from 10 to 1', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);
				const countdownFrames = timer.frames.slice(1, 11);

				expect(countdownFrames.length).toBe(10);

				for (let i = 0; i < 10; i++) {
					expect(countdownFrames[i].time).toBe(10 - i);
					expect(countdownFrames[i].phase).toBe(TimerPhase.PRE_COUNTDOWN);
				}
			});

			it('countdown frames always have REST workout type regardless of training type', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);
				const countdownFrames = timer.frames.slice(1, 11);

				countdownFrames.forEach(frame => {
					expect(frame.workoutType).toBe(WorkoutType.REST);
				});
			});

			it('countdown frames have zero remainingTotalTime and progress', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.FORTIME,
					phases: [{ duration: 10 }]
				};

				const timer = createTimer(trainingTimer);
				const countdownFrames = timer.frames.slice(1, 11);

				countdownFrames.forEach(frame => {
					expect(frame.remainingTotalTime).toBe(0);
					expect(frame.progress).toBe(0);
				});
			});
		});

		describe('GO frame', () => {
			it('has correct values', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.EMOM,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const goFrame = timer.frames[11];

				expect(goFrame).toEqual({
					phase: TimerPhase.GO,
					workoutType: WorkoutType.REST, // Always REST for GO frame
					time: 0,
					remainingTotalTime: 0,
					progress: 0
				});
			});
		});

		describe('training frames - time calculation', () => {
			it('counts down time from phase duration to 1', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.map(f => f.time)).toEqual([5, 4, 3, 2, 1]);
			});

			it('creates one frame per second of phase duration', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.AMRAP,
					phases: [{ duration: 10 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(10);
			});

			it('handles single second phase correctly', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(1);
				expect(trainingFrames[0].time).toBe(1);
			});
		});

		describe('training frames - workout type', () => {
			it.each([
				WorkoutType.TABATA,
				WorkoutType.EMOM,
				WorkoutType.AMRAP,
				WorkoutType.FORTIME,
				WorkoutType.REST
			])('training frames have workout type %s from training timer', workoutType => {
				const trainingTimer: TrainingTimer = {
					workoutType,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				trainingFrames.forEach(frame => {
					expect(frame.workoutType).toBe(workoutType);
				});
			});
		});

		describe('training frames - progress calculation', () => {
			it('first frame of phase has progress of 1/duration', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const firstTrainingFrame = timer.frames[12];

				expect(firstTrainingFrame.progress).toBeCloseTo(0.2, 10); // 1/5 = 0.2
			});

			it('increments progress linearly through phase', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// For 5 second phase: 0.2, 0.4, 0.6, 0.8, 1.0
				const expectedProgress = [0.2, 0.4, 0.6, 0.8, 1.0];
				trainingFrames.forEach((frame, i) => {
					expect(frame.progress).toBeCloseTo(expectedProgress[i], 10);
				});
			});

			it('progress reaches 1.0 on the last frame of each phase', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 4 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				const maxProgress = Math.max(...trainingFrames.map(f => f.progress));
				expect(maxProgress).toBe(1.0);

				// The progress values are: 0.25, 0.5, 0.75, 1.0
				expect(trainingFrames.map(f => f.progress)).toEqual([0.25, 0.5, 0.75, 1.0]);
			});

			it('single second phase has progress of 1.0', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames[0].progress).toBe(1.0);
			});

			it('progress resets at start of each phase in multi-phase timer', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }, { duration: 3 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// First phase: 1/3, 2/3, 3/3
				// Second phase: 1/3, 2/3, 3/3
				expect(trainingFrames[0].progress).toBeCloseTo(1 / 3, 10); // Start of first phase
				expect(trainingFrames[2].progress).toBe(1.0); // End of first phase
				expect(trainingFrames[3].progress).toBeCloseTo(1 / 3, 10); // Start of second phase (resets)
				expect(trainingFrames[5].progress).toBe(1.0); // End of second phase
			});
		});

		describe('training frames - remaining total time calculation', () => {
			it('decrements remaining total time across all frames', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.map(f => f.remainingTotalTime)).toEqual([5, 4, 3, 2, 1]);
			});

			it('remainingTotalTime matches time on first frame (single phase)', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 10 }]
				};

				const timer = createTimer(trainingTimer);
				const firstTrainingFrame = timer.frames[12];

				// time and remainingTotalTime are consistent
				expect(firstTrainingFrame.time).toBe(10);
				expect(firstTrainingFrame.remainingTotalTime).toBe(10);
			});

			it('ends with remainingTotalTime of 1 on last frame', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);
				const lastFrame = timer.frames[timer.frames.length - 1];

				expect(lastFrame.remainingTotalTime).toBe(1);
				expect(lastFrame.time).toBe(1);
			});

			it('remaining total time continues across multiple phases', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }, { duration: 2 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// Total time = 5 seconds
				// First phase (3s): remainingTotalTime = 5, 4, 3
				// Second phase (2s): remainingTotalTime = 2, 1
				expect(trainingFrames.map(f => f.remainingTotalTime)).toEqual([5, 4, 3, 2, 1]);
			});
		});

		describe('multiple phases', () => {
			it('creates frames for all phases sequentially', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.EMOM,
					phases: [{ duration: 2 }, { duration: 3 }, { duration: 2 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(7); // 2 + 3 + 2

				// First phase times: 2, 1
				expect(trainingFrames[0].time).toBe(2);
				expect(trainingFrames[1].time).toBe(1);

				// Second phase times: 3, 2, 1
				expect(trainingFrames[2].time).toBe(3);
				expect(trainingFrames[3].time).toBe(2);
				expect(trainingFrames[4].time).toBe(1);

				// Third phase times: 2, 1
				expect(trainingFrames[5].time).toBe(2);
				expect(trainingFrames[6].time).toBe(1);
			});

			it('progress restarts for each phase', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 2 }, { duration: 2 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// First phase: progress 0.5, 1.0
				// Second phase: progress 0.5, 1.0
				expect(trainingFrames[0].progress).toBe(0.5);
				expect(trainingFrames[1].progress).toBe(1.0);
				expect(trainingFrames[2].progress).toBe(0.5);
				expect(trainingFrames[3].progress).toBe(1.0);
			});

			it('remaining total time decrements continuously across phases', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.AMRAP,
					phases: [{ duration: 2 }, { duration: 3 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// Total = 5 seconds
				// Remaining times: 5, 4, 3, 2, 1
				expect(trainingFrames.map(f => f.remainingTotalTime)).toEqual([5, 4, 3, 2, 1]);
			});
		});

		describe('edge cases', () => {
			it('handles many short phases', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: Array.from({ length: 10 }, () => ({ duration: 1 }))
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(10);

				// Each frame shows time=1 and progress=1.0 (single second = 100%)
				trainingFrames.forEach(frame => {
					expect(frame.time).toBe(1);
					expect(frame.progress).toBe(1.0);
				});
			});

			it('handles very long single phase', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.AMRAP,
					phases: [{ duration: 1000 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(1000);
				expect(trainingFrames[0].time).toBe(1000);
				expect(trainingFrames[0].remainingTotalTime).toBe(1000);
				expect(trainingFrames[999].time).toBe(1);
				expect(trainingFrames[999].remainingTotalTime).toBe(1);
			});

			it('handles mixed short and long phases', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.FORTIME,
					phases: [{ duration: 1 }, { duration: 100 }, { duration: 1 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				expect(trainingFrames.length).toBe(102);

				// First phase: time=1, remaining=102
				expect(trainingFrames[0].time).toBe(1);
				expect(trainingFrames[0].remainingTotalTime).toBe(102);

				// Last frame of middle phase: time=1, remaining=2
				expect(trainingFrames[100].time).toBe(1);
				expect(trainingFrames[100].remainingTotalTime).toBe(2);

				// Last phase: time=1, remaining=1
				expect(trainingFrames[101].time).toBe(1);
				expect(trainingFrames[101].remainingTotalTime).toBe(1);
			});

			it('handles phase with zero duration (creates no frames for that phase)', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 2 }, { duration: 0 }, { duration: 2 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				// 2 + 0 + 2 = 4 frames
				expect(trainingFrames.length).toBe(4);

				// Remaining times should be: 4, 3, 2, 1 (total=4)
				expect(trainingFrames.map(f => f.remainingTotalTime)).toEqual([4, 3, 2, 1]);
			});
		});

		describe('timer object structure', () => {
			it('returns Timer type with frames array', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);

				expect(timer).toHaveProperty('frames');
				expect(Array.isArray(timer.frames)).toBe(true);
			});

			it('Timer.name is undefined (TODO in code)', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 1 }]
				};

				const timer = createTimer(trainingTimer);

				expect(timer.name).toBeUndefined();
			});
		});

		describe('real-world scenarios', () => {
			it('TABATA workout: 20s work / 10s rest for 8 rounds (simplified as phases)', () => {
				// Simulating a typical TABATA with 4 rounds (8 phases: work, rest, work, rest...)
				const phases = Array.from({ length: 4 }, () => [{ duration: 20 }, { duration: 10 }]).flat();

				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases
				};

				const timer = createTimer(trainingTimer);
				const totalTrainingSeconds = 4 * (20 + 10); // 120 seconds

				// 12 (countdown) + 120 (training) = 132
				expect(timer.frames.length).toBe(132);

				const trainingFrames = timer.frames.slice(12);

				// First work phase starts
				expect(trainingFrames[0].time).toBe(20);
				expect(trainingFrames[0].progress).toBeCloseTo(1 / 20, 10);
				expect(trainingFrames[0].remainingTotalTime).toBe(totalTrainingSeconds);

				// Last frame of first work phase
				expect(trainingFrames[19].time).toBe(1);
				expect(trainingFrames[19].progress).toBe(1.0);

				// First rest phase starts
				expect(trainingFrames[20].time).toBe(10);
				expect(trainingFrames[20].progress).toBeCloseTo(1 / 10, 10);

				// Final frame
				expect(trainingFrames[119].time).toBe(1);
				expect(trainingFrames[119].remainingTotalTime).toBe(1);
			});

			it('EMOM: 10 minutes (one phase per minute)', () => {
				const phases = Array.from({ length: 10 }, () => ({ duration: 60 }));

				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.EMOM,
					phases
				};

				const timer = createTimer(trainingTimer);
				const totalSeconds = 10 * 60; // 600 seconds

				expect(timer.frames.length).toBe(12 + totalSeconds);

				const trainingFrames = timer.frames.slice(12);

				// Each minute starts with time=60 and progress=1/60
				for (let min = 0; min < 10; min++) {
					const frameIndex = min * 60;
					expect(trainingFrames[frameIndex].time).toBe(60);
					expect(trainingFrames[frameIndex].progress).toBeCloseTo(1 / 60, 10);
				}

				// Each minute ends with progress=1.0
				for (let min = 0; min < 10; min++) {
					const frameIndex = min * 60 + 59;
					expect(trainingFrames[frameIndex].progress).toBe(1.0);
				}
			});

			it('AMRAP: 12 minute workout (single phase)', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.AMRAP,
					phases: [{ duration: 12 * 60 }] // 720 seconds
				};

				const timer = createTimer(trainingTimer);

				expect(timer.frames.length).toBe(12 + 720);

				const trainingFrames = timer.frames.slice(12);
				expect(trainingFrames[0].time).toBe(720);
				expect(trainingFrames[0].remainingTotalTime).toBe(720);
				expect(trainingFrames[719].time).toBe(1);
				expect(trainingFrames[719].remainingTotalTime).toBe(1);
				expect(trainingFrames[719].progress).toBe(1.0);
			});
		});

		describe('frame data integrity', () => {
			it('all frames have required properties with correct types', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer);

				timer.frames.forEach((frame, index) => {
					expect(typeof frame.phase).toBe('string');
					expect(Object.values(TimerPhase)).toContain(frame.phase);

					expect(typeof frame.workoutType).toBe('string');
					expect(Object.values(WorkoutType)).toContain(frame.workoutType);

					expect(typeof frame.time).toBe('number');
					expect(frame.time).toBeGreaterThanOrEqual(0);

					expect(typeof frame.remainingTotalTime).toBe('number');
					expect(frame.remainingTotalTime).toBeGreaterThanOrEqual(0);

					expect(typeof frame.progress).toBe('number');
					expect(frame.progress).toBeGreaterThanOrEqual(0);
					expect(frame.progress).toBeLessThanOrEqual(1);
				});
			});

			it('training frame progress is always between 0 (exclusive) and 1 (inclusive)', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 100 }]
				};

				const timer = createTimer(trainingTimer);
				const trainingFrames = timer.frames.slice(12);

				trainingFrames.forEach(frame => {
					expect(frame.progress).toBeGreaterThan(0);
					expect(frame.progress).toBeLessThanOrEqual(1);
				});

				// Last frame should be exactly 1.0
				expect(trainingFrames[trainingFrames.length - 1].progress).toBe(1.0);
			});
		});

		describe('configuration', () => {
			it('uses default config when none provided', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer);

				// Default: 1 placeholder + 10 countdown + 1 GO + 3 training = 15
				expect(timer.frames.length).toBe(15);
			});

			it('allows custom countdown duration', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer, { countdownDuration: 5 });

				// 1 placeholder + 5 countdown + 1 GO + 3 training = 10
				expect(timer.frames.length).toBe(10);

				const countdownFrames = timer.frames.slice(1, 6);
				expect(countdownFrames.map(f => f.time)).toEqual([5, 4, 3, 2, 1]);
			});

			it('allows zero countdown duration', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer, { countdownDuration: 0 });

				// 1 placeholder + 0 countdown + 1 GO + 3 training = 5
				expect(timer.frames.length).toBe(5);
				expect(timer.frames[0].phase).toBe(TimerPhase.PLACEHOLDER);
				expect(timer.frames[1].phase).toBe(TimerPhase.GO);
			});

			it('allows disabling placeholder frame', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer, { showPlaceholder: false });

				// 0 placeholder + 10 countdown + 1 GO + 3 training = 14
				expect(timer.frames.length).toBe(14);
				expect(timer.frames[0].phase).toBe(TimerPhase.PRE_COUNTDOWN);
			});

			it('allows disabling GO frame', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer, { showGoFrame: false });

				// 1 placeholder + 10 countdown + 0 GO + 3 training = 14
				expect(timer.frames.length).toBe(14);
				expect(timer.frames[10].phase).toBe(TimerPhase.PRE_COUNTDOWN);
				expect(timer.frames[11].phase).toBe(TimerPhase.RUNNING);
			});

			it('allows combining multiple config options', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 3 }]
				};

				const timer = createTimer(trainingTimer, {
					countdownDuration: 3,
					showPlaceholder: false,
					showGoFrame: false
				});

				// 0 placeholder + 3 countdown + 0 GO + 3 training = 6
				expect(timer.frames.length).toBe(6);
				expect(timer.frames[0].phase).toBe(TimerPhase.PRE_COUNTDOWN);
				expect(timer.frames[2].phase).toBe(TimerPhase.PRE_COUNTDOWN);
				expect(timer.frames[3].phase).toBe(TimerPhase.RUNNING);
			});

			it('allows skipping all pre-workout frames', () => {
				const trainingTimer: TrainingTimer = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }]
				};

				const timer = createTimer(trainingTimer, {
					countdownDuration: 0,
					showPlaceholder: false,
					showGoFrame: false
				});

				// Only training frames
				expect(timer.frames.length).toBe(5);
				expect(timer.frames[0].phase).toBe(TimerPhase.RUNNING);
			});
		});

		describe('validation', () => {
			it('throws ZodError when phase has negative duration', () => {
				const invalidInput = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }, { duration: -1 }]
				};

				expect(() => createTimer(invalidInput)).toThrow(ZodError);
			});

			it('throws ZodError with correct path for invalid phase', () => {
				const invalidInput = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }, { duration: 10 }, { duration: -3 }]
				};

				try {
					createTimer(invalidInput);
					fail('Expected ZodError');
				} catch (error) {
					const zodError = error as ZodError;
					expect(zodError.errors[0].path).toEqual(['phases', 2, 'duration']);
				}
			});

			it('throws ZodError when phases is missing', () => {
				const invalidInput = {
					workoutType: WorkoutType.TABATA
				};

				expect(() => createTimer(invalidInput)).toThrow(ZodError);
			});

			it('throws ZodError when workoutType is invalid', () => {
				const invalidInput = {
					workoutType: 'INVALID_TYPE',
					phases: [{ duration: 5 }]
				};

				expect(() => createTimer(invalidInput)).toThrow(ZodError);
			});

			it('throws ZodError when input is null', () => {
				expect(() => createTimer(null)).toThrow(ZodError);
			});

			it('throws ZodError when input is undefined', () => {
				expect(() => createTimer(undefined)).toThrow(ZodError);
			});

			it('accepts valid input without throwing', () => {
				const validInput = {
					workoutType: WorkoutType.TABATA,
					phases: [{ duration: 5 }, { duration: 0 }, { duration: 10 }]
				};

				expect(() => createTimer(validInput)).not.toThrow();
			});
		});
	});
});
