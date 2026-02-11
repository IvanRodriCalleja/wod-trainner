import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';

import { compileEmomTimer } from 'modules/emom/domain/emom';
import { useEmom } from 'modules/emom/infra/emomRepository';
import { Timer } from 'modules/timer/ui/Timer';

const EmomTrainingPage = () => {
	const { emom } = useEmom();
	const frames = useMemo(() => compileEmomTimer(emom), [emom]);

	return (
		<ScreenScrollView className="flex" contentContainerClassName="flex-1">
			<View>
				<Text>
					Time: {emom.time} seconds - Rounds: {emom.rounds}
				</Text>
			</View>

			<Timer
				initialFrame={frames[0]}
				maxFrames={frames.length}
				onNextFrame={index => frames[index + 1]}
			/>
		</ScreenScrollView>
	);
};

export default EmomTrainingPage;
