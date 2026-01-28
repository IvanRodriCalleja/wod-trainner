import { type FC } from 'react';
import { Platform, Pressable } from 'react-native';

import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { cn } from 'heroui-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { useAppTheme } from '../providers';

const StyledIonicons = withUniwind(Ionicons);

export const ThemeToggle: FC = () => {
	const { toggleTheme } = useAppTheme();

	const isLGAvailable = isLiquidGlassAvailable();

	return (
		<Pressable
			onPress={() => {
				if (Platform.OS === 'ios') {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				}
				toggleTheme();
			}}
			className={cn('p-3', isLGAvailable && 'px-2.5 py-2')}>
			<Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
				<StyledIonicons name="moon" size={20} className="text-black dark:text-white" />
			</Animated.View>
		</Pressable>
	);
};
