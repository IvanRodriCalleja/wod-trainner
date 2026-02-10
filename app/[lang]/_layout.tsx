import { Platform } from 'react-native';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { useAppTheme } from '@wod-trainer/design-system/providers';
import { ThemeToggle } from '@wod-trainer/design-system/ui/theme-toggle';

const LangLayout = () => {
	const { isDark } = useAppTheme();
	const [themeColorForeground, themeColorBackground] = useThemeColor(['foreground', 'background']);

	return (
		<Stack
			screenOptions={{
				headerTitleAlign: 'center',
				headerTransparent: true,
				headerBlurEffect: isDark ? 'dark' : 'light',
				headerTintColor: themeColorForeground,
				headerStyle: {
					backgroundColor: Platform.select({
						ios: undefined,
						android: themeColorBackground
					})
				},
				headerTitleStyle: {
					fontFamily: 'Inter_600SemiBold'
				},
				headerRight: ThemeToggle,
				headerBackButtonDisplayMode: 'generic',
				gestureEnabled: true,
				animation: 'slide_from_right',
				gestureDirection: 'horizontal',
				fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
				contentStyle: {
					backgroundColor: themeColorBackground
				}
			}}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: 'Timer'
				}}
			/>
			<Stack.Screen
				name="timer/emom"
				options={{
					headerShown: false
				}}
			/>
		</Stack>
	);
};

export default LangLayout;
