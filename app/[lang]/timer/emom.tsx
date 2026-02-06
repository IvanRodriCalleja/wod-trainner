import { PropsWithChildren } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Option } from '@wod-trainer/design-system/domain/Option';
import { FieldSelect } from '@wod-trainer/design-system/ui/form/fields/field-select';
import { Form } from '@wod-trainer/design-system/ui/form/form';
import { SubmitButton } from '@wod-trainer/design-system/ui/form/submit-button';
import { ScreenScrollView } from '@wod-trainer/design-system/ui/scroll-view';
import { AppText } from '@wod-trainer/design-system/ui/text';

const times: Option[] = [
	{ value: 1, label: '1 minute' },
	{ value: 2, label: '2 minutes' },
	{ value: 3, label: '3 minutes' },
	{ value: '4', label: '4 minutes' },
	{ value: '5', label: '5 minutes' },
	{ value: '6', label: '6 minutes' },
	{ value: '7', label: '7 minutes' },
	{ value: '8', label: '8 minutes' },
	{ value: '9', label: '9 minutes' },
	{ value: '10', label: '10 minutes' }
];

const KeyboardAvoidingContainer = ({ children }: PropsWithChildren) => {
	const { height } = useWindowDimensions();

	const { progress } = useReanimatedKeyboardAnimation();

	const rStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: withTiming(progress.get() === 1 ? -height * 0.15 : 0, {
						duration: 250
					})
				}
			]
		};
	});

	return <Animated.View style={rStyle}>{children}</Animated.View>;
};

const EmomPage = () => {
	return (
		<ScreenScrollView>
			<View className="gap-3">
				<View className="flex-1 justify-center gap-8 px-5">
					<KeyboardAvoidingContainer>
						<View className="my-4 items-center justify-center">
							<AppText className="text-muted text-base">Select a timer mode to get started</AppText>
						</View>
						<View className="gap-8">
							<Form
								onSubmit={data => {
									console.log({ data });
								}}>
								<FieldSelect name="time" options={times} label="Time" description="Select a time" />
								<SubmitButton>dede</SubmitButton>
							</Form>
						</View>
					</KeyboardAvoidingContainer>
				</View>
			</View>
		</ScreenScrollView>
	);
};

export default EmomPage;
