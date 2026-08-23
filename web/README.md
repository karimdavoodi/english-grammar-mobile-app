# Web preview (react-native-web)

Run the app in a browser instead of a mobile emulator:

```
npm run web
```

This starts the Metro dev server **and** the preview server, then prints the
URL (default `http://localhost:3000`). Open it in a browser.

To run the pieces separately:

```
npm run web:metro   # Metro dev server on :8081
npm run web:serve   # preview server on :3000 (proxies Metro)
```

## How it works

- `index.web.js` — the `web` platform entry (Metro picks it over `index.js`
  for `platform=web`). It registers the app and calls
  `AppRegistry.runApplication` into the `#root` element itself, because a
  browser has no native runtime to do that.
- `metro.config.js` — registers `web` as a Metro platform and resolves
  `react-native` → `react-native-web` **only** when bundling for `web`, so
  iOS/Android bundles are untouched. It also disables the `.native.js`
  variant preference on web and redirects the asset registry to
  react-native-web's own.
- `web/server.js` — serves `index.html` and reverse-proxies the bundle/assets
  from Metro onto the same origin (no CORS, relative asset URLs resolve).
- `WebBackButton` (`src/navigation/`) — the web back affordance. The app's
  normal back is the system gesture (Android hardware back / iOS swipe), which
  a browser lacks, so on web a small iOS-style `‹` appears whenever a pushed
  screen sits above Home and pops it on tap. It lives in a dedicated top bar
  (reserved in `AppNavigator`) that pushes the screen content down, so it never
  covers a screen's own header. Native renders nothing.

## Caveats on web

- `@notifee/react-native` (daily reminders) is native-only; it is lazily
  required and simply does nothing on web.
- `@react-navigation/native-stack` renders through react-native-screens' JS
  fallback — screens work, but without native transitions.
- AsyncStorage persists to `localStorage`.
- No Fast Refresh: edit code, then reload the page (Metro rebundles on demand).
