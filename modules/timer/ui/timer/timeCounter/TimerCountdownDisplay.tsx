import { View } from 'react-native';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { formatTime } from 'modules/timer/domain/TimerTime';

type TimerCountdownDisplayProps = {
	textColorClassName: string;
	frame: TimerFrame;
};

export const TimerCountdownDisplay = ({
	textColorClassName,
	frame
}: TimerCountdownDisplayProps) => {
	const formattedTime = formatTime(frame.time);

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Span className={`text-center text-7xl font-bold tabular-nums ${textColorClassName}`}>
				{formattedTime}
			</Span>
		</View>
	);
};
