# Productively — beta build

A signed release APK you can send to testers directly. No Play Store, no
account, no Firebase.

## Which file to send

Both are `dist/`, both are version 1.5.0 (versionCode 3), both are signed with
the same key — so a tester can move between them without uninstalling.

| File | Size | Use it for |
|---|---|---|
| `Productively-1.5.0.apk` | 58 MB | **Send this one.** Every real phone — arm64 and 32-bit arm. |
| `Productively-1.5.0-universal.apk` | 101 MB | Only if someone runs an x86 emulator. |

The difference is the emulator ABIs (`x86`, `x86_64`), which are 43 MB of native
libraries no phone will ever load.

Requires **Android 7.0 (API 24)** or newer; targets API 36.

## Installing

1. Send them the APK (email, Drive, Signal, anything).
2. On the phone, opening it will prompt to allow installs from that app —
   Android 8+ asks per source, so they grant it to whichever app they opened the
   file from.
3. Install. If Play Protect warns that the app is from an unknown developer,
   that is expected for a sideloaded build; **More details → Install anyway**.

Updates install over the top as long as every build is signed with the same
keystore, which is the one at `~/keystores/productively-release.jks`. **Do not
lose that file.** A different key means testers have to uninstall and lose their
data, and it means the Play listing can never be updated from this key later.

## What testers should know

- **Everything is local.** No account, no server, nothing leaves the phone.
  Backup writes a JSON file they choose the location of.
- **Google Drive sync is not in this build.** The Backup screen says so
  honestly. Export to a file works.
- **Notifications need permission.** Turn on Settings → Reminders. Android 13+
  will ask once.
- **The GitHub links do not work yet** — "Star on GitHub", every Contact row,
  and the privacy-policy link all point at a repository that is still private.
  They 404 until it is made public.
- **Feedback has nowhere to go in-app** for the same reason. Ask testers to send
  it to you directly for now.

## Reporting a problem

Useful things to ask for: what screen, what they tapped, what happened instead,
and the version from the bottom of Profile (`Productively 1.5.0`). Data can be
exported from Account → Export my data if a bug needs their actual state to
reproduce.

## Rebuilding

```bash
cd android && ANDROID_HOME=~/Library/Android/sdk ./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/`. Signing comes from
four Gradle properties in `~/.gradle/gradle.properties`
(`PRODUCTIVELY_STORE_FILE`, `_STORE_PASSWORD`, `_KEY_ALIAS`, `_KEY_PASSWORD`);
without them the build silently falls back to the debug key, so check the
signature before shipping:

```bash
~/Library/Android/sdk/build-tools/36.0.0/apksigner verify --print-certs <apk>
```

Bump `expo.version` and `expo.android.versionCode` in `app.json` for each build
you hand out, so testers can tell them apart.
