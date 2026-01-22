import { useEffect } from 'react';

import { GeistMono_100Thin } from '@expo-google-fonts/geist-mono/100Thin';
import { GeistMono_200ExtraLight } from '@expo-google-fonts/geist-mono/200ExtraLight';
import { GeistMono_300Light } from '@expo-google-fonts/geist-mono/300Light';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono/600SemiBold';
import { GeistMono_700Bold } from '@expo-google-fonts/geist-mono/700Bold';
import { GeistMono_800ExtraBold } from '@expo-google-fonts/geist-mono/800ExtraBold';
import { GeistMono_900Black } from '@expo-google-fonts/geist-mono/900Black';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_400Regular_Italic } from '@expo-google-fonts/instrument-sans/400Regular_Italic';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_500Medium_Italic } from '@expo-google-fonts/instrument-sans/500Medium_Italic';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_600SemiBold_Italic } from '@expo-google-fonts/instrument-sans/600SemiBold_Italic';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { InstrumentSans_700Bold_Italic } from '@expo-google-fonts/instrument-sans/700Bold_Italic';
import { useFonts } from '@expo-google-fonts/instrument-sans/useFonts';
import { SplashScreen } from 'expo-router';

export const useFont = () => {
	const [loaded, error] = useFonts({
		InstrumentSans_400Regular,
		InstrumentSans_500Medium,
		InstrumentSans_600SemiBold,
		InstrumentSans_700Bold,
		InstrumentSans_400Regular_Italic,
		InstrumentSans_500Medium_Italic,
		InstrumentSans_600SemiBold_Italic,
		InstrumentSans_700Bold_Italic,
		// Mono
		GeistMono_100Thin,
		GeistMono_200ExtraLight,
		GeistMono_300Light,
		GeistMono_400Regular,
		GeistMono_500Medium,
		GeistMono_600SemiBold,
		GeistMono_700Bold,
		GeistMono_800ExtraBold,
		GeistMono_900Black
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
