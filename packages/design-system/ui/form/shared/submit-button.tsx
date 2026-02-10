import { Button, ButtonProps } from '../../button';
import { useFormContext } from './form';

export const SubmitButton = ({ children, ...props }: Omit<ButtonProps, 'onPress'>) => {
	const { onSubmit } = useFormContext();

	return (
		<Button.Root onPress={onSubmit} {...props}>
			{children}
		</Button.Root>
	);
};
