import { formatTime } from './TimerTime';

describe('TimerTime', () => {
	describe('formatTime', () => {
		it('formats zero seconds as 00:00', () => {
			expect(formatTime(0)).toBe('00:00');
		});

		it('formats seconds less than 10 with leading zero', () => {
			expect(formatTime(5)).toBe('00:05');
			expect(formatTime(9)).toBe('00:09');
		});

		it('formats seconds between 10 and 59', () => {
			expect(formatTime(10)).toBe('00:10');
			expect(formatTime(30)).toBe('00:30');
			expect(formatTime(59)).toBe('00:59');
		});

		it('formats exact minutes', () => {
			expect(formatTime(60)).toBe('01:00');
			expect(formatTime(120)).toBe('02:00');
			expect(formatTime(600)).toBe('10:00');
		});

		it('formats minutes and seconds combined', () => {
			expect(formatTime(61)).toBe('01:01');
			expect(formatTime(90)).toBe('01:30');
			expect(formatTime(125)).toBe('02:05');
			expect(formatTime(754)).toBe('12:34');
		});

		it('formats large values (over an hour)', () => {
			expect(formatTime(3600)).toBe('60:00');
			expect(formatTime(3661)).toBe('61:01');
			expect(formatTime(5999)).toBe('99:59');
			expect(formatTime(6000)).toBe('100:00');
		});

		it('handles typical workout durations', () => {
			// TABATA: 20 seconds work
			expect(formatTime(20)).toBe('00:20');

			// EMOM: 1 minute
			expect(formatTime(60)).toBe('01:00');

			// AMRAP: 12 minutes
			expect(formatTime(720)).toBe('12:00');

			// Long workout: 45 minutes
			expect(formatTime(2700)).toBe('45:00');
		});
	});
});
