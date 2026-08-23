# Release Pipeline & Crash Reporting — English Grammar Game

Companion to Task 3 of `docs/app-plan.md`. Covers the Android release build
(signing + AAB) and the crash/error-visibility story for shipped builds.

Both are **local-first by default**:

- Release credentials (keystore) are never committed — the repo ships a
  template and the owner supplies the real key outside git.
- Crash visibility defaults to the **local error log** (`egg:errors`) captured
  by a `global.ErrorUtils` hook, reachable by the developer and exportable as a
  mailto. Sentry is the documented optional third-party alternative; a Sentry
  DSN would be injected from the environment, never committed.

---

## 1. Android release build (signed AAB)

### Prerequisites (owner environment)

- Java (JDK 17+) and the Android SDK installed, with `ANDROID_HOME` set or a
  `local.properties` file in `android/` pointing at the SDK.
- `android/debug.keystore` already exists for debug builds (checked into the
  template project). The release keystore is created by the owner, below.

### One-time: create the release keystore

Generate a keystore with the JDK `keytool`. It may be kept anywhere — the
recommended location is `android/app/` next to the debug keystore:

```sh
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore android/app/english-grammar-game-release.keystore \
  -alias englishgrammargame \
  -keyalg RSA -keysize 2048 -validity 10000
```

> Keep this file and its passwords safe and private. `*.keystore`, `*.jks`, and
> `keystore.properties` are gitignored (`git check-ignore` to confirm). If you
> lose it you cannot update the app on the store under the same key.

### One-time: create `android/keystore.properties`

Copy the template and fill in the values for the keystore above:

```sh
cp android/keystore.properties.example android/keystore.properties
# edit: storeFile, storePassword, keyAlias, keyPassword
```

`storeFile` is resolved relative to the `android/app` module directory, so
`english-grammar-game-release.keystore` (in `android/app/`) is referenced by
just its file name.

### Build the release AAB

```sh
npm run release:android        # → cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`.

Behavior without `android/keystore.properties` (CI, first clone): the release
buildType falls back to the debug keystore, so `bundleRelease` still produces an
installable artifact for smoke-testing. **A store upload must use the release
signing config** — upload to Google Play will reject a debug-signed AAB anyway,
which is the built-in guard.

Install the release build on an emulator/device:

```sh
npm run release:android
adb install -r android/app/build/outputs/apk/release/app-release.apk  # or the AAB via bundletool
```

---

## 2. Crash / error visibility

### Default: local error log (`egg:errors`)

Shipped builds capture **uncaught JS errors** (fatal and non-fatal) through a
`global.ErrorUtils` handler installed in `index.js` before the root component
registers (`src/app/errorReporting.ts`). Each error is appended to the
`egg:errors` AsyncStorage key (`src/state/errors.ts`), bounded to 50 entries
(oldest dropped).

What a captured entry contains: message, stack (when present), ISO timestamp,
app version (from `app.json`), and a fatal flag. **No device identifiers,
names, or accounts** — it is raw error telemetry only.

The capture never throws into a crashed app: persistence failures are swallowed,
and the previous ErrorUtils handler is chained so the platform's own logging /
red-box still runs.

**Reaching the log (developer):**

- During development, force an error and inspect the log. A quick in-app probe
  (e.g. in `App.tsx` behind a `__DEV__` flag) can `console.log` the entries.
- The export path is the pure `composeErrorReport` / `errorReportMailto`
  primitives in `src/state/errors.ts` — Task 5 ("Report-an-error button +
  Report screen") wires them into a visible screen. Until then, a debug-only
  printout or `AsyncStorage.getItem('egg:errors')` from a native debugger shows
  the same data.

### Optional: Sentry (third-party, release infra)

If the owner prefers hosted crash reporting (it also captures **native**
Android/iOS crashes that the JS-only local log cannot), add `@sentry/react-native`:

```sh
npm install @sentry/react-native
# native rebuild required: cd ios && pod install; Android syncs on next build
```

Wire-up sketch (never commit a DSN):

```ts
// index.js
import * as Sentry from '@sentry/react-native';
const dsn = process.env.SENTRY_DSN; // injected by the build environment
if (!__DEV__ && dsn) {
  Sentry.init({ dsn });
}
Sentry.wrap(() => installErrorReporting())(); // keep the local log too
```

The privacy policy (`docs/privacy.md`) states that if a release enables a
crash-reporting provider, this section will be updated to name it. Keep that
promise when enabling Sentry.

---

## 3. Verification

| Check | Command / action |
|---|---|
| JS + native typing clean | `npx tsc --noEmit` |
| Lint clean | `npm run lint` |
| Full test suite green | `npm test` |
| Release AAB builds (owner env) | `npm run release:android` |
| Release build boots | Install the AAB/APK and complete: start → play → pass → map |
| Local capture works | In a dev build, throw inside a screen render (e.g. `throw new Error('probe')`), then confirm an entry exists under `egg:errors` |

---

## 4. What stays out of git

- `android/keystore.properties` and any `*.keystore` / `*.jks` (except the
  checked-in debug keystore).
- Any Sentry DSN or other telemetry secret — always injected via environment.
- Google Play / App Store credentials and uploads.
