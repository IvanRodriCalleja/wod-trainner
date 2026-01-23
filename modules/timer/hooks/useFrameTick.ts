import { useRef } from 'react';

import { scheduleOnRN } from 'react-native-worklets';

import { useFrameCallbackWithSelfRef } from './useFrameCallbackWithSelfRef';

export type UseFrameTickOptions = {
	maxTicks: number;
	startAtIndex?: number;
	onTick: (tickIndex: number) => void;
	onComplete?: () => void;
};

/**
 * Calls onTick every second while running.
 * On start/resume: calls onTick immediately, then every second.
 * Stops automatically when maxTicks is reached.
 */
export const useFrameTick = ({
	maxTicks,
	startAtIndex,
	onTick,
	onComplete
}: UseFrameTickOptions) => {
	const lastTickTimeRef = useRef<number | null>(null);
	const tickIndexRef = useRef(startAtIndex ?? 0);

	const frameCallback = useFrameCallbackWithSelfRef((frameInfo, controller) => {
		// Stop when we've exhausted all ticks
		if (tickIndexRef.current >= maxTicks) {
			controller.setActive(false);
			if (onComplete) scheduleOnRN(onComplete);
			return;
		}

		// First frame ever - tick immediately
		if (lastTickTimeRef.current === null) {
			lastTickTimeRef.current = frameInfo.timestamp;
			scheduleOnRN(onTick, tickIndexRef.current);
			tickIndexRef.current++;
			return;
		}

		// Tick every 1000ms (also handles resume - time gap will be >= 1000)
		if (frameInfo.timestamp - lastTickTimeRef.current >= 1000) {
			lastTickTimeRef.current = frameInfo.timestamp;
			scheduleOnRN(onTick, tickIndexRef.current);
			tickIndexRef.current++;
		}
	}, false);

	return {
		start: () => frameCallback.setActive(true),
		stop: () => frameCallback.setActive(false),
		toggle: () => frameCallback.setActive(!frameCallback.isActive),
		reset: () => {
			tickIndexRef.current = 0;
			lastTickTimeRef.current = null;
		}
	};
};
