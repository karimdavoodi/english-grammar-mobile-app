# Release 2.0 — Android and iOS

Release metadata is locked to **2.0.0** (`versionCode` / `CURRENT_PROJECT_VERSION`
2). The shipped feature set is the complete 90-level corpus, four question types,
Mixed Review, daily streaks and local statistics, optional local notifications,
Graduation, and Endless Mastery Review.

## Clean-checkout release gate

Run from a clean checkout. A real Android keystore and Apple signing credentials
are supplied by the release owner and never committed.

```sh
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run release:android
xcodebuild -workspace ios/EnglishGrammarGame.xcworkspace \
  -scheme EnglishGrammarGame -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/EnglishGrammarGame.xcarchive archive
```

The Android artifact is `android/app/build/outputs/bundle/release/app-release.aab`.
The iOS archive is `build/EnglishGrammarGame.xcarchive`. Android can produce a
debug-signed smoke artifact without local credentials; a store upload requires
`android/keystore.properties` and the matching private keystore. iOS archiving
and uploading requires signing configured in Xcode.

## Post-build smoke checklist

Repeat on a fresh install of each platform's release candidate:

- [ ] Launch and choose a starting track.
- [ ] Play and complete a level using typed questions; confirm wrong-answer lesson
      feedback and pass/mercy behavior.
- [ ] Open Level Map, Review, Mixed Review, Stats, and Settings.
- [ ] Enable and disable the local daily reminder; confirm the default is off.
- [ ] Complete the corpus journey and confirm Graduation opens Endless Mastery
      Review; exit Mastery Review cleanly.
- [ ] Reset learning progress and confirm settings, events, and app identity remain.
- [ ] Verify report/error mailto flows and that no credentials or private telemetry
      appear in the build or store metadata.

## Store handoff

- [ ] Capture final Android and iOS screenshots from release builds.
- [ ] Upload the updated copy from `docs/store-listing.md`.
- [ ] Publish the hosted privacy policy matching `docs/privacy.md`.
- [ ] Upload the signed AAB and iOS archive through the respective consoles.
- [ ] Use a staged rollout and monitor the first release cohort before widening it.

Credentials, screenshots, archives, and store uploads are release-owner artifacts;
they remain outside git.
