'use client';
import { PropsWithChildren, createContext, use, useCallback, useMemo } from 'react';

import { Uniwind, useUniwind } from 'uniwind';

import { useFont } from '../hooks/useFont';

type ThemeName = 'light' | 'dark';

interface AppThemeContextType {
	currentTheme: string;
	isLight: boolean;
	isDark: boolean;
	setTheme: (theme: ThemeName) => void;
	toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
	const { theme } = useUniwind();

	const isLight = useMemo(() => {
		return theme === 'light' || theme.endsWith('-light');
	}, [theme]);

	const isDark = useMemo(() => {
		return theme === 'dark' || theme.endsWith('-dark');
	}, [theme]);

	const setTheme = useCallback((newTheme: ThemeName) => {
		Uniwind.setTheme(newTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		Uniwind.setTheme(theme === 'light' ? 'dark' : 'light');
	}, [theme]);

	const value = useMemo(
		() => ({
			currentTheme: theme,
			isLight,
			isDark,
			setTheme,
			toggleTheme
		}),
		[theme, isLight, isDark, setTheme, toggleTheme]
	);

	const { loaded, error } = useFont();

	if (!loaded && !error) {
		return null;
	}

	return <AppThemeContext value={value}>{children}</AppThemeContext>;
};

export const useAppTheme = () => {
	const context = use(AppThemeContext);
	if (!context) {
		throw new Error('useAppTheme must be used within AppThemeProvider');
	}
	return context;
};
