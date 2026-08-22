/**
 * English Grammar Game — app root.
 *
 * Task 9 replaces the NewAppScreen scaffold with the real composition root:
 * SafeAreaProvider → AppProvider (loads content + state, decides the boot
 * route) → AppNavigator (native-stack). The full provider/startup polish lands
 * in Task 13.
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/app/AppProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
