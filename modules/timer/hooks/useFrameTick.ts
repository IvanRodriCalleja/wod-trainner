import { useRef } from 'react';

import { runOnJS, useFrameCallback } from 'react-native-reanimated';

export type UseFrameTickOptions = {
	onTick: (tickIndex: number) => void;
	isRunning: boolean;
};

/**
 * Calls onTick every second while running.
 * On start/resume: calls onTick immediately, then every second.
 */
export const useFrameTick = ({ onTick, isRunning }: UseFrameTickOptions) => {
	const lastTickTimeRef = useRef<number | null>(null);
	const tickIndexRef = useRef(0);

	useFrameCallback(frameInfo => {
		// First frame ever - tick immediately
		if (lastTickTimeRef.current === null) {
			lastTickTimeRef.current = frameInfo.timestamp;
			runOnJS(onTick)(tickIndexRef.current);
			tickIndexRef.current++;
			return;
		}

		// Tick every 1000ms (also handles resume - time gap will be >= 1000)
		if (frameInfo.timestamp - lastTickTimeRef.current >= 1000) {
			lastTickTimeRef.current = frameInfo.timestamp;
			runOnJS(onTick)(tickIndexRef.current);
			tickIndexRef.current++;
		}
	}, isRunning);
};
