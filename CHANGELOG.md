# Changelog

All notable changes to Productively are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Nothing has shipped to a store yet, so there are no version tags. Entries are
grouped by the day the work landed, newest first. The `version` field in
`app.json` (1.4.2) is the number the app displays, not a release marker.

## [Unreleased]

### Added

**Data export and Google Drive backup.**

- Export any time to a versioned JSON archive — routines, tasks, sessions,
  notes, checklists, profile and settings — handed to the system share sheet.
  The envelope carries a SHA-256 checksum over a canonicalised payload, so a
  file that has been edited since it was written is detected and flagged
  before a restore, not after.
- Import the same file back, with a choice of **replace** (the backup wins) or
  **merge** (keep everything local, add only ids this device has never seen).
  Pre-envelope exports written by the old "Export my data" button are still
  recognised and read.
- Google Drive sync into `appDataFolder`, Drive's hidden per-app space: the
  only scope requested is `drive.appdata`, which gives no access to anything
  the user actually keeps in Drive. OAuth is PKCE via `expo-auth-session`, with
  the refresh token held in the Keychain / Keystore rather than AsyncStorage.
- Schedule controls in the WhatsApp mould — connect an account, frequency
  (Only when I tap / Daily / Weekly / Monthly), back up over Wi-Fi or cellular,
  and an *Include journal notes* opt-out. A backup that skipped notes will not
  delete them on restore.
- A rolling window of the five most recent backups, pruned only after a
  successful upload, and a 30-minute backoff after a failure so a broken
  account cannot spin.
- Unattended runs from two directions: an `expo-background-task` wake-up
  roughly twice a day, and a catch-up whenever the app returns to the
  foreground. The OS decides whether the former happens; the latter is the
  guarantee.
- Restore entry points at Settings ▸ Backup, Profile ▸ Account & data, and a
  *Restore from a backup* link on the onboarding welcome screen, for a phone
  that has just been set up.
- `npm run check:backup` — the merge/replace fold, the schedule gate, the
  settings repair and the label helpers run in plain Node, so the logic where a
  bug costs someone their data is exercised outside a device.
- New `cloud`, `cloudUp`, `cloudDown`, `download`, `trash` and `refresh` icons.

**v2 visual refresh** — every screen across all 9 flows, plus a theming system.

- A token layer (`src/tokens.ts`) that derives a whole accent family from one
  base colour: hue shift, saturation ratio and lightness re-anchored against
  the reference ramp, with on-accent foreground chosen by measured contrast.
- Four accent presets — Ember, Sky, Moss, Orchid — switchable at runtime, with
  a matching app-icon offer, persisted with the account.
- A dark theme, and Light / Dark / System selection.
- Two-layer elevation via React Native's `boxShadow`, progress rings with
  rounded caps at 280 / 196 / 106, a floating pill dock, and the full v2
  primitive set (cards, buttons, toggles, sheets, dialogs, wheel pickers).
- `npm run check:contrast` — text ≥4.5:1 and glyphs ≥3:1 verified for every
  preset in both themes. `npm run check:tokens` — no raw hex outside the token
  layer, no legacy `shadow*` props, no module-scope style object freezing a
  token at import time.

### Changed

- Account & data now reports the real archive: actual routine, task, note and
  session counts, real byte size, and the true last-backup time, replacing the
  fixed "146 days of history / 2.4 MB / 2 minutes ago" from the mock-up.
- The `backupOn` boolean in settings became a `backup` object (enabled,
  frequency, network, includeNotes). Existing caches are migrated on hydration.
- The ink ramp inverts to bone in dark mode, so primary buttons, the active
  dock tab and toggles stay legible on the dark paper.

### Fixed

- `boxShadow` combined with `overflow: 'hidden'` on one view silently drops the
  corner radius on iOS — every primary button was rendering square.
- The info chip's `#3C72C8` on `#E9F0FB` measured 4.13:1, below AA. Darkened
  until it clears 4.5:1, hue untouched.
- A temporal dead zone crash in the app-icon list, which TypeScript did not
  catch because the reference was type-correct.
- `pointerEvents` moved from a JSX prop into `style`, deprecated in React
  Native 0.86.

## 2026-08-09

### Added

- Initial implementation: 54 screens across onboarding, home, routines, the
  run timer, explore, social, analysis, profile and settings, on Expo SDK 57 /
  React Native 0.86 with expo-router, an AsyncStorage-backed store, and a
  hand-drawn SVG icon set.

### Fixed

- Android build configuration for device deployment: removed
  `edgeToEdgeEnabled` (rejected under Android 16, where it is now mandatory),
  added `expo-system-ui` so `userInterfaceStyle` is enforced, and added an
  `.npmrc` with `legacy-peer-deps` for the expo-router → Radix → React 19
  peer conflict.
