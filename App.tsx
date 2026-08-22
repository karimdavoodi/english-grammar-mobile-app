/**
 * English Grammar Game — app root.
 *
 * Task 9 replaces the NewAppScreen scaffold with the real composition root:
 * SafeAreaProvider → AppProvider (loads content + state, decides the boot
 * route) → AppNavigator (native-stack). Task 12 moves the StatusBar into
 * AppProvider so it follows the resolved theme (device | light | dark).
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/app/AppProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
