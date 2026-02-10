import { PropsWithChildren, createContext, use } from 'react';

import { useMMKVString } from 'react-native-mmkv';

import { EMOM } from '../domain/emom';

const defaultEmom: EMOM = { time: 0, rounds: 0 };

type EmomContextValue = {
	emom: EMOM;
	saveEmom: (emom: EMOM) => void;
};

const EmomContext = createContext<EmomContextValue>({ emom: defaultEmom, saveEmom: () => {} });

export const useEmom = () => use(EmomContext);

export const EmomProvider = ({ children }: PropsWithChildren) => {
	const [emom, setEmom] = useMMKVString('emom');

	const saveEmom = (emom: EMOM) => {
		setEmom(JSON.stringify(emom));
	};

	return (
		<EmomContext value={{ emom: emom ? JSON.parse(emom) : defaultEmom, saveEmom }}>
			{children}
		</EmomContext>
	);
};
