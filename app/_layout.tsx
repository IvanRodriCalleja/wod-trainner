import { Slot } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import { Uniwind } from 'uniwind';

import { AppThemeProvider } from '@wod-trainer/design-system/providers';
import { useLocales } from '@wod-trainer/internationalization/infra';
import { I18nProvider } from '@wod-trainer/internationalization/ui/I18nProvider';

import '../global.css';

Uniwind.setTheme('system');

const contentWrapper = (children: React.ReactNode) => (
	<KeyboardAvoidingView
		pointerEvents="box-none"
		behavior="padding"
		keyboardVerticalOffset={12}
		className="flex-1">
		{children}
	</KeyboardAvoidingView>
);

const RootLayout = () => {
	const { lang, locales } = useLocales();

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AppThemeProvider>
				<KeyboardProvider>
					<HeroUINativeProvider
						config={{ toast: { contentWrapper }, devInfo: { stylingPrinciples: false } }}>
						<I18nProvider currentLanguage={lang} locales={locales}>
							<Slot />
						</I18nProvider>
					</HeroUINativeProvider>
				</KeyboardProvider>
			</AppThemeProvider>
		</GestureHandlerRootView>
	);
};

export default RootLayout;
