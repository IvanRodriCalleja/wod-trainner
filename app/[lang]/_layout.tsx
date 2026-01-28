import { useCallback } from 'react';
import { Platform, View } from 'react-native';

import Logo from 'assets/images/arm-muscle.png';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { useAppTheme } from '@wod-trainer/design-system/providers';
import LiquidMetal, {
	createSilverLightMetal,
	createSilverMetal
} from '@wod-trainer/design-system/ui/LiquidMetal';
import { ThemeToggle } from '@wod-trainer/design-system/ui/theme-toggle';
import { Span } from '@wod-trainer/strict-dom';

const LangLayout = () => {
	const { isDark } = useAppTheme();
	const [themeColorForeground, themeColorBackground] = useThemeColor(['foreground', 'background']);

	const _renderTitle = () => {
		return (
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<LiquidMetal
					width={24}
					image={Logo}
					{...(isDark ? createSilverLightMetal() : createSilverMetal())}
					shape={undefined}
					repetition={2}
					softness={0.1}
					shiftRed={1}
					shiftBlue={1}
					distortion={0.07}
					contour={0.4}
					angle={70}
					speed={1}
					scale={1}
					fit="contain"
				/>
				<Span className="font-mono-bold text-lg text-black dark:text-white">WODLY</Span>
			</View>
		);
	};

	const _renderThemeToggle = useCallback(() => <ThemeToggle />, []);

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
				headerRight: _renderThemeToggle,
				headerBackButtonDisplayMode: 'generic',
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
				contentStyle: {
					backgroundColor: themeColorBackground
				}
			}}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: _renderTitle
				}}
			/>
		</Stack>
	);
};

export default LangLayout;
