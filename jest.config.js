export default {
	preset: 'jest-expo',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/react-native-skia|react-native-reanimated|react-native-worklets|heroui-native|uniwind)'
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	testMatch: ['**/*.test.ts', '**/*.test.tsx'],
	collectCoverageFrom: ['modules/**/*.{ts,tsx}', '!**/*.d.ts'],
	testEnvironment: 'node'
};
