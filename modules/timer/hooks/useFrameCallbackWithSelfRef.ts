import { useRef } from 'react';

import { useFrameCallback } from 'react-native-reanimated';

type FrameInfo = { timestamp: number };
type FrameCallbackController = ReturnType<typeof useFrameCallback>;

/**
 * Wrapper around useFrameCallback that allows the callback to reference
 * its own controller (e.g., to call setActive from within the callback).
 *
 * The callback receives the controller as a second argument instead of
 * relying on closure capture of the return value.
 */
export function useFrameCallbackWithSelfRef(
	callback: (frameInfo: FrameInfo, controller: FrameCallbackController) => void,
	autostart: boolean
): FrameCallbackController {
	const controllerRef = useRef<FrameCallbackController | null>(null);

	const frameCallback = useFrameCallback(frameInfo => {
		if (controllerRef.current) {
			callback(frameInfo, controllerRef.current);
		}
	}, autostart);

	controllerRef.current = frameCallback;

	return frameCallback;
}
