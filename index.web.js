/**
 * Web entry point — runs the same RN app through react-native-web.
 *
 * Metro's platform-extension resolution picks this file over index.js when
 * bundling for the `web` platform. On native, the OS runtime calls
 * AppRegistry.runApplication once the bundle loads; in a browser there is no
 * native runtime, so we mount the registered app into the DOM ourselves.
 * The #root element must already exist (see web/index.html).
 *
 * Run with: `npm run web`
 *
 * @format
 */

/* global document */
import { AppRegistry } from 'react-native';
import { installErrorReporting } from './src/app/errorReporting';
import App from './App';
import { name as appName } from './app.json';

installErrorReporting();

AppRegistry.registerComponent(appName, () => App);

AppRegistry.runApplication(appName, { rootTag: document.getElementById('root') });
