import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { useLocales } from '@wod-trainer/internationalization/infra';
import { I18nProvider } from '@wod-trainer/internationalization/ui/I18nProvider';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
	const { lang, locales } = useLocales();

	return (
		<I18nProvider currentLanguage={lang} locales={locales}>
			<Stack>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			</Stack>
		</I18nProvider>
	);
};

export default RootLayout;
