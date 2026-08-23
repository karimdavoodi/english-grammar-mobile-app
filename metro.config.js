const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Web support: `web` is registered as an extra Metro platform and a
 * platform-scoped resolver aliases `react-native` → `react-native-web` ONLY
 * when bundling for `web` (mirrors the CLI's reactNativePlatformResolver; the
 * setup-env route is unusable because react-native-web 0.21 ships no
 * setup-env file). Native (ios/android) bundles are untouched.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    platforms: [...defaultConfig.resolver.platforms, 'web'],
    resolveRequest: (context, moduleName, platform) => {
      if (platform === 'web') {
        // On web, a `.native.js` variant must never beat a plain `.js` one
        // (Metro defaults preferNativePlatform to true). E.g. native-stack
        // ships FontProcessor.native.js that imports react-native internals;
        // web wants FontProcessor.js, which imports nothing.
        const webContext = {...context, preferNativePlatform: false};
        // Metro generates asset modules as require('react-native/asset-registry').
        // On web, register into react-native-web's OWN registry (CJS build, to
        // match the build its Image imports) so Image.resolveAssetSource finds them.
        if (moduleName === 'react-native/asset-registry') {
          return webContext.resolveRequest(
            webContext,
            'react-native-web/dist/cjs/modules/AssetRegistry',
            platform,
          );
        }
        if (moduleName === 'react-native') {
          return webContext.resolveRequest(webContext, 'react-native-web', platform);
        }
        if (moduleName.startsWith('react-native/')) {
          const rest = moduleName.slice('react-native/'.length);
          return webContext.resolveRequest(webContext, `react-native-web/${rest}`, platform);
        }
        return webContext.resolveRequest(webContext, moduleName, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
