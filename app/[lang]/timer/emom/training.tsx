import { Text, View } from 'react-native';

import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';

import { useEmom } from 'modules/emom/infra/emomRepository';

const EmomTrainingPage = () => {
	const { emom } = useEmom();

	return (
		<ScreenScrollView className="flex" contentContainerClassName="flex-1">
			<View>
				<Text>
					Time: {emom.time} seconds - Rounds: {emom.rounds}
				</Text>
			</View>
		</ScreenScrollView>
	);
};

export default EmomTrainingPage;
