// Time in seconds
export type TimerTime = number;

export function formatTime(timer: TimerTime): string {
	const minutes = Math.floor(timer / 60);
	const seconds = timer % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
