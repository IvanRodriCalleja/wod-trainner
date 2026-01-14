import { Text, View } from 'react-native';

import { Stack } from 'expo-router';

const NotFound = () => {
	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<View>
				<Text>This screen doesn't exist.</Text>
			</View>
		</>
	);
};

export default NotFound;
