import { PropsWithChildren, createContext, use } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

type FormContextValue = {
	onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
};

const FormContext = createContext<FormContextValue>({
	onSubmit: () => {
		throw new Error('Form context not initialized');
	}
});

export const useFormContext = () => {
	const context = use(FormContext);
	if (!context) {
		throw new Error('Form context not initialized');
	}
	return context;
};

type FormProps<T extends object> = Parameters<typeof useForm<T>>[0] & {
	onSubmit: (data: T) => Promise<void> | void;
};

export const Form = <T extends object>({ children, ...props }: PropsWithChildren<FormProps<T>>) => {
	const form = useForm(props);

	return (
		<FormContext value={{ onSubmit: form.handleSubmit(props.onSubmit) }}>
			<FormProvider {...form}>{children}</FormProvider>
		</FormContext>
	);
};
