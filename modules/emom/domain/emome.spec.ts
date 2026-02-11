import { compileEmomTimer } from './emom';

describe('EMOM', () => {
	it('should compile a timer for an EMOM workout', () => {
		const emom = { time: 10, rounds: 10 };
		const timer = compileEmomTimer(emom);
		console.log({ timer });
		expect(timer.length).toBe(112);
	});
});
