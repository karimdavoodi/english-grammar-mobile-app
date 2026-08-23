/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { installErrorReporting } from './src/app/errorReporting';
import App from './App';
import { name as appName } from './app.json';

// Task 3: capture uncaught JS errors into the local egg:errors log before the
// root component registers, so startup and render-time crashes surface to the
// developer (see docs/release.md). No-op-safe in tests.
installErrorReporting();

AppRegistry.registerComponent(appName, () => App);
