'use client';

import { PropsWithChildren } from 'react';

import { useFont } from '../hooks/useFont';

export const DesignSystemProvider = ({ children }: PropsWithChildren) => {
	const { loaded, error } = useFont();

	if (!loaded && !error) {
		return null;
	}

	return <>{children}</>;
};
