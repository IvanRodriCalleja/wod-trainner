import { useEffect } from 'react';

import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	useFonts
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';

export const useFont = () => {
	const [loaded, error] = useFonts({
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	return {
		loaded,
		error
	};
};
