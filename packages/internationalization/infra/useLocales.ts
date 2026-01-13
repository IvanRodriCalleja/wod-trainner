import { useLocalSearchParams } from 'expo-router';

import { Language } from '../domain/Language';
import { getLocales } from './getLocales';

export const useLocales = () => {
	// TODO: Use lang from user preferences

	const { lang = Language.EN } = useLocalSearchParams<{ lang: Language }>();

	return { locales: getLocales(lang as Language), lang };
};
