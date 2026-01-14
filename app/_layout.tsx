import { Slot, Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useLocales } from '@wod-trainer/internationalization/infra';
import { I18nProvider } from '@wod-trainer/internationalization/ui/I18nProvider';

import './global.css';

const RootLayout = () => {
	const { lang, locales } = useLocales();

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<HeroUINativeProvider>
				<I18nProvider currentLanguage={lang} locales={locales}>
					<Stack>
						<Slot />
					</Stack>
				</I18nProvider>
			</HeroUINativeProvider>
		</GestureHandlerRootView>
	);
};

export default RootLayout;
