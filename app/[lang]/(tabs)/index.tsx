import { StyleSheet, Text, View } from 'react-native';

import { useLocale } from '@wod-trainer/internationalization/ui/I18nProvider';

export default function TabOneScreen() {
	const { title } = useLocale();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			<View style={styles.separator} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold'
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: '80%'
	}
});
