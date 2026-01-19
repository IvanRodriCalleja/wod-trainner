// Time in seconds
export type TimerTime = number;

// TODDO: Review output
export const formatTimerTime = (time: TimerTime): string => {
	return time.toString().padStart(2, '0');
};
