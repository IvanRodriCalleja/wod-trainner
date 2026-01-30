import { PropsWithChildren, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Card } from 'heroui-native';

import LiquidMetal, {
	createMistMetal,
	createPearlMetal,
	createSilverMetal
} from '@wod-trainer/design-system/ui/LiquidMetal';
import { Div, Span } from '@wod-trainer/strict-dom';

import { WorkoutType } from 'modules/workout/domain/WorkoutType';

type TrainingTypeOption = {
	type: WorkoutType;
	label: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
};

const trainingTypes: TrainingTypeOption[] = [
	{
		type: WorkoutType.EMOM,
		label: 'EMOM',
		description: 'Every Minute On the Minute',
		icon: 'timer-outline'
	},
	{
		type: WorkoutType.FORTIME,
		label: 'For Time',
		description: 'Complete as fast as possible',
		icon: 'stopwatch-outline'
	},
	{
		type: WorkoutType.AMRAP,
		label: 'AMRAP',
		description: 'As Many Reps As Possible',
		icon: 'repeat-outline'
	},
	{
		type: WorkoutType.TABATA,
		label: 'Tabata',
		description: '20s work / 10s rest intervals',
		icon: 'pulse-outline'
	}
];

const HomeScreen = () => {
	const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);

	return (
		<View className="flex-1 p-4">
			<View className="flex-row flex-wrap">
				{trainingTypes.map(training => (
					<Pressable
						key={training.type}
						className="aspect-square w-1/2 p-2"
						onPress={() => setSelectedType(training.type)}>
						<LiquidMetalCard>
							<Div className="flex h-full flex-col p-4">
								<Div className="flex-1 items-center justify-center">
									<Ionicons name={training.icon} size={48} color={'#f59e0b'} />
								</Div>
								<Span className="text-foreground text-center">{training.label}</Span>
							</Div>
						</LiquidMetalCard>
						{/*<Card
							variant={selectedType === training.type ? 'default' : 'secondary'}
							className={`${selectedType === training.type ? 'border-accent border-2' : ''}`}>
							<Card.Body className="items-center gap-2 p-4">
								<Ionicons
									name={training.icon}
									size={32}
									color={selectedType === training.type ? '#f59e0b' : '#888'}
								/>
								<Card.Title className="text-center">{training.label}</Card.Title>
								<Card.Description className="text-center text-xs">
									{training.description}
								</Card.Description>
							</Card.Body>
						</Card>*/}
					</Pressable>
				))}
			</View>
		</View>
	);
};

const LiquidMetalCard = ({ children }: PropsWithChildren) => {
	return (
		<Div className="relative overflow-hidden rounded-[12] p-[3]">
			<Div className="absolute inset-0">
				<Div className="mt-[-50%] ml-[-50%] h-full w-full">
					<LiquidMetal
						width="200%"
						height="200%"
						material="chrome"
						repetition={3}
						{...createMistMetal()}
						shape="square"
						distortion={0.15}
						scale={1}
						shiftBlue={0.5}
						shiftRed={0.5}
						contour={0.6}
						softness={0.2}
						angle={70}
						fit="contain"
					/>
				</Div>
			</Div>

			<Div className="bg-background relative z-10 h-full w-full rounded-[9]">{children}</Div>
		</Div>
	);
};

export default HomeScreen;
