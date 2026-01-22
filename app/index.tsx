import { Div } from '@wod-trainer/strict-dom';

import { TrainingTimer } from 'modules/timer/domain/TrainningTimer';
import { Timer } from 'modules/timer/ui/Timer';
import { WorkoutType } from 'modules/workout/domain/WorkoutType';

const trainingTimer: TrainingTimer = {
	workoutType: WorkoutType.EMOM,
	phases: [
		{
			duration: 60,
			exercise: 'Push-ups'
		},
		{
			duration: 60,
			exercise: 'Pull-ups'
		},
		{
			duration: 60,
			exercise: 'Rest'
		},
		{
			duration: 60,
			exercise: 'Push-ups'
		},
		{
			duration: 60,
			exercise: 'Pull-ups'
		},
		{
			duration: 60,
			exercise: 'Rest'
		},
		{
			duration: 60,
			exercise: 'Push-ups'
		},
		{
			duration: 60,
			exercise: 'Pull-ups'
		},
		{
			duration: 60,
			exercise: 'Rest'
		},
		{
			duration: 60,
			exercise: 'Push-ups'
		},
		{
			duration: 60,
			exercise: 'Pull-ups'
		},
		{
			duration: 60,
			exercise: 'Rest'
		}
	]
};

const HomeScreen = () => {
	return (
		<Div className="bg-background flex h-full items-center justify-center p-4">
			<Timer trainingTimer={trainingTimer} />
		</Div>
	);
};

export default HomeScreen;
