import { Language } from '../../domain/Language';
import { Locales } from '../../domain/Locales';
import en from './en';
import es from './es';

export const locales: { [key in Language]: Locales } = {
	en,
	es
};
