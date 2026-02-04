import { useRef } from 'react';
import { Platform } from 'react-native';

import { useHeaderHeight as useHeaderHeightElements } from '@react-navigation/elements';

export const useHeaderHeight = (): number => {
	const headerHeight = useHeaderHeightElements();
	const fixedHeight = useRef(headerHeight);

	return Platform.OS === 'android' ? fixedHeight.current : headerHeight;
};
