import { View } from 'react-native';

import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';
import { AppText } from '@wod-trainer/design-system/ui/text';
import { Span } from '@wod-trainer/strict-dom';

const EmomPage = () => (
	<ScreenScrollView>
		<View className="my-4 items-center justify-center">
			<AppText className="text-muted text-base">Select a timer mode to get started</AppText>
		</View>
		<View className="gap-3">
			<Span className="text-muted text-base">EMOM</Span>
		</View>
	</ScreenScrollView>
);

export default EmomPage;
