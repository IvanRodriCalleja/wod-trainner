import { Slot, Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Uniwind } from 'uniwind';

import { AppThemeProvider } from '@wod-trainer/design-system/providers';
import { useLocales } from '@wod-trainer/internationalization/infra';
import { I18nProvider } from '@wod-trainer/internationalization/ui/I18nProvider';

import '../global.css';

Uniwind.setTheme('dark');

const RootLayout = () => {
	const { lang, locales } = useLocales();

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
				<I18nProvider currentLanguage={lang} locales={locales}>
					<AppThemeProvider>
						<Slot />
					</AppThemeProvider>
				</I18nProvider>
			</HeroUINativeProvider>
		</GestureHandlerRootView>
	);
};

export default RootLayout;
