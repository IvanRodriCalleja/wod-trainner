/**
 * Formats milliseconds into MM:SS string format
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "05:30")
 */
export function formatTime(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates progress percentage from remaining and total time
 * @param remainingMs - Remaining time in milliseconds
 * @param totalMs - Total time in milliseconds
 * @returns Progress value between 0 and 1
 */
export function calculateProgress(remainingMs: number, totalMs: number): number {
	if (totalMs <= 0) return 0;
	const elapsed = totalMs - remainingMs;
	return Math.max(0, Math.min(1, elapsed / totalMs));
}

/**
 * Converts a Tailwind background color class to text color class
 * @param bgClassName - Background color class (e.g., "bg-amber-400")
 * @returns Text color class (e.g., "text-amber-400")
 */
export function bgToTextColor(bgClassName: string): string {
	return bgClassName.replace(/^bg-/, 'text-');
}
