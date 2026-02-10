import {
	Button as ButtonPrimitive,
	ButtonRootProps as ButtonPrimitiveProps,
	cn
} from 'heroui-native';

export type ButtonProps = ButtonPrimitiveProps;

export const Root = ({ children, ...props }: ButtonProps) => {
	return (
		<ButtonPrimitive className={cn('rounded-lg', props.className)} {...props}>
			{children}
		</ButtonPrimitive>
	);
};

export const Button = {
	...ButtonPrimitive,
	Root
};
