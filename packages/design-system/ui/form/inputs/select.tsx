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

type AnimatedTriggerProps = {
	placeholder: string;
	options: Option[];
};

const AnimatedTrigger = ({ placeholder, options }: AnimatedTriggerProps) => {
	const { isOpen } = useSelect();
	const animatedValue = useSharedValue(isOpen ? 1 : 0);

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
		<View
			className="bg-surface h-[64px] w-full justify-center rounded-xl px-6 shadow-md shadow-black/5"
			style={styles.borderCurve}>
			<StyleAnimatedView
				style={[rContainerStyle, styles.borderCurve]}
				className="border-accent pointer-events-none absolute -inset-1 rounded-2xl border-[2.5px]"
			/>
			<Value placeholder={placeholder} options={options} />
			<StyleAnimatedView style={rChevronStyle} className="absolute right-6">
				<StyledFeather name="chevron-down" size={18} className="text-muted" />
			</StyleAnimatedView>
		</View>
	);
};

type ValueProps = SelectValueProps & { options: Option[] };

const Value = ({ asChild, placeholder, options, ...props }: ValueProps) => {
	const { value } = useSelect();

	const resolvedValue = value instanceof Object ? value.value : value;

	const displayValue = options.find(option => option.value === resolvedValue)?.label;
	return <AppText className="text-foreground text-base">{displayValue ?? placeholder}</AppText>;
};

/*

const Value = React.forwardRef<ValueRef, ValueProps>(
  ({ asChild, placeholder, ...props }, ref) => {
    const { value } = useRootContext();

    const Component = asChild ? Slot.Text : Text;

    return (
      <Component ref={ref} {...props}>
        {value?.label ?? placeholder}
      </Component>
    );
  }
);

*/

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
