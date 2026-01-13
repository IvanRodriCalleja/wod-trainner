import { Language } from '../domain/Language';
import { locales } from './locales';

// TODO: Validate lang
// TODO: Load eficiently for web
export const getLocales = (lang = Language.EN) => locales[lang] || locales[Language.EN];
