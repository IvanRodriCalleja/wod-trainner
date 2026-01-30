import React, { FC, PropsWithChildren } from 'react';
import {
	Pressable,
	Text as RNText,
	type TextProps as RNTextProps,
	ScrollView,
	ScrollViewProps,
	View
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Card, Chip, cn } from 'heroui-native';
import Animated, { AnimatedProps, Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { useAppTheme } from '@wod-trainer/design-system/providers';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StyledFeather = withUniwind(Feather);

type TrainingTypeOption = {
	type: WorkoutType;
	label: string;
	description: string;
	icon: keyof typeof Feather.glyphMap;
	gradientLight: string;
	gradientDark: string;
	count: number;
};

const trainingTypes: TrainingTypeOption[] = [
	{
		type: WorkoutType.EMOM,
		label: 'EMOM',
		description: 'Every Minute On the Minute',
		icon: 'bar-chart-2',
		gradientLight: 'bg-gradient-to-br from-transparent via-indigo-400/10 to-blue-500/20',
		gradientDark: 'bg-gradient-to-br from-blue-950/50 via-indigo-900/40 to-cyan-800/30',
		count: 10
	},
	{
		type: WorkoutType.FORTIME,
		label: 'For Time',
		description: 'Complete as fast as possible',
		icon: 'zap',
		gradientLight: 'bg-gradient-to-br from-transparent via-purple-400/15 to-fuchsia-400/25',
		gradientDark: 'bg-gradient-to-br from-violet-950/60 via-purple-900/50 to-fuchsia-800/40',
		count: 5
	},
	{
		type: WorkoutType.AMRAP,
		label: 'AMRAP',
		description: 'As Many Reps As Possible',
		icon: 'refresh-cw',
		gradientLight: 'bg-gradient-to-br from-transparent via-teal-400/10 to-emerald-400/20',
		gradientDark: 'bg-gradient-to-br from-emerald-950/50 via-teal-900/40 to-cyan-800/30',
		count: 8
	},
	{
		type: WorkoutType.TABATA,
		label: 'Tabata',
		description: '20s work / 10s rest intervals',
		icon: 'layers',
		gradientLight: 'bg-gradient-to-br from-transparent via-rose-400/10 to-pink-400/20',
		gradientDark: 'bg-gradient-to-br from-rose-950/50 via-pink-900/40 to-red-800/30',
		count: 3
	}
];

const HomeCard: FC<TrainingTypeOption & { index: number }> = ({
	description,
	icon,
	label,
	type,
	gradientLight,
	gradientDark,
	index,
	count
}) => {
	const router = useRouter();

	const { isDark } = useAppTheme();

	return (
		<AnimatedPressable
			entering={FadeInDown.duration(300)
				.delay(index * 100)
				.easing(Easing.out(Easing.ease))}
			onPress={() => router.push(`/${type.toLowerCase()}`)}>
			<Card
				className={cn(
					'overflow-hidden border border-zinc-200 p-0',
					isDark && 'border-zinc-900'
				)}>
				<View
					className={cn(
						'absolute inset-0',
						isDark ? gradientDark : gradientLight
					)}
				/>
				<View className="gap-4">
					<Card.Header className="p-3">
						<Chip size="sm" className="bg-background/25">
							<StyledFeather name={icon} size={14} className="text-foreground/85" />
							<Chip.Label className="text-foreground/85">{count} saved</Chip.Label>
						</Chip>
					</Card.Header>
					<Card.Body className="h-16" />
					<Card.Footer className="flex-row items-end gap-4 px-3 pb-3">
						<View className="flex-1">
							<Card.Title className="text-foreground/85 text-2xl">{label}</Card.Title>
							<Card.Description className="text-foreground/65 pl-0.5">
								{description}
							</Card.Description>
						</View>
						<View className="bg-background/25 size-9 items-center justify-center rounded-full">
							<StyledFeather name="arrow-up-right" size={20} className="text-foreground" />
						</View>
					</Card.Footer>
				</View>
			</Card>
		</AnimatedPressable>
	);
};

export default function App() {
	const { isDark } = useAppTheme();

	return (
		<ScreenScrollView>
			<View className="my-4 items-center justify-center">
				<AppText className="text-muted text-base">v1.0.0-beta.12</AppText>
			</View>
			<View className="gap-6">
				{trainingTypes.map((trainingType, index) => (
					<HomeCard key={trainingType.label} {...trainingType} index={index} />
				))}
			</View>
			<StatusBar style={isDark ? 'light' : 'dark'} />
		</ScreenScrollView>
	);
}

export const AppText = React.forwardRef<RNText, RNTextProps>((props, ref) => {
	const { className, ...restProps } = props;

	return <RNText ref={ref} className={cn('font-normal', className)} {...restProps} />;
});

AppText.displayName = 'AppText';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface Props extends AnimatedProps<ScrollViewProps> {
	className?: string;
	contentContainerClassName?: string;
}

export const ScreenScrollView: FC<PropsWithChildren<Props>> = ({
	children,
	className,
	contentContainerClassName,
	...props
}) => {
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight();
	return (
		<AnimatedScrollView
			className={cn('bg-background', className)}
			contentContainerClassName={cn('px-5', contentContainerClassName)}
			contentContainerStyle={{
				paddingTop: headerHeight,
				paddingBottom: insets.bottom + 32
			}}
			showsVerticalScrollIndicator={false}
			{...props}>
			{children}
		</AnimatedScrollView>
	);
};
