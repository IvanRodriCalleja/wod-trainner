import { Platform } from 'react-native';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { useAppTheme } from '@wod-trainer/design-system/providers';
import { ThemeToggle } from '@wod-trainer/design-system/ui/theme-toggle';

import { EmomProvider } from 'modules/emom/infra/emomRepository';

const EmomLayout = () => {
	const { isDark } = useAppTheme();
	const [themeColorForeground, themeColorBackground] = useThemeColor(['foreground', 'background']);

	return (
		<EmomProvider>
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
						headerTitle: 'EMOM',
						headerBackVisible: true
					}}
				/>
				<Stack.Screen name="training" options={{ headerTitle: 'EMOM Training' }} />
			</Stack>
		</EmomProvider>
	);
};

export default EmomLayout;
