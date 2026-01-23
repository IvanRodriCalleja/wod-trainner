import { View } from 'react-native';

import { Span } from '@wod-trainer/strict-dom';

import { TimerFrame } from 'modules/timer/domain/TimerFrame';
import { formatTime } from 'modules/timer/domain/TimerTime';

import { bgToTextColor } from '../../../domain/timerUtils';

type TimerCountdownDisplayProps = {
	colorClassName: string;
	frame: TimerFrame;
};

export const TimerCountdownDisplay = ({ colorClassName, frame }: TimerCountdownDisplayProps) => {
	const textColorClass = bgToTextColor(colorClassName); // TODO: Review
	const formattedTime = formatTime(frame.time);

	return (
		<View className="absolute inset-0 flex items-center justify-center">
			<Span className={`text-center text-7xl font-bold tabular-nums ${textColorClass}`}>
				{formattedTime}
			</Span>
		</View>
	);
};
