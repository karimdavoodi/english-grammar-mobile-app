# Platform Regression Matrix

Task 27B release-regression record for the English Grammar Game. The automated
journey in `src/app/__tests__/journey.test.ts` covers fresh install, all four
question types, Mixed Review, daily streaks, corpus completion, Graduation,
Mastery Review, and reset persistence. Native smoke checks below cover the
platform boundary that Jest cannot exercise.

## Automated release gate

Run from the repository root:

```sh
npm test
npm run lint
npx tsc --noEmit
```

The journey test is included in `npm test`; run it alone while iterating:

```sh
npm test -- journey
```

## Native matrix

| Platform | Build / smoke command | Manual flow |
| --- | --- | --- |
| Android debug | `cd android && ./gradlew app:assembleDebug` | Fresh install → choose a track → play a typed question → pass → map → Mixed Review → Settings → reset |
| Android release smoke | `npm run release:android` | Install the generated APK/AAB and repeat the core flow; use a real release keystore for store artifacts |
| iOS simulator | `xcodebuild -workspace ios/EnglishGrammarGame.xcworkspace -scheme EnglishGrammarGame -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' CODE_SIGNING_ALLOWED=NO build` | Fresh install → choose a track → play → pass → map → Mixed Review → reset |
| iOS archive | `xcodebuild -workspace ios/EnglishGrammarGame.xcworkspace -scheme EnglishGrammarGame -configuration Release -destination 'generic/platform=iOS' -archivePath build/EnglishGrammarGame.xcarchive archive` | Owner enables signing, uploads to TestFlight, then repeats the iOS simulator flow on a TestFlight build |

Simulator names, signing, CocoaPods, Android SDKs, and release credentials are
environment-specific. Keep generated `ios/build`, Pods, archives, keystores,
and store credentials out of git. If a native command cannot run locally, the
failure should be recorded with the missing prerequisite rather than treated as
an automated JavaScript regression.
