import { type FC } from 'react';
import { Pressable, View } from 'react-native';

import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Card, cn } from 'heroui-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { useAppTheme } from '@wod-trainer/design-system/providers';
import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';
import { AppText } from '@wod-trainer/design-system/ui/text';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StyledFeather = withUniwind(Feather);

type TrainingTypeOption = {
	type: WorkoutType;
	label: string;
	href: string;
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
		href: '/timer/emom',
		description: 'Every Minute On the Minute',
		icon: 'bar-chart-2',
		gradientLight: 'bg-gradient-to-br from-transparent via-indigo-400/10 to-blue-500/20',
		gradientDark: 'bg-gradient-to-br from-blue-950/50 via-indigo-900/40 to-cyan-800/30',
		count: 10
	},
	{
		type: WorkoutType.FORTIME,
		label: 'For Time',
		href: '/timer/for-time',
		description: 'Complete as fast as possible',
		icon: 'zap',
		gradientLight: 'bg-gradient-to-br from-transparent via-purple-400/15 to-fuchsia-400/25',
		gradientDark: 'bg-gradient-to-br from-violet-950/60 via-purple-900/50 to-fuchsia-800/40',
		count: 5
	},
	{
		type: WorkoutType.AMRAP,
		label: 'AMRAP',
		href: '/timer/amrap',
		description: 'As Many Reps As Possible',
		icon: 'refresh-cw',
		gradientLight: 'bg-gradient-to-br from-transparent via-teal-400/10 to-emerald-400/20',
		gradientDark: 'bg-gradient-to-br from-emerald-950/50 via-teal-900/40 to-cyan-800/30',
		count: 8
	},
	{
		type: WorkoutType.TABATA,
		label: 'Tabata',
		href: '/timer/tabata',
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
	href,
	gradientLight,
	gradientDark,
	index
}) => {
	const router = useRouter();

	const { isDark } = useAppTheme();

	return (
		<AnimatedPressable
			entering={FadeInDown.duration(300)
				.delay(index * 75)
				.easing(Easing.out(Easing.ease))}
			//TODO: Concatenate language
			onPress={() => router.push(`/es${href}`)}>
			<Card className={cn('overflow-hidden border border-zinc-200 p-0 dark:border-zinc-900')}>
				<View className={cn('absolute inset-0', isDark ? gradientDark : gradientLight)} />
				<View className="flex-row items-center gap-4 px-4 py-5">
					<View className="dark:bg-background/25 size-12 items-center justify-center rounded-full bg-black/3">
						<StyledFeather name={icon} size={22} className="text-foreground/85" />
					</View>
					<View className="flex-1 gap-0.5">
						<Card.Title className="text-foreground/85 text-lg">{label}</Card.Title>
						<Card.Description className="text-foreground/55 text-xs">
							{description}
						</Card.Description>
					</View>
					<View className="dark:bg-background/25 size-8 items-center justify-center rounded-full bg-black/3">
						<StyledFeather name="chevron-right" size={18} className="text-foreground/70" />
					</View>
				</View>
			</Card>
		</AnimatedPressable>
	);
};

export default function App() {
	return (
		<ScreenScrollView>
			<View className="my-4 items-center justify-center">
				<AppText className="text-muted text-base">Select a timer mode to get started</AppText>
			</View>
			<View className="gap-3">
				{trainingTypes.map((trainingType, index) => (
					<HomeCard key={trainingType.label} {...trainingType} index={index} />
				))}
			</View>
		</ScreenScrollView>
	);
}
