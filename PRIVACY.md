# Privacy Policy — Productively

**Last updated:** 21 August 2026

Productively is an offline-first routine and habit tracker for Android. This
policy describes what the app does with your information. It is short because
the app does very little with it.

## The short version

Productively has no account system, no server of its own, and no analytics.
Nothing you enter is transmitted anywhere unless you personally choose to export
a file or connect your own Google Drive.

## What is collected

**Nothing is collected by the developer.** There is no backend service, no
telemetry, no crash reporting, no advertising SDK, and no third-party analytics
in the app. No usage data, device identifier, or personal information is
transmitted to me or to anyone else.

## What is stored, and where

Everything you create in the app — routines, tasks, completed sessions,
checklists, journal notes, preferences and profile name — is stored **on your
device**, in the app's private storage.

If you connect Google Drive, the OAuth tokens for that connection are stored in
the Android Keystore via `expo-secure-store`, not in ordinary app storage.

Uninstalling the app removes all of it.

## When data leaves your device

Two cases, both of which you start:

### 1. Exporting a backup file

Choosing *Export* writes a single JSON file containing your app data and hands
it to Android's share sheet. Where it goes from there — a messaging app, cloud
storage, your own files — is entirely your choice. The app does not upload it
anywhere.

### 2. Connecting Google Drive

If you connect a Google account on the Backup screen, the app uploads backup
files to the [`appDataFolder`](https://developers.google.com/workspace/drive/api/guides/appdata)
of **your** Google Drive.

- `appDataFolder` is a hidden, per-application area of your own Drive. It is not
  visible in your normal Drive file list, and no other application — including
  any other application of mine — can read it.
- The app requests the `drive.appdata` scope, which is the narrowest scope
  Google offers for this purpose. It grants access **only** to files this app
  created. Productively cannot see, list, or read any other file in your Drive.
- Two additional scopes, `userinfo.email` and `userinfo.profile`, are requested
  so the Backup screen can show which account is connected. That email address
  is stored on-device only, and is never transmitted anywhere by the app.
- The `id_token` returned by Google is deliberately discarded and never stored.

Your data in this case is held by Google under
[Google's Privacy Policy](https://policies.google.com/privacy), in an area of
your own account. Disconnecting the account from the Backup screen revokes the
token and removes it from the device. You can delete the stored backups at any
time from within the app, or revoke the app's access entirely at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Permissions the app requests

| Permission | Why |
|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Google Drive backup only, including the Wi‑Fi‑only setting. Unused if you never connect Drive. |
| `POST_NOTIFICATIONS` | Routine reminders. Optional, off by default. |
| `RECEIVE_BOOT_COMPLETED` | Restores scheduled reminders after a restart, so they survive a reboot. |
| `VIBRATE` | Haptic feedback. Can be turned off in Settings. |
| `SCHEDULE_EXACT_ALARM` | Lets a reminder fire at the minute it was set for. Without it Android batches the notification and an 8:00am reminder can arrive whenever the system next wakes. Android denies this by default from version 14; Settings ▸ Routine ▸ Exact timing opens the page where you can grant it. |

The app explicitly **blocks** a list of launcher badge-count and push-messaging
permissions that transitive dependencies would otherwise add to the manifest —
see `android.blockedPermissions` in `app.json`.

## Children

Productively is not directed at children and collects no information from
anyone, including children.

## Changes

Any change to this policy will be committed to this repository, so its full
history is visible in the git log.

## Contact

Questions about this policy: open an issue at
[github.com/PrashantSingh5946/productively](https://github.com/PrashantSingh5946/productively/issues).
