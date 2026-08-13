# Changelog

All notable changes to Productively are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Nothing has shipped to a store yet, so there are no version tags. Entries are
grouped by the day the work landed, newest first. The `version` field in
`app.json` (1.4.2) is the number the app displays, not a release marker.

## [Unreleased]

### Removed

**v3, the minimal cut.** The board is `Productively v3.dc.html`. Everything
here is surface coming off, not features being added — the app opens straight
into Today, and the things that used to sit above it are gone.

- **Onboarding.** Nine screens asking for a wake time, a sleep time, intents
  and struggles before the app would show itself. The one thing it produced
  that mattered — a first routine — is part of a fresh account now, seeded in
  `freshState` rather than at the end of a flow. Without that move an unseeded
  build would have opened on an empty Today.
- **The splash screen.** 1.3 seconds of determinate progress bar over a single
  AsyncStorage read; the bar was timing its own animation. `app/index.tsx` is a
  redirect that waits for `ready` and nothing else.
- **Explore**, and with it the template library. It was the browse surface, and
  the "Start from a template" row in the add sheet went with it rather than be
  left pointing at a screen with no way back.
- **The achievements strip.** Five nodes drawing the next five days as trophies
  for a streak the headline states in words directly above it.
- **The countdown FAB**, which re-rendered every second on the one screen people
  leave open, to repeat the "in 18m" already on the upcoming routine's card.
- **The Routine / Checklist top tabs**, and the Jump-to sheet behind the grid
  button — both were navigation between two things that are now dock tabs.

### Added

- **Checklist is a page.** It takes the dock slot Explore vacated, with its own
  date line and heading. It was previously reachable only by opening Home and
  then switching away from it.
- **Customize** (`app/settings/customize.tsx`) replaces the Support rows on
  Profile: appearance, accent presets, and your saved themes.
- **Custom accents.** An accent is now either one of the four presets or a
  `#RRGGBB` the user mixed. `buildPalette` takes a colour rather than a preset
  key, so every one of the derived accent tokens works for a mixed colour with
  no special case — including the contrast repair in `deriveAccent`, which is
  why the colour you pick is not always the colour you get.
- **The colour wheel** (`app/settings/theme-wheel.tsx`). The board draws the
  ring as a CSS `conic-gradient`, which React Native has no equivalent for; it
  is 72 SVG annular sectors instead. Hue and lightness stay on separate
  controls — folding them into one is what makes a picker unusable with a
  thumb. The preview is built from the candidate's real palette, not a picture
  of a card.
- **Saved themes**, kept on the state as `customThemes` with the mode they were
  saved in, because a colour that works on paper can be muddy on ink.

### Changed

- **Filter and the view toggle hide behind the tune button.** They were a
  permanent row above the first routine; they are now a thing you ask for. The
  reveal is deliberately not persisted — a tool bar that came back three days
  later would just be chrome again.
- **Appearance keeps a "Match system" row.** The board draws a single "Dark
  theme" switch, which cannot express "follow the phone" — the setting most
  people are on. System takes precedence and the dark switch reports the
  resolved mode while it is on.
- **Rate us, Contact us, FAQs, Labs and Share** moved from Profile to Account &
  data, as the board's own footnote says.
- **Reminders are exact alarms now.** The app declares `SCHEDULE_EXACT_ALARM`.
  No scheduling code changed and none needed to: expo-notifications already
  branches on `canScheduleExactAlarms()` in its `ExpoSchedulingDelegate` and
  picks `setExactAndAllowWhileIdle` when the grant is there, degrading to
  `setAndAllowWhileIdle` when it is not — so every reminder had been quietly
  taking the batchable, Doze-delayable path.

  Declared in `app.json` only, which is the source of truth — `/android` is
  gitignored and generated. Worth knowing for anyone who hits this: adding the
  permission and running `expo run:android` does **nothing**, because run
  reuses an existing `android/` and never re-runs prebuild over it. `dumpsys`
  showed no such permission after the first attempt; `npx expo prebuild -p
  android` emits it and then the build picks it up.

  Note this is a Google Play policy surface: the exact-alarm policy restricts
  the permission to apps whose core function is an alarm clock or calendar, so
  the Play listing needs to justify it at submission.

- **Settings ▸ Routine ▸ Exact timing** opens this app's "Alarms & reminders"
  page, via `expo-intent-launcher` with a `package:` data URI — RN's
  `Linking.sendIntent` has nowhere to put one and would land on the system-wide
  list. Android revokes this grant at will and denies it by default from
  Android 14, and no module in the app exposes `canScheduleExactAlarms()` to
  JS, so the row is deliberately written as an offer rather than a status: a
  state we cannot read must not be printed as a fact.

### Fixed

**A tapped reminder starts its routine.** `syncAlarms` has always put the
`routineId` in the notification payload and nothing ever read it — no response
listener existed anywhere in the app, so the reminder told you to start and
then dropped you wherever you had last left off, to go and find it yourself.
`useReminderTaps` handles both a tap while the app is running and a cold start
where the tap launched the process, and falls back to Today when the routine
has since been deleted — a weekly reminder can outlive the routine that asked
for it by up to seven days.

**Labs can send a test reminder.** A weekly reminder is otherwise untestable
without waiting up to seven days, which is exactly how an unread `routineId`
survived this long. Same tag and payload as the real thing, five seconds out,
so tapping it exercises the real path.


**Controls that were drawn but not wired.** Found by using the release build,
not by reading it. Each of these rendered exactly as the board draws it and did
nothing when tapped, which is the failure this codebase is most prone to: a
screen that matches the picture passes every check there is.

- **The Home + sheet.** *Checklist* called `addChecklistItem('go', …)` against a
  group id no account has ever had, so it silently did nothing — and with
  `demoSeed: false` there were no groups at all. *Routine* and *Start from a
  template* both pushed to Explore, so two of the four rows led to the same
  place and there was no way to make an empty routine. *Checklist* now opens the
  list composer; *Routine* creates one at the user's wake time and opens it.
- **Checklists could only be ticked.** No create, rename, delete, or add-item —
  on a fresh install the tab was a heading over blank space. All of it works
  now, plus *untick everything*, which is the point of a reusable packing list.
  Hold an item to rename or remove it.
- **Custom tasks.** Everything a routine could contain came from `PICKER_TASKS`,
  a fixed six, under a strapline promising tasks "that fit you".
  `TaskComposer` writes one — title, length, icon — and edits an existing one.
  Reachable from the routine detail's +, its task rows, and the picker.
- **A routine's name, start time and days could not be changed.** The three
  dots in the 3.1 header were decoration. They open a real menu now: rename,
  start time, repeat days, delete. Deleting takes the routine's sessions and
  notes with it, and says so — leaving them behind would keep counting a routine
  the user can no longer see.
- **Recommended tasks on Explore** added to `routines[0]` and said nothing: on
  an account with three routines it silently picked one, on an account with none
  it was a no-op. It asks which routine, then confirms by name.
- **Both RESET cards opened the article index** — the same destination as every
  other card on the screen. They have their own content now: `app/reset/[id].tsx`
  runs 5-4-3-2-1 grounding and 4/4/6 breathing as paced sequences with a ring.
  A rescue card is tapped while it is happening; five volumes on habit design is
  the wrong thing to hand someone at that moment.
- **The checklist rows on the "Jump to" sheet** were the one row on it that did
  not jump anywhere.

### Added

**Routine reminders — "Allow alarms" is real.** 1.9 drew the button inside a
`pointerEvents: 'none'` backdrop, asked for consent to something, and the app
had no notification dependency at all.

- `src/alarms.ts` schedules a `WEEKLY` notification a configurable number of
  minutes before each routine, on each day it runs. Off by default; the switch
  is in Settings ▸ Routine as well as onboarding.
- **This is a reminder, not an alarm.** A full-screen, sound-through-silent
  alarm needs `USE_FULL_SCREEN_INTENT` and `SCHEDULE_EXACT_ALARM`, both of which
  Google reviews case by case and neither of which a routine reminder qualifies
  for. The copy on 1.9 says what it actually does.
- 1.9 is two phases now rather than one picture: the consent sheet closes onto
  the same layout, undimmed and live.
- The user's intent and the OS grant are kept separate. `settings.alarms` rides
  along in the backup and survives a reinstall; the grant is re-checked on every
  sync, because Android can revoke it without telling us.
- The schedule is rebuilt from the routines rather than kept in step by hand —
  renaming, moving a start time and dropping a weekday are three different call
  sites, and watching the data is the only version that cannot drift. Keyed on a
  signature, not on `state.routines`, because every store write clones the tree
  and ticking a checklist item would otherwise re-post the whole OS schedule.
- A lead time that crosses midnight moves to the previous weekday. Without the
  wrap, 5 minutes before a 2am routine schedules at −3 minutes, which the OS
  reads as 23:57 *the same day* — a reminder a full day late.

### Changed

- **Analysis / Note is the pill switch Home uses.** It was two 21px display
  words with a white capsule behind the live one: a bespoke control for the job
  the adjacent tab already does with `Segmented`.
- **The *Picks ✦* pill on Explore is hidden.** It had no handler, which reads as
  broken rather than unfinished. It is the one control on that screen that needs
  a model behind it; logged as "Future — AI-assisted picks" in `docs/v2-audit.md`
  with the two things that block it (nothing currently leaves the device, and
  there is no backend to hold a key).
- `Prompt` and `MenuSheet` in `src/ui.tsx`, and `onLongPress` on `Tap`. The app
  had no way to type anything a screen had not already written for it, which is
  why every create affordance was either missing or wired to a fixed string.
- Ids for user-created records come from a counter, not `Date.now()` alone. Two
  items added inside the same millisecond collided, which React renders as a
  duplicate key and a row that ticks its twin.
- **Eighteen permissions `expo-notifications` brought with it are blocked.**
  Caught by reading the release manifest, not the source. The library bundles
  ShortcutBadger, which declares a badge permission for every launcher vendor
  it supports — Samsung, HTC, Sony, Huawei, Oppo, Anddoes, Majeur,
  everything.me — plus `READ_APP_BADGE`. It also pulls in
  `com.google.android.c2dm.permission.RECEIVE` (push messaging) and Play's
  install-referrer binding. This app posts local scheduled notifications and
  nothing else: it never sets a badge (`shouldSetBadge: false`), has no push,
  and has no attribution. On a Play listing those read as capabilities the app
  claims and does not have, which is the same defect
  `SYSTEM_ALERT_WINDOW` was blocked for. All eighteen now carry
  `tools:node="remove"`.
- `android.versionCode` 1 → 2. The first release APK shipped as 1; two builds
  that differ must never share it, or a device has no way to tell which one it
  already has. `versionName` stays 1.4.2 — the board's number, and the one every
  settings footer reads.
- Text fields inside a Modal focus one frame late rather than via `autoFocus`.
  Android hands the Modal window focus *after* the child mounts, so the request
  went to an unattached view and was dropped — every dialog opened with its
  keyboard down and needed a second tap on the field. Found on device; it does
  not reproduce in a browser.

### Added

**The app has its own icon and splash screen.** All six image assets were still
the Expo template's — a blue "A" on a construction grid for the launcher, a
blank target on graph paper for the splash — and a release build was cut with
them in place.

- The artwork is the `logo` glyph from `src/icons.tsx`: three stacked rounded
  bars, the middle one at full strength because that is the line you are on. It
  is what the App icon screen has always drawn as "Default", so the icon the
  user picks in-app is now the icon they get.
- Colours are `IDENTITY.icons.default` from the token layer, not new hex.
- `scripts/make-icons.mjs` (`npm run icons`) generates all six in plain Node —
  no ImageMagick, no sharp. Shapes come off a signed distance field, so edges
  are antialiased analytically rather than by supersampling, and the PNGs are
  written by hand (IHDR/IDAT/IEND, filter 0, `deflateSync`). Committing the
  generator rather than six opaque binaries means the artwork cannot drift from
  the palette it claims to come from.
- The adaptive icon's mark sits at 60% of the 108 dp canvas, comfortably inside
  the 66 dp the launcher guarantees, so no mask clips it. The monochrome layer
  is a silhouette for Android 13+ themed icons, which recolour it to the
  wallpaper.
- **The splash is the app's tile, not the bare mark.** One asset serves both
  themes — `app.json` points light and dark at the same file — and the mark's
  top bar is 38% opacity, which over `#F4F1EA` paper is very nearly invisible.
  Carrying its own background fixes that and matches what the user just tapped.
  Proportions are `app-icon.tsx`'s exactly: r/size 0.276, glyph/size 0.62.
- Opaque canvases are written without an alpha channel, because App Review
  rejects an iOS app icon that has one. It falls out of the art rather than
  being a list of filenames to remember.
- `icon.png` went from 393 KB to 28 KB on the way.

### Changed

**Release-build correctness.** The first `assembleRelease` pass turned up four
things that were fine in development and wrong in a shipped build.

- **The sample account no longer ships.** `expo.extra.demoSeed` was `true`, so
  every real install would have opened on someone else's twelve-day streak,
  three routines they never wrote and four journal entries they never lived.
  It is `false`; flipping it back for design comparison is one line.
- **The version is read from the manifest** (`src/release.ts`) rather than typed
  out in Profile, Your data, the contact footer and the support mailto subject.
  Four literals meant a bumped release still shipped screens claiming the old
  number, and bug reports arrived stamped with a version nobody was running.
  The contact footer's hardcoded "· Android" comes from `Platform.OS` too.
- **`SYSTEM_ALERT_WINDOW` is blocked.** Nothing in the app draws over other
  apps; the permission merged in from a dependency's manifest. It reads as
  "Display over other apps" on the Play listing and invites a policy question
  for a capability that does not exist. `android.permissions` is now stated
  explicitly (`INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`) and
  `blockedPermissions` strips the rest at manifest merge.
- **`android.versionCode` is declared** rather than defaulted, so the number
  Play orders releases by is in source control next to the one users read.
- **The profile bio no longer claims thirteen days that never happened.** Found
  by walking the release build: `profile.intro` defaulted to the board's persona
  line, *"Building slowly. 13 days into the morning routine."* — true of the
  sample account and a fabricated statistic on a real install, sitting on a
  Profile screen whose every other number is derived. It ships with the demo
  now and is empty otherwise, with a "Say something about yourself" prompt in
  its place. Phase 1 caught the fake figures on the analysis screens; this one
  was hiding in the profile defaults. The footer beneath it read "0 days in ·
  Productively 1.4.2" for the same reason — a routine exists the moment
  onboarding ends, so the streak brag rendered before there was a streak.

### Removed

**There is no account, so the app has stopped pretending there is one.** The
board draws a full auth surface and none of it was wired to anything, because
there is nothing to wire it to — no backend, no server, no social, and backup is
an export file you carry yourself.

- 1.2 Welcome offered "Sign up in 10 seconds", "Start without an account" and
  "Already with us? Sign in". All three called the same function and opened the
  same carousel. It is now **Get started** and **Import a backup** — start
  fresh, or bring an old phone's history with you, which are the only two things
  that were ever really on offer. The reassurance pill said "Keeps your data
  safe"; it says "Everything stays on this phone", which is the actual promise.
- 8.2 "Account & data" is **"Your data"**. Its Email row showed
  `backup.account?.email` — the *Google Drive* address — labelled as the app
  account, or "Not signed in" when there was no such thing to be signed into.
- **"Sign out" is gone.** It called `reset()`: a full local wipe, no
  confirmation, sitting directly above a "Delete account" that confirmed before
  doing the same thing. "Delete account" is now **"Delete everything"**, and is
  the only destructive action on the screen.
- Profile's "Account" group is "Your data"; its row is "Data & storage".
- The one sign-in left is Google's, on the Drive backup screen, and its group is
  now titled "Google account" so it cannot be mistaken for ours.

### Added

- **1.2 has its hero photo.** `assets/main-hero-bg.png` replaces the drawn
  placeholder slot the board leaves empty. It sits *over* the `G.welcome`
  gradient at 50% opacity rather than replacing it, so the warm tint still runs
  through the room and the screen stays on-palette if the asset is swapped.

### Fixed

- **The segmented control's selected tab rendered as a hard white rectangle
  inside its own perfectly round track** on Android — Routine/Checklist,
  Analysis/Note, everywhere `Segmented` is used. The chip was the one surface
  carrying a *pill* radius (999, far larger than the view) together with a
  `boxShadow` and no border, and Android paints that background square. It now
  uses `rowSkin()` like every other elevated surface, and the hairline border is
  what makes the radius stick. The knob in `Toggle` and the interior of `Dial`
  are borderless too, but their radius is exactly half their size, so they were
  never affected.
- **Onboarding ends at 1.10.** "You're all set to flow" is terminal language, and
  its **Get started** pushed to *another* setup-looking screen. It now completes
  setup and goes to Home. Completion moved into `finishOnboarding()` in the
  store — the last step of onboarding should not depend on which screen happens
  to be last. 1.11 stays in the tree and still works; putting it back is one
  line in `streak.tsx`.
- **Onboarding created no routine on a build without the sample account.**
  1.11's `finish()` retimed the earliest existing routine; with `demoSeed` off
  there is no existing routine, so a real user was walked through "we've
  prepared your first routine", tapped Done, and landed on an empty Home with
  nothing to run. It now creates the routine it just showed you.
- **1.11's reorder and remove were discarded on Done.** The coach mark invites
  you to "reorder or remove anything that doesn't fit"; the edits lived in local
  state and `finish()` never read them. They persist now. 1.11 also seeds its
  rows from the routine that will actually run earliest, so with the sample
  account seeded you are editing that routine rather than a three-task template
  attached to nothing.
- **1.9's alarm-permission capsule had no label**, so the dimmed backdrop behind
  the consent sheet read as a greyed-out broken button. It says "Allow alarms".
  It is still deliberately inert — the board draws this screen dimmed behind the
  sheet — and the app still schedules no alarms at all.

### Changed

**The history is real.** Every number the app claimed about the user was a
frozen constant — a week grid, a 30-day chart, a "where the time goes" table, a
`streak` and a `rate` stored on each routine — while `finishRun` quietly
recorded genuine sessions beside them. Nothing on the analysis screens could
ever move. It all derives from `state.sessions` now, in one place
(`src/analytics.ts`), checked by `npm run check:analytics` in plain Node.

- **One definition of a streak**, counted back over scheduled days. There were
  three: Home added one to a seeded field, Analysis took the maximum and added
  one unconditionally, Complete added one to Home's. None of them read history,
  so no streak could grow past its seed or ever break. Unscheduled days are
  skipped rather than counted as misses, so a Mon–Fri routine survives Saturday,
  and today is never a miss — a morning routine does not read 0% at 7am.
- Completion, the week grid, the 30-day chart and the per-task averages are
  computed. "up 8 points on last week" was a string literal; the delta is now
  measured, and withheld entirely when last week ended before the first session
  ever recorded, so a fresh install cannot announce it is up on a week when it
  did not exist.
- The per-routine insight reads the user's own overruns and needs three runs of
  the same task before it will advise anything. It was one sentence about
  Morning pages, shown for every routine.
- Sessions carry per-task timings (`taskSpent`), which is what makes "where the
  time goes" possible. Runs recorded before this contribute nothing rather than
  averaging in a zero.
- Session days are the device's local calendar day. They were
  `toISOString().slice(0, 10)` — UTC — so a 9:30pm Wind down west of Greenwich
  filed itself under tomorrow, and the run that extended a streak broke it.
- `tierFor(0)` fell through to the *last* momentum tier, so a new account drew
  its streak rail as "0 · 1 · 🏆 · 22 · 23". Clamped at both ends.
- The overrun flag on "where the time goes" is judged on the figure the row
  prints, not the raw seconds behind it. A 3m task averaging 3m10s read
  "3m avg" in red — a row arguing with its own colour. Three of the seven
  morning tasks looked flagged for going over a plan they matched.

**The sample account is opt-in.** It seeded on every install with no marker
saying so, and its ids collided with restores — a merge that "adds only ids this
device has never seen" skipped a restored `morning` routine because the seed had
claimed that id. It now generates from `src/demo.ts` behind
`expo.extra.demoSeed`, writes real sessions with real timings so the charts
agree with the notes, and prefixes every id with `demo-`. A build with the flag
off starts genuinely empty.

**Social is gone.** The feed, the friends list, the story card and the nudge
button were constants over a feature with no account system, no server and no
way to become real, occupying one of five dock tabs. The dock is four tabs.

**Fixed on Windows**: `check-contrast` and `check-backup` spawned `npx`, which
`execFileSync` cannot resolve to `npx.cmd`, so the check suite died before
compiling anything; `check-tokens` compared native paths against a POSIX
allow-list and reported the token layer as 106 violations of its own rule.

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
