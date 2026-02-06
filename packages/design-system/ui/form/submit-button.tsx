import { PropsWithChildren } from 'react';

import { Button } from 'heroui-native/button';

import { useFormContext } from './form';

export const SubmitButton = ({ children }: PropsWithChildren) => {
	const { onSubmit } = useFormContext();

	return <Button onPress={onSubmit}>{children}</Button>;
};
