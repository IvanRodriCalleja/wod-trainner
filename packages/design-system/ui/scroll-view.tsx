import { type FC, type PropsWithChildren } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

import { useHeaderHeight } from '@react-navigation/elements';
import { cn } from 'heroui-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface ScreenScrollViewProps extends AnimatedProps<ScrollViewProps> {
	className?: string;
	contentContainerClassName?: string;
}

export const ScreenScrollView: FC<PropsWithChildren<ScreenScrollViewProps>> = ({
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
