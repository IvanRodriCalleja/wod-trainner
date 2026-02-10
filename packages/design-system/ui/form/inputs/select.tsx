import { PropsWithChildren, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Feather from '@expo/vector-icons/Feather';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import {
	ScrollShadow,
	SelectOverlayProps,
	Select as SelectPrimitive,
	SelectRootProps,
	SelectValueProps,
	cn,
	useSelect,
	useThemeColor
} from 'heroui-native';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { type VariantProps, tv } from 'tailwind-variants';
import { withUniwind } from 'uniwind';

import { Option } from '../../../domain/Option';
import { AppText } from '../../text';

const Root = ({ children, ...props }: PropsWithChildren<SelectRootProps>) => {
	return (
		<SelectPrimitive className={cn('w-full', props.className)} {...props}>
			{children}
		</SelectPrimitive>
	);
};

const Overlay = ({ children, ...props }: PropsWithChildren<SelectOverlayProps>) => {
	return (
		<SelectPrimitive.Overlay className="bg-foreground/20 dark:bg-black/70" {...props}>
			{children}
		</SelectPrimitive.Overlay>
	);
};

const StyledFeather = withUniwind(Feather);
const StyleAnimatedView = withUniwind(Animated.View);

const selectTriggerVariants = tv({
	slots: {
		container: 'bg-surface w-full justify-center shadow-md shadow-black/5',
		border: 'border-accent pointer-events-none absolute -inset-1 border-[2.5px]',
		icon: 'absolute',
		text: 'text-foreground'
	},
	variants: {
		size: {
			sm: {
				container: 'h-9 px-3 rounded-lg',
				border: 'rounded-xl',
				icon: 'right-3',
				text: 'text-sm'
			},
			md: {
				container: 'h-12 px-4 rounded-lg',
				border: 'rounded-xl',
				icon: 'right-4',
				text: 'text-base'
			},
			lg: {
				container: 'h-14 px-5 rounded-lg',
				border: 'rounded-xl',
				icon: 'right-5',
				text: 'text-base'
			}
		}
	},
	defaultVariants: {
		size: 'md'
	}
});

const iconSizeMap = { sm: 14, md: 16, lg: 18, xl: 20 } as const;

export type SelectSize = VariantProps<typeof selectTriggerVariants>['size'];

type AnimatedTriggerProps = {
	placeholder: string;
	options: Option[];
	size?: SelectSize;
};

const AnimatedTrigger = ({ placeholder, options, size = 'md' }: AnimatedTriggerProps) => {
	const { isOpen } = useSelect();
	const animatedValue = useSharedValue(isOpen ? 1 : 0);
	const { container, border, icon, text } = selectTriggerVariants({ size });

	useEffect(() => {
		animatedValue.value = withTiming(isOpen ? 1 : 0, {
			duration: 200,
			easing: Easing.out(Easing.ease)
		});
	}, [isOpen, animatedValue]);

	const rContainerStyle = useAnimatedStyle(() => {
		const opacity = interpolate(animatedValue.value, [0, 1], [0, 1]);
		return {
			opacity
		};
	});

	const rChevronStyle = useAnimatedStyle(() => {
		const rotate = interpolate(animatedValue.value, [0, 1], [0, -180]);
		return {
			transform: [{ rotate: `${rotate}deg` }]
		};
	});

	return (
		<View className={container()} style={styles.borderCurve}>
			<StyleAnimatedView style={[rContainerStyle, styles.borderCurve]} className={border()} />
			<Value placeholder={placeholder} options={options} className={text()} />
			<StyleAnimatedView style={rChevronStyle} className={icon()}>
				<StyledFeather name="chevron-down" size={iconSizeMap[size!]} className="text-muted" />
			</StyleAnimatedView>
		</View>
	);
};

type ValueProps = SelectValueProps & { options: Option[]; className?: string };

const Value = ({ placeholder, options, className }: ValueProps) => {
	const { value } = useSelect();

	const resolvedValue = value instanceof Object ? value.value : value;

	const displayValue = options.find(option => option.value === resolvedValue)?.label;
	return <AppText className={className}>{displayValue ?? placeholder}</AppText>;
};

const SheetRoot = ({
	children,
	...props
}: PropsWithChildren<Omit<SelectRootProps, 'presentation'>>) => (
	<Root presentation="bottom-sheet" {...props}>
		{children}
	</Root>
);

const SheetContent = ({ children }: PropsWithChildren) => (
	<SelectPrimitive.Content
		presentation="bottom-sheet"
		snapPoints={['35%']}
		detached
		enableDynamicSizing={false}
		enableOverDrag={false}
		handleClassName="h-1"
		handleIndicatorClassName="w-12 h-[3px]"
		contentContainerClassName="h-full pt-1 pb-1 mx-2.5 rounded-t-[36px] bg-overlay overflow-hidden">
		{children}
	</SelectPrimitive.Content>
);

const SheetScrollView = ({ children }: PropsWithChildren) => {
	const themeColorOverlay = useThemeColor('overlay');

	return (
		<ScrollShadow LinearGradientComponent={LinearGradient} color={themeColorOverlay}>
			<BottomSheetScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
				{children}
			</BottomSheetScrollView>
		</ScrollShadow>
	);
};

const styles = StyleSheet.create({
	borderCurve: {
		borderCurve: 'continuous'
	}
});

export const Select = {
	...SelectPrimitive,
	Root,
	Overlay,
	AnimatedTrigger,
	Value,
	SheetRoot,
	SheetContent,
	SheetScrollView
};
