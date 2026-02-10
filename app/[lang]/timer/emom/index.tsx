import { View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { Option } from '@wod-trainer/design-system/domain/Option';
import { createForm } from '@wod-trainer/design-system/ui/form';
import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';
import { AppText } from '@wod-trainer/design-system/ui/text';

import { useEmom } from 'modules/emom/infra/emomRepository';

const times: Option[] = [
	{ value: 1, label: '1 minute' },
	{ value: 2, label: '2 minutes' },
	{ value: 3, label: '3 minutes' },
	{ value: 4, label: '4 minutes' },
	{ value: 5, label: '5 minutes' },
	{ value: 6, label: '6 minutes' },
	{ value: 7, label: '7 minutes' },
	{ value: 8, label: '8 minutes' },
	{ value: 9, label: '9 minutes' },
	{ value: 10, label: '10 minutes' }
];

const rounds: Option[] = [
	{ value: 1, label: '1 round' },
	{ value: 2, label: '2 rounds' },
	{ value: 3, label: '3 rounds' },
	{ value: 4, label: '4 rounds' },
	{ value: 5, label: '5 rounds' },
	{ value: 6, label: '6 rounds' },
	{ value: 7, label: '7 rounds' },
	{ value: 8, label: '8 rounds' },
	{ value: 9, label: '9 rounds' },
	{ value: 10, label: '10 rounds' }
];

type EmomFormData = {
	time: number;
	rounds: number;
};

const { Form, FieldSelect, SubmitButton } = createForm<EmomFormData>();

const EmomPage = () => {
	const { saveEmom } = useEmom();
	const { lang } = useLocalSearchParams<{ lang: string }>();

	const handleSubmit = (data: EmomFormData) => {
		saveEmom({ time: data.time, rounds: data.rounds });
		router.push(`/${lang}/timer/emom/training`);
	};

	return (
		<ScreenScrollView className="flex" contentContainerClassName="flex-1">
			<View className="h-full flex-1 justify-center gap-8 px-5">
				<View className="my-4 items-center justify-center">
					<AppText className="text-muted text-base">Select a timer mode to get started</AppText>
				</View>

				<View className="flex-1">
					<Form onSubmit={handleSubmit}>
						<View className="flex-1 gap-4">
							<FieldSelect
								name="time"
								options={times}
								label="Time"
								size="lg"
								description="Select a time"
							/>

							<FieldSelect
								name="rounds"
								options={rounds}
								label="Rounds"
								size="lg"
								description="Select a time"
							/>
						</View>
						<SubmitButton size="lg">dede</SubmitButton>
					</Form>
				</View>
			</View>
		</ScreenScrollView>
		/**/
	);
};

export default EmomPage;
