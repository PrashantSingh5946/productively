# Google Drive backup — setup

The backup engine ships in every build. What does **not** ship is a Google OAuth
client, because a client id belongs to whoever publishes the app, not to the
source tree. Until you add one, the Backup screen stays readable but inert: it
says the feature is not set up and points at local export instead.

Local export and import need no setup at all.

## 1. Create the OAuth clients

In the [Google Cloud console](https://console.cloud.google.com/):

1. Create a project (or pick an existing one) and enable the **Google Drive API**.
2. Configure the **OAuth consent screen**. External + Testing is fine while you
   develop; add your own Google account under *Test users*.
3. Add the scopes the app asks for:
   - `https://www.googleapis.com/auth/drive.appdata`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. Create **Credentials → OAuth client ID** twice:
   - **iOS** — bundle id `com.productively.app`
   - **Android** — package `com.productively.app`, plus the SHA-1 of the
     signing key you build with (`keytool -list -v -keystore ~/.android/debug.keystore`
     for a debug build, password `android`).

`drive.appdata` is the only Drive scope requested. It grants access to a hidden
per-app folder and nothing else — the app cannot see, list or touch any file
the user actually keeps in Drive. It is not a sensitive scope, so it does not
require Google verification.

## 2. Put the ids in `app.json`

```json
"extra": {
  "googleDrive": {
    "iosClientId": "1234-abcd.apps.googleusercontent.com",
    "androidClientId": "1234-efgh.apps.googleusercontent.com",
    "webClientId": "1234-ijkl.apps.googleusercontent.com"
  }
}
```

Anything still starting with `REPLACE_` reads as "not configured".

## 3. Register the redirect scheme

Google hands the OAuth callback back over a custom scheme built from the client
id, reversed. For `1234-abcd.apps.googleusercontent.com` that is:

```
com.googleusercontent.apps.1234-abcd
```

Add it to `expo.scheme` alongside the app's own scheme, so the OS knows to
route the callback to us:

```json
"scheme": ["productively", "com.googleusercontent.apps.1234-abcd"]
```

On iOS use the **iOS** client's reversed id; on Android use the **Android**
client's. If you ship both from one config, list both.

## 4. Rebuild

Custom schemes and the background-task entitlement are native config, so a JS
reload will not pick them up:

```bash
npx expo prebuild --clean && npx expo run:ios
```

## How it behaves once configured

- **Where** — `appDataFolder`, Drive's hidden per-app space. Invisible in the
  user's Drive, counted against their storage quota, removed when they delete
  the app's data from Drive settings.
- **What** — one JSON archive per run: routines, tasks, sessions, notes,
  checklists, profile and settings, under a SHA-256 checksum. Journal notes can
  be excluded from the *Include journal notes* switch.
- **When** — a rolling window of the 5 most recent backups. The schedule is
  checked whenever the app comes to the foreground, and from an
  `expo-background-task` wake-up roughly twice a day. The OS decides whether
  that wake-up actually happens; the foreground check is the guarantee.
- **Gating** — Wi-Fi only by default. A failed run backs off for 30 minutes so
  a broken account cannot spin.

## Testing the background task

```js
import * as BackgroundTask from 'expo-background-task';
await BackgroundTask.triggerTaskWorkerForTestingAsync();
```

On the iOS simulator background tasks do not fire on their own; use the trigger
above, or exercise the same path from **Back up now**, which runs the identical
engine call.
