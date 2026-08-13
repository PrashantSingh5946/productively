# Productively

Routine tracking & productivity for Android, built from the Claude Design screen
board **`Productively v2.dc.html`** (Nothing Phone (1), 412 × 916) — 42 screens
across 9 flows. `docs/v2-audit.md` is the screen-by-screen diff between that
board and this code, and the plan for closing what is left.

Persimmon accent on warm-stone ink, sand-tinted cards, Bricolage Grotesque over
Instrument Sans, and a hand-drawn flat icon set — 57 glyphs, no emoji anywhere.
Free throughout: no plans, paywalls, locked layouts or ad slots.

## Run it

```bash
npx expo run:android
```

Or `npx expo start` and open in Expo Go / a dev client.

## Layout

```
app/                       expo-router file routes
  index.tsx                1.1  splash → onboarding or tabs
  onboarding/              1.2 – 1.11
  (tabs)/                  the floating dock — four tabs, not the board's five
    home.tsx               2.1 routines · 2.2 checklist · 2.3 timeline · 2.4 add sheet
    explore.tsx            5.1
    analysis.tsx           4.1 summary · 4.2 per-routine · 4.3 rings · 4.4 notes
    profile.tsx            7.1
  routine/[id].tsx         3.1 routine detail
  run/[id].tsx             3.2 settle · 3.3 timer · 3.4 overrun · 3.5 complete
  template/[id].tsx        5.2
  task-picker.tsx          5.3
  reset/[id].tsx           the paced exercise behind Explore's RESET cards
  profile/edit.tsx         7.2
  settings/                7.3 index · 7.5–7.6 home-screen · 7.7 timer · 7.8 app-icon
  free.tsx                 8.1
  account/index.tsx        8.2
  guide/                   9.1 index · 9.2 article
  contact.tsx              9.3
  labs.tsx                 reached from Profile

src/
  theme.ts                 colour, gradient, type and radius tokens
  icons.tsx                the icon set + the five mood faces
  ui.tsx                   T, Grad, Card, Button, Dial, Toggle, Segmented, Sheet, …
  data.ts                  the library, the guide, onboarding copy, shapes
  analytics.ts             every claim about the user's history, from sessions
  alarms.ts                routine reminders — permission, schedule, teardown
  demo.ts                  the sample account, behind expo.extra.demoSeed
  store.tsx                app state over AsyncStorage
  components/              TaskRow, HomeParts, WheelSheet, OnboardingChrome
```

## Notes on the build

- **The numbers are derived, not stored.** Streaks, completion, the week grid,
  the 30-day chart and the per-task averages all come out of `state.sessions`
  via `src/analytics.ts` — nothing holds a pre-computed figure. A streak counts
  back over *scheduled* days, so a weekday routine survives the weekend, and
  today is never counted as a miss. `npm run check:analytics` exercises it in
  plain Node.
- **The icon and splash are generated, not drawn.** `npm run icons` writes all
  six assets from the `logo` glyph in `src/icons.tsx` and
  `IDENTITY.icons.default` in the token layer — the same mark and colours the
  App icon screen shows as "Default". Plain Node, no image tooling: shapes are
  rasterised off a signed distance field and the PNGs are written by hand. Run
  it after changing either source; the artwork cannot drift from the palette it
  claims to come from.
- **The sample account is opt-in, and off by default.** `expo.extra.demoSeed`
  in `app.json` decides whether first launch generates the lived-in phone the
  board draws — twelve days of real sessions with real per-task timings, so the
  charts agree with the notes. It ships `false`, because a release build must
  not open on someone else's streak; set it `true` to compare screens against
  the board. Every seeded id is prefixed `demo-` so a restore can tell them
  apart.
- **No Social tab.** The board draws a feed and a friends list; both were
  static mock-ups of a feature that needs an account system and a server. The
  dock is Home · Explore · Stats · Profile.
- **No account.** No sign-up, no sign-in, no sign-out. Nothing leaves the phone
  unless you export it or connect Drive, so there is nothing for an account to
  hold. Welcome offers *Get started* or *Import a backup*; 8.2 is "Your data".
  The only sign-in in the app is Google's, on the backup screen.
- **Google Drive sync is off until you supply credentials.** `expo.extra
  .googleDrive` ships `REPLACE_WITH_*` placeholders, so `isDriveConfigured()` is
  false and the backup screen says "Not set up" rather than failing at you.
  Export and import to a file do not depend on it and work regardless. To turn
  sync on you need all three of:
  1. An **Android OAuth client** in Google Cloud registered against package
     `com.productively.app` and the SHA-1 of the keystore that signs your build
     (for a local debug build that is `~/.android/debug.keystore`, password
     `android` — `keytool -list -v -keystore ...`).
  2. That client id in `expo.extra.googleDrive.androidClientId`.
  3. The **reversed** client id added to `expo.scheme`, e.g.
     `"scheme": ["productively", "com.googleusercontent.apps.<id>"]`. Without it
     Google's redirect has nowhere to land and the consent screen returns to
     nothing.

  All three are native config: they are baked into the APK at build time, so a
  Metro reload will not pick them up — rebuild.
- **Dials, not conic gradients.** The board's `conic-gradient` timers are drawn
  as SVG arcs (`Dial` in `src/ui.tsx`), including the overrun state.
- **Settings drive the screens.** The Home-screen and Timer preference pages
  render live previews, and their switches change what Home and the running
  timer actually show.
- **Reminders, not alarms.** `src/alarms.ts` posts a notification a configurable
  number of minutes before each routine, repeating weekly on the days it runs.
  A full-screen, sound-through-silent alarm would need `USE_FULL_SCREEN_INTENT`
  and `SCHEDULE_EXACT_ALARM`, which Google reviews case by case and a routine
  reminder does not qualify for. The whole OS schedule is rebuilt from the
  routines whenever a name, start time, weekday or task count changes — never
  patched — so a renamed routine cannot leave a stale 6am reminder behind. Off
  until the user says yes *and* Android grants it; the two are tracked
  separately, because Android can withdraw the grant without telling the app.
- **Two interpretations.** The board draws a grid button top-left of Home
  without a destination — it opens a "Jump to" sheet over the user's routines
  and checklists. Labs is a row on Profile with no screen drawn; it holds the
  two experimental toggles.
- Deliberately out of scope, matching the board's closing note: the full
  routine editor (alarm rules), a dark pass, widget/lock-screen surfaces, and
  brand-new-account empty states.
