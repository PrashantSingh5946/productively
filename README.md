<div align="center">

<img src="assets/icon.png" width="96" alt="Productively" />

# Productively

**A routine and habit tracker that keeps your data on your phone.**

No account. No ads. No paywalls. No analytics. Nothing leaves the device
unless you export it or connect your own Google Drive.

[![License: MIT](https://img.shields.io/badge/License-MIT-FF8A5B.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Android-7.0%2B-FF8A5B.svg)](#install)
[![Built with Expo](https://img.shields.io/badge/Expo-SDK%2057-FF8A5B.svg)](https://expo.dev)

[Website](https://productively-website.vercel.app) · [Download](#install) · [Features](#what-it-does) · [Build from source](#build-from-source) · [Privacy](PRIVACY.md)

</div>

---

## What it does

**Routines.** Build a morning or evening routine out of timed tasks, give it a
start time and the days it repeats, then run it. Running is a real flow, not a
checklist: a settle screen, a per-task timer with an SVG dial, an overrun state
when a task runs long, and a completion summary that gets written to history.

**Checklists.** Reusable lists that survive being used — a packing list you tick
through, then untick in one tap for the next trip.

**Statistics that are actually derived.** Streaks, completion rates, the week
grid, the 30-day chart and per-task averages are all computed from your session
history at read time. Nothing stores a pre-computed number, so nothing can drift
out of agreement with the underlying record. A streak counts back over
*scheduled* days, so a weekday routine survives the weekend, and today is never
counted as a miss.

**Reminders.** An optional notification a configurable number of minutes before
each routine, repeating weekly on the days it runs. Off until you say yes *and*
Android grants the permission — the two are tracked separately, because Android
can withdraw the grant without telling the app.

**Guided resets.** Two paced rescue exercises — 5‑4‑3‑2‑1 grounding and 4/4/6
breathing — that run as timed sequences with a ring, rather than as articles
about themselves.

**Journal.** Notes with a mood, tied to the day they were written.

**Yours to look at.** Four accent presets (Ember, Sky, Moss, Orchid) *or* any
colour you like — a colour wheel built from SVG annular sectors, since React
Native has no conic gradient — with themes you can save and reuse. Light, dark,
or follow the phone. Ten app icons, and preference screens for the home screen
and the timer that render a live preview of what you're changing.

**Your data, portable.** Export everything to a single JSON file and import it
back on any device. Optionally connect Google Drive for scheduled backups, with
restore, retention and a Wi‑Fi‑only setting — modelled on WhatsApp's chat backup.

## Privacy

Productively has no account system, no server, and no analytics. There is no
sign-up, no sign-in, and no telemetry of any kind.

Your routines, sessions and notes live in on-device storage. They leave the
phone in exactly two cases, both of which you start:

1. You **export** a backup file and choose where to share or save it.
2. You **connect Google Drive**, after which backups are written to the
   [`appDataFolder`](https://developers.google.com/workspace/drive/api/guides/appdata) —
   a hidden per-app space in *your own* Drive that no other app, including any
   of mine, can read.

The Drive integration requests the narrowest scope Google offers for this
(`drive.appdata`) and cannot see the rest of your Drive. Full detail in
[PRIVACY.md](PRIVACY.md).

## Install

### From a release

Grab the APK from the [latest release](https://github.com/PrashantSingh5946/productively/releases/latest)
and install it. Android will warn you about installing outside the Play Store —
that's expected for a sideloaded build.

The release APK is signed with a release key; verify it if you like:

```bash
apksigner verify --print-certs Productively-1.5.0.apk
```

Two builds are attached to each release:

| File | Size | Use |
|---|---|---|
| `Productively-1.5.0.apk` | ~58 MB | **Send this to testers.** arm64-v8a + armeabi-v7a — every phone sold in the last decade. |
| `Productively-1.5.0-universal.apk` | ~101 MB | Adds x86/x86_64. Only needed for an emulator. |

### From Play Store

Not there yet.

## Build from source

Requires Node 20+, a JDK 17+, and the Android SDK.

```bash
git clone https://github.com/PrashantSingh5946/productively.git
cd productively
npm install
npx expo run:android
```

Or `npx expo start` and open it in Expo Go or a dev client.

To build a release APK:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
```

Without a keystore configured this falls back to the debug key exactly as the
Expo template does — the APK installs fine, it just isn't publishable. See
[`plugins/withReleaseSigning.js`](plugins/withReleaseSigning.js) for the four
Gradle properties that switch it to a real key.

### Turning on Google Drive sync

Drive is inert in a stock clone: `app.json` ships `REPLACE_WITH_*` placeholders,
so `isDriveConfigured()` is false and the backup screen reads "Not set up"
rather than failing at you. Export and import to a file work regardless.

To enable it you need all three of:

1. An **Android OAuth client** in Google Cloud, registered against package
   `com.productively.app` and the SHA‑1 of the keystore signing your build. For
   a debug build that's `~/.android/debug.keystore`, password `android`.
2. That client id in `expo.extra.googleDrive.androidClientId`.
3. The **reversed** client id added to `expo.scheme`:
   `"scheme": ["productively", "com.googleusercontent.apps.<id>"]`. Without it
   Google's redirect has nowhere to land and the consent screen returns to
   nothing.

All three are native config, baked into the APK at build time — a Metro reload
will not pick them up. Rebuild. Full walkthrough in
[`docs/google-drive-backup.md`](docs/google-drive-backup.md).

## Project layout

```
app/                       expo-router file routes
  index.tsx                waits for the store, then opens Today
  (tabs)/                  the floating dock — Today · Checklist · Stats · Profile
  routine/[id].tsx         routine detail
  run/[id].tsx             settle · timer · overrun · complete
  reset/[id].tsx           the paced grounding and breathing sequences
  settings/                index · customize · theme-wheel · timer · app-icon · backup
  guide/                   the library index and articles

src/
  theme.ts                 colour, gradient, type and radius tokens
  icons.tsx                the icon set + the five mood faces
  ui.tsx                   T, Grad, Card, Button, Dial, Toggle, Segmented, Sheet, …
  data.ts                  the library, the guide, onboarding copy, shapes
  analytics.ts             every claim about the user's history, from sessions
  alarms.ts                routine reminders — permission, schedule, teardown
  store.tsx                app state over AsyncStorage
  backup/                  archive format, Drive client, scheduling engine
  components/
plugins/
  withReleaseSigning.js    real keystore for release builds, survives prebuild
```

## Checks

```bash
npm run check
```

Runs four gates: TypeScript, colour contrast across every accent in both themes,
design-token usage, and two plain-Node suites that exercise the logic where a
bug costs someone their data — [`scripts/check-backup.mjs`](scripts/check-backup.mjs)
(merge collisions, omitted parts, checksum stability, schedule boundaries) and
[`scripts/check-analytics.mjs`](scripts/check-analytics.mjs) (streaks, rates,
scheduled-day arithmetic).

Type-checking proves the shapes line up. It says nothing about whether a merge
loses a routine, which is why those two run separately.

## Notes on the build

- **The icon and splash are generated, not drawn.** `npm run icons` writes all
  six assets from the `logo` glyph in `src/icons.tsx` and the token layer — the
  same mark and colours the App icon screen shows as "Default". Plain Node, no
  image tooling: shapes are rasterised off a signed distance field and the PNGs
  are written by hand. The artwork cannot drift from the palette it claims to
  come from.
- **The sample account is opt-in and off by default.** `expo.extra.demoSeed`
  decides whether first launch generates a lived-in phone — twelve days of real
  sessions with real per-task timings, so the charts agree with the notes. It
  ships `false`, because a release build must not open on someone else's streak.
  Every seeded id is prefixed `demo-` so a restore can tell them apart.
- **Reminders, not alarms.** A full-screen, sound-through-silent alarm needs
  `USE_FULL_SCREEN_INTENT` and `SCHEDULE_EXACT_ALARM`, which Google reviews case
  by case and a routine reminder does not qualify for. The whole OS schedule is
  rebuilt from the routines whenever a name, start time, weekday or task count
  changes — never patched — so a renamed routine cannot leave a stale 6am
  reminder behind.
- **Dials, not conic gradients.** The timers are SVG arcs (`Dial` in
  `src/ui.tsx`), including the overrun state.
- **No account, by design.** Nothing leaves the phone unless you export it or
  connect Drive, so there is nothing for an account to hold.

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md)
for how the checks are wired and what a change is expected to keep working.

## License

[MIT](LICENSE) © 2026 Prashant Singh
