# Productively

Routine tracking & productivity for Android, built from the Claude Design screen
board `Productively.dc.html` (Nothing Phone (1), 412 × 916).

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
  (tabs)/                  the five-icon bottom bar
    home.tsx               2.1 routines · 2.2 checklist · 2.3 timeline · 2.4 add sheet
    explore.tsx            5.1
    social.tsx             6.1 feed · 6.2 friends
    analysis.tsx           4.1 summary · 4.2 per-routine · 4.3 rings · 4.4 notes
    profile.tsx            7.1
  routine/[id].tsx         3.1 routine detail
  run/[id].tsx             3.2 settle · 3.3 timer · 3.4 overrun · 3.5 complete
  template/[id].tsx        5.2
  task-picker.tsx          5.3
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
  data.ts                  seed content and formatting helpers
  store.tsx                app state over AsyncStorage
  components/              TaskRow, HomeParts, WheelSheet, OnboardingChrome
```

## Notes on the build

- **State is real.** Completing a run writes a session, bumps the streak, and
  feeds the summary, notes and week grid. Checklists, reordering, template
  installs, task picking, friend nudges and every settings switch persist.
- **Seeded, not empty.** First launch loads the account the board describes —
  a 13-day run, three routines, two checklists, four notes, four friends.
- **Dials, not conic gradients.** The board's `conic-gradient` timers are drawn
  as SVG arcs (`Dial` in `src/ui.tsx`), including the overrun state.
- **Settings drive the screens.** The Home-screen and Timer preference pages
  render live previews, and their switches change what Home and the running
  timer actually show.
- **Two interpretations.** The board draws a grid button top-left of Home
  without a destination — it opens a "Jump to" sheet over the user's routines
  and checklists. Labs is a row on Profile with no screen drawn; it holds the
  two experimental toggles.
- Deliberately out of scope, matching the board's closing note: the full
  routine editor (alarm rules), a dark pass, widget/lock-screen surfaces, and
  brand-new-account empty states.
