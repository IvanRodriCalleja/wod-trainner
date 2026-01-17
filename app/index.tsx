import { Div } from '@wod-trainer/strict-dom';

import { Timer } from 'modules/timer/ui/Timer';

const HomeScreen = () => {
	return (
		<Div className="bg-background flex h-full items-center justify-center p-4">
			<Timer />
		</Div>
	);
};

export default HomeScreen;
