import '@testing-library/react-native/matchers';

// Mock react-native-worklets - scheduleOnRN executes function synchronously in tests
jest.mock('react-native-worklets', () => ({
	scheduleOnRN: jest.fn((fn, ...args) => fn(...args))
}));
