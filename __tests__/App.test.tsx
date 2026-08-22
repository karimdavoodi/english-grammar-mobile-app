/**
 * @format
 */

// The app root now boots through AppProvider → AppNavigator. Mock the native
// storage and navigation modules so the tree renders in Node without native
// modules or an emulator. Screens are stubbed to null; this is a smoke test
// that the composition root mounts without crashing.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
    },
  };
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children?: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
  // Let the AppProvider boot flow (load + auto-start) settle.
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
});
