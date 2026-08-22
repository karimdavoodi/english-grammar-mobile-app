module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation v7 and its peers ship untranspiled ESM — transform them so
  // the real navigator can be rendered in Jest (Task 14 navigator integration).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
