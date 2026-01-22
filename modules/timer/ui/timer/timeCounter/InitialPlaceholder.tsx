import { View } from 'react-native';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { formatTime } from 'modules/timer/domain/TimerTime';

type PreCountdownDisplayProps = {
	frame: TimerFrame;
};

export const InitialPlaceholder = ({ frame }: PreCountdownDisplayProps) => {
	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Span className={`font-mono-black text-center text-8xl text-neutral-500`}>
				{formatTime(frame.time)}
			</Span>
		</View>
	);
};
