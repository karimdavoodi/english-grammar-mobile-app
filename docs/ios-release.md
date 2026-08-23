# iOS Build and TestFlight Guide

The iOS target uses bundle identifier `com.englishgrammargame`, matching the
Android application ID. The repository does not contain Apple signing
credentials or a development team ID.

## Prerequisites

Use the full Xcode application, not only the standalone Command Line Tools:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version
```

Install CocoaPods and the native dependencies from the repository root. The
command is safe to repeat after dependency changes:

```sh
npx pod-install
```

If CocoaPods reports that `cmake` is missing while preparing Hermes, install
the CMake tool required by the React Native pod build before retrying. Do not
commit `ios/Pods` or generated `ios/build` output.

## Local simulator build

On a Mac with the full Xcode application installed and selected:

```sh
xcodebuild \
  -workspace ios/EnglishGrammarGame.xcworkspace \
  -scheme EnglishGrammarGame \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

The simulator build is intentionally unsigned. Launch it from Xcode or with
`npm run ios` after selecting an available simulator destination.

Manual smoke check: fresh install → choose a starting track → play a level →
pass it → confirm the level map appears.

If the simulator name differs on the machine, list available destinations and
replace the `-destination` value:

```sh
xcodebuild -workspace ios/EnglishGrammarGame.xcworkspace \
  -scheme EnglishGrammarGame -showdestinations
```

## Archive and TestFlight

An owner with Apple Developer access must first open the project in Xcode,
select the `EnglishGrammarGame` target, choose the organization's Team, and
confirm the `com.englishgrammargame` App ID exists in the Apple Developer
portal. Xcode can then manage provisioning automatically.

From the repository root:

```sh
xcodebuild \
  -workspace ios/EnglishGrammarGame.xcworkspace \
  -scheme EnglishGrammarGame \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/EnglishGrammarGame.xcarchive \
  archive
```

For a local archive without signing credentials, add
`CODE_SIGNING_ALLOWED=NO`; it cannot be uploaded to TestFlight until an owner
selects an Apple Developer team and enables signing in Xcode.

Open the resulting archive in Xcode Organizer and choose **Distribute App →
App Store Connect → Upload**. Complete App Store metadata, privacy answers,
and TestFlight tester setup in App Store Connect. Apple credentials and
signing material stay outside this repository.
