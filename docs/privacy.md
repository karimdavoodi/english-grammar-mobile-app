# Privacy Policy — English Grammar Game

*Working title; effective with the first public release. This document describes
the app's actual data behavior; it is updated in the same task that changes the
behavior. If a store listing links to a hosted copy, keep this file and the
hosted copy in sync.*

## Summary

**English Grammar Game is a local-first app.** It has no accounts, no cloud
storage, no advertising SDK, and no third-party analytics. Almost everything
happens on your device.

## What is stored on your device

All app data lives in the app's local storage on your device (React Native's
AsyncStorage). It is never uploaded by the app on its own:

- **Learning progress** — levels passed, wrong-answer history, the weakness
  queue, and your streak.
- **Settings** — theme choice, and (if enabled) notification preferences.
- **Local statistics** — an on-device event log used to show your accuracy and
  progress on the Stats screen. This log is bounded (oldest entries are dropped)
  and stays on the device.
- **Error logs** — if crash/error capture is enabled (see below), recent errors
  are recorded on the device so they can be sent or viewed.
- **Content reports** — anything you mark with "Report an error" is saved
  locally (question id, optional note, timestamp, app version) until you send it.

Because progress and settings are stored only on your device, **uninstalling the
app or clearing its data erases them**. There is no server to restore from.

## What leaves your device

Only two things can leave the device, and both are under your control or opt-in:

1. **Error reports you send.** The "Report an error" button composes an email
   (using your device's email app) pre-filled with the question id, level, your
   optional note, and the app version. Nothing is sent until you hit send in
   your own email app. The recipient address is the developer's support inbox.

2. **Crash reports (release builds only).** To fix bugs in shipped builds,
   current builds capture uncaught JS errors into the local error log described
   above — nothing leaves the device on its own. The log can be exported by the
   developer as an email. A future release may instead (or additionally) wire a
   crash-reporting service (such as Sentry), which would send a stack trace and
   device metadata (model, OS version, app version) — no name, email, or
   account. That would be a developer choice, disabled by default, and if it is
   enabled this section will be updated to name the provider.

## Permissions

- **Notifications** (optional): a daily practice reminder can be enabled in
  Settings. The permission prompt appears only when you turn it on; the
  notification is created and scheduled entirely on your device. You can turn
  it off at any time.
- No other permissions are required to play. The app does not request location,
  contacts, camera, or microphone.

## Data you should know we do NOT collect

- No account, name, email address, phone number, or date of birth.
- No device identifiers used for advertising or tracking.
- No purchase data (the app is free; there are no ads or in-app purchases).

## Children's privacy

The app is designed for English learners and does not require an account, so it
does not ask children for personal information. We do not knowingly collect
personal data from children. Error reports and crash payloads (above) contain
no personal identifiers.

## Contact

For questions about this policy, contact the developer at the support address
listed in the app's store listing.

---

*This policy matches the app's behavior as of the release described in
`docs/store-listing.md`. Review it whenever Task 2 (app identity) or Task 3
(crash reporting) changes what the app does with data.*
