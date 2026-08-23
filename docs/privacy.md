# Privacy Policy — English Grammar Game

*Effective with the 2.0.0 release. This document describes the app's actual
data behavior; it is updated in the same task that changes the behavior.*

## Summary

**English Grammar Game is a local-first app.** It has no accounts, cloud storage,
advertising SDK, or third-party analytics. Almost everything happens on your device.

## What is stored on your device

All app data lives in local storage (React Native's AsyncStorage) and is never
uploaded by the app on its own:

- **Learning progress** — levels passed, wrong-answer history, the weakness queue,
  and your streak.
- **Settings** — theme and optional local notification preferences.
- **Local statistics** — a bounded on-device event log for the Stats screen.
- **Error logs** — recent uncaught JavaScript errors, for local viewing/export.
- **Content reports** — question id, optional note, timestamp, and app version
  until you send a report.

Uninstalling the app or clearing its data erases local data. There is no server to
restore it from.

## What leaves your device

Only these user-controlled flows can leave the device:

1. **Error reports you send.** The Report an error action composes an email with
   the question id, level, optional note, and app version. Nothing is sent until
   you press send in your email app.
2. **Crash/error reports.** This release records uncaught JavaScript errors
   locally; no hosted crash-reporting service is enabled and nothing is sent
   automatically.

## Permissions

- **Notifications** (optional): a daily practice reminder can be enabled in
  Settings and is scheduled entirely on the device.
- No other permissions are required. The app does not request location, contacts,
  camera, or microphone access.

## Data we do not collect

- No account, name, email address, phone number, or date of birth.
- No device identifiers used for advertising or tracking.
- No purchase data; the app is free and has no ads or in-app purchases.

## Children's privacy

The app does not require an account or ask children for personal information. We
do not knowingly collect personal data from children. Reports and local error logs
contain no personal identifiers unless a user adds personal information to an
optional report note or email.

## Contact

For questions about this policy, contact the developer at the support address
listed in the app's store listing.

*This policy matches the app's behavior as of the 2.0.0 release. Add the support
address before publishing a store listing.*
