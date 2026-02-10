import { createMMKV } from 'react-native-mmkv';

export const trainingStorage = createMMKV({
	id: `training-storage`,
	readOnly: false
});
