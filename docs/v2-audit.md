# Productively v2 — screen audit & alignment plan

Audit date: 2026-08-10. Board: `Productively v2.dc.html` (Claude Design project
`2eb8170b-c6c1-4c80-88df-6b1cdcf01440`, "Routine tracking app design"), 42 screens
across 9 flows. Code audited at `main` @ `de5098c`.

> **Status — Phase 1 landed 2026-08-10.** The history is derived
> (`src/analytics.ts`, `npm run check:analytics`), the sample account is behind
> `expo.extra.demoSeed` (`src/demo.ts`), and Social is removed. Systemic items
> 2, 3, 4 and 5 below are closed; the rest stand. Screen-level deltas in the
> per-flow tables are Phase 3 and are **not** done.
>
> Verified on `emulator-5556` after a clean install: onboarding through to Home,
> the routine list, the momentum card, the week grid, the 30-day chart, "where
> the time goes" and the derived insight all read from generated sessions.
>
> Decisions taken with the project owner: the board wins on layout, type and
> copy, but not on whether a capability exists; the sample account stays but is
> opt-in; Social is cut rather than faked; **sign-up and sign-in are cut** — the
> app has no backend to hold an account (systemic 13).

## How this was checked

- The board was pulled through the design MCP and split into a per-screen content
  inventory (copy, icon set, structure) for all 42 screens.
- Every screen file under `app/` was read, plus `src/theme.ts`, `src/tokens.ts`,
  `src/components/HomeParts.tsx`, and the store's streak/session logic.
- The app was built and run on the `Medium_Phone` emulator (Expo SDK 57, RN 0.86,
  new architecture). Only **1.2 Welcome** was compared visually on device; every
  other screen was compared by reading the source against the board, not by
  looking at it. Pixel-level drift on the other 41 is therefore *not* covered.
- The board file is capped at 256 KiB by the API; the tail of **9.3 Contact us**
  (part of its topic list) was truncated and could not be verified.

## Verdict

The v2 refresh is real and largely faithful. The token layer (`src/tokens.ts`)
is better engineering than the board asks for — one base colour derives the whole
accent family with measured contrast, and the three `npm run check:*` scripts
guard it. Structure, copy and iconography match the board on the large majority
of screens.

The problems are not visual. They are:

1. **No pinned source of truth** — the repo contains neither board, and the README
   still names the v1 board.
2. **Mock data dressed as computed data** — the entire Analysis flow reads frozen
   arrays while the app records real sessions next to them.
3. **Three different definitions of "streak"** across Home, Analysis and Complete.
4. **A whole fictional feature** (Social) with no backend and no marker saying so.
5. **Two surfaces with no design authority at all** — dark mode and the 3
   non-Ember accents exist in code, in neither board.

Legend: **OK** matches the board · **drift** implemented but diverges ·
**mock** renders static data as if computed · **gap** board element absent.

---

## Flow 01 — Onboarding & first routine

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 1.1 | Splash | `app/index.tsx` | drift | Board draws the logo tile, the **"Productively" wordmark**, then the progress bar. The app drops the wordmark. Bar is 190×5 vs board 180×4. |
| 1.2 | Welcome / sign in | `app/onboarding/welcome.tsx` | **deliberate** | Verified on device. Auth **removed** — see systemic 13. Two CTAs now: **Get started** and **Import a backup**. The board's "Sign up in 10 seconds" / "Start without an account" / "Sign in" all called the same function. The board's empty photo slot is filled by `assets/main-hero-bg.png`, full-bleed under both safe-area insets, at 50% over `G.welcome`. |
| 1.3 | Value carousel 1 | `app/onboarding/carousel.tsx` | OK | Same card, same four tasks, same play pill. Board background is flat `#f4f1ea`; app uses the `G.dawn` gradient. |
| 1.4 | Value carousel 2 | `app/onboarding/carousel.tsx` | OK | Dial at 196 with rounded caps as specified. Board's inactive dot is `rgba(ink,.1)`; app uses `C.stoneDeep`. |
| 1.5 | Intent (multi-select) | `app/onboarding/intent.tsx` | OK | Six intents, tinted selected state, Skip + Next. Board renders the selected check as an accent-filled coin; app's `CheckCoin` matches. |
| 1.6 | Struggles | `app/onboarding/struggles.tsx` | OK | Six statements, Next disabled until one is picked (board draws the disabled state). |
| 1.7 | Wake time | `app/onboarding/wake.tsx` | OK | Three wheels + sun glyph. Minutes are `00/15/30/45`; the board's minute column reads `00 00 00 01 02`, which is a wheel-rendering artefact of the board, not a spec. |
| 1.8 | Sleep time | `app/onboarding/sleep.tsx` | OK | Mirror of 1.7 with the moon glyph. |
| 1.9 | Permissions + consent | `app/onboarding/permissions.tsx` | OK | Dimmed alarm-permission backdrop under a sheet; "over 16" gates Continue. The alarm permission is **decorative** — nothing requests a real Android permission. |
| 1.10 | Streak started | `app/onboarding/streak.tsx` | OK | "You're all set to flow", 150px filled star, "1 day streak". |
| 1.11 | First routine prepared | `app/onboarding/first-routine.tsx` | drift | The **"BUILT FOR YOU"** overline is missing, and the CTA is **"Done at 8:07am"** where the board says **"Start — done by 8:07am"** — see systemic 16, which is why this screen reads as a redundant step after 1.10. Tasks are reorderable/removable and the edits now **persist** (they were discarded), and the routine is now **created** on a build with no sample account (it was not). |

## Flow 02 — Home

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 2.1 | Routines list | `app/(tabs)/home.tsx` → `ListView` | drift | Header, greeting, filter pill, list/clock toggle and routine cards all match. **The streak rail's encoding differs**: the board reads *completed (accent + check) → current day (ink) → trophy (tint) → future (grey)*; `StreakRail` renders *current (accent) → next (tint) → trophy (stone) → two grey*. Different story, same furniture. |
| 2.2 | Checklist tab | `app/(tabs)/home.tsx` → `ChecklistView` | drift | Collapsible groups with `done/total` counts, matching. The app adds an overline **"Checklists"**; the board keeps the `FRIDAY, AUG 7` date overline on this tab too. |
| 2.3 | Timeline view | `app/(tabs)/home.tsx` → `TimelineView` + `HomeParts.Timeline` | drift | Thinnest screen in the app relative to the board. Board shows each block with a **per-task time window** (`8:00am – 8:02am`, `9:20 – 10:02am`) and two parallel blocks in the 09:00 row. App renders block name + total minutes and up to 3 bare task titles, single column. |
| 2.4 | New routine sheet | `app/(tabs)/home.tsx` → `AddSheet` | drift | Four options, correct copy. But **"Checklist" doesn't open anything** — it calls `addChecklistItem('go', 'New checklist item')`, appending a hardcoded item to a hardcoded group id, then closes. "Routine" and "Start from a template" both route to Explore, so two of four rows are the same destination. |
| — | Jump-to sheet | `app/(tabs)/home.tsx` → `JumpSheet` | invention | Behind the grid button, which the board draws without a destination. Documented in the README. Checklist rows in it are not tappable. |

## Flow 03 — Running a routine

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 3.1 | Routine detail | `app/routine/[id].tsx` | drift | Streak + days pills, numbered task rows, add-task FAB — all correct. Same CTA rename as 1.11: **"Done at 8:34am"** vs board **"Start — done by 8:34am"**. |
| 3.2 | Start settle | `app/run/[id].tsx` → `Settle` | drift | The largest single-screen divergence. Board: routine name, **"7 tasks · 34 minutes"**, one breathing ring reading "Inhale / 4 seconds", and the line "Three slow breaths, then we start with a glass of water." App: heading **"Settle in"**, **"Round 1 of 3"**, no routine identity at all, and it auto-starts after 9 phases (~36s). |
| 3.3 | Timer running | `app/run/[id].tsx` → `Running` | OK | 280 dial, task-tone icon chip, `– 2m +` nudge, pause/check/skip triad, NEXT strip. Faithful. |
| 3.4 | Timer overrun | `app/run/[id].tsx` → `Running` (over) | OK | `+02:11`, "over by 2 minutes", warm dawn backdrop, tinted NEXT strip. Faithful. |
| 3.5 | Complete review | `app/run/[id].tsx` → `Complete` | drift | Three stat cards, mood row, note panel, Done — all correct and all computed from the run **except the third stat**, "This week / on average", which prints `routine.rate` — a frozen seed number (see Systemic §2). |

## Flow 04 — Analysis & streaks

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 4.1 | Analysis summary | `app/(tabs)/analysis.tsx` → `Summary` | mock | Layout matches. Data does not: the week grid is the constant `WEEK_GRID`, the headline percentage averages frozen `routine.rate` values, and **"completed · up 8 points on last week" is a literal string** — the "up 8 points" is not computed and cannot change. Streak here is `Math.max(...routines.streak) + 1`, a third definition. |
| 4.2 | Per-routine analysis | `app/(tabs)/analysis.tsx` → `PerRoutine` | mock | The 30-day bar chart is the constant `THIRTY_DAY`; "24 of 30 completed" is `Math.round(hits / THIRTY_DAY.length * 30)` — arithmetic over a constant, which reads as a computed figure. "Where the time goes" is the constant `TIME_SPENT`. The insight sentence ("overruns 4 days in 5") is a template over `TIME_SPENT[0]`/`[1]`, not over the user's sessions. Identical for every routine. |
| 4.3 | Momentum rings dialog | `app/(tabs)/analysis.tsx` → `RingsDialog` | OK | Five tiers, current tier highlighted with the "You" pill, Okay to dismiss. |
| 4.4 | Notes | `app/(tabs)/analysis.tsx` → `Notes` | OK | Real: reads `state.notes`, writes through `addNote`, has a genuine empty state. The **Routine/Task** toggle changes nothing — both render the same list. |

## Flow 05 — Explore

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 5.1 | Explore | `app/(tabs)/explore.tsx` | drift | Reset cards, recommended tasks, category chips, template list, all present. The app adds an overline **"Library"** above the title that the board doesn't have. Both reset cards route to `/guide` regardless of which one is tapped. |
| 5.2 | Template detail | `app/template/[id].tsx` | OK | Hero, `30 min · 6 tasks · 14.2k using` pills, blurb, task list, save + "Add to my routines". Installing creates a real routine. New routines are hardcoded to start 07:00 Mon–Fri. |
| 5.3 | Task picker sheet | `app/task-picker.tsx` | OK | Two-column tiles, count in the CTA ("Add 2 tasks" when two are picked). Faithful. |

## Flow 06 — Social & friends

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 6.1 | Social feed | `app/(tabs)/social.tsx` → `Feed` | mock | Story card, filter/visibility pills, expandable posts with copyable task lists. Every post is the constant `FEED`; Filter and Visibility are **non-interactive decoration**. Copying a friend's routine does write real tasks into your first routine — with `tone: 'leaf'` forced on every task, so the icon colours are wrong on import. |
| 6.2 | Friends | `app/(tabs)/social.tsx` → `Friends` | mock | `FRIENDS` is a constant; "4 / 10" counts the constant. **Nudge** flips `state.nudged` and nothing ever reads it. "Add friends" is a dashed box with no handler. |

## Flow 07 — Profile & settings

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 7.1 | Profile | `app/(tabs)/profile.tsx` | drift | All groups and rows match. Adds an **"Account"** overline the board lacks. Rate us and Share are real. `Backup & sync: On/Off` reads `settings.backup.enabled`, which can say "On" with no Google account connected (see Systemic §7). Version `1.4.2` is a string literal. |
| 7.2 | Edit profile | `app/profile/edit.tsx` | OK | Nickname / Gender / Age / Introduction / Focus, wheel-picker sheets, terms footer. Avatar "+" button is decorative — no image picker. |
| 7.3 | Settings | `app/settings/index.tsx` | drift | Board groups: System, Routine, Date & time, Plug-ins. App adds a **Data** group (Backup & sync) — correct, since backup shipped after the board. Board shows `Theme · Light`; app shows `Ember · light` plus a swatch. **Language is a live setting that localises nothing.** |
| 7.4 | Wheel picker sheet | `src/components/WheelSheet.tsx` | OK | One picker pattern behind Language, Time format, Week start, End day, Gender, Age — exactly the board's stated intent. |
| 7.5 | Home screen — list | `app/settings/home-screen.tsx` | OK | Live preview above four switches, Apply commits. Better than the board, which draws a static preview. |
| 7.6 | Home screen — timeline | `app/settings/home-screen.tsx` | OK | Segmented switch to the timeline preview + "Show tasks inside blocks". |
| 7.7 | Timer settings | `app/settings/timer.tsx` | OK | Miniature timer that redraws per switch, the three display modes, Focus options, Plug-ins. **Two switches are inert**: `landscape` and `sticky` persist but nothing implements orientation locking or a notification. `summary` likewise. `keepScreenOn` and `moodReview` are wired. |
| 7.8 | App icon | `app/settings/app-icon.tsx` | drift | Board draws 7 variants; code ships **10** (adds sky/moss/orchid to match the accent presets). Selecting one changes the in-app artwork only — Android's launcher alias is not switched, so the home-screen icon never changes. |

## Flow 08 — Account & data

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 8.1 | Free forever | `app/free.tsx` | OK | Three points, footer card, "Got it". Faithful. |
| 8.2 | Account & data | `app/account/index.tsx` | **deliberate** | Retitled **"Your data"**. The board's fixed "146 days / 2.4 MB / 2 minutes ago" is computed from the real archive, and "copied to your account each night" became the real Drive schedule. The **Email** row is gone — it printed the *Google* address as though it were an app login, or "Not signed in" when there was nothing to sign into. **"Sign out"** is gone: it called `reset()`, wiping the device behind a benign label and with no confirmation. **"Delete account"** → **"Delete everything"**, still confirmed. Group retitled "This device". |

## Flow 09 — Guide & support

| # | Board screen | Route | Status | Notes |
|---|---|---|---|---|
| 9.1 | User guide | `app/guide/index.tsx` | OK | Habit articles / Timer guide tabs, VOL. cards. The Timer-guide tab re-lists three of the same five habit articles rather than timer-specific content. |
| 9.2 | Article | `app/guide/[id].tsx` | OK | VOL / read-time kicker, headline, body sections. |
| 9.3 | Contact us | `app/contact.tsx` | OK* | Topic rows routing to `mailto:hello@productively.app`, plus a "Suggest a feature" card not on the board. *Board tail truncated — the full topic list could not be diffed. |

---

## Systemic — the things that don't make sense

**1. Nothing in the repo says which board is authoritative.**
The README says the app was built from `Productively.dc.html`. The design project
now holds `Productively.dc.html`, `Productively v2.dc.html` *and*
`Productively v2 Implementation Plan.dc.html`. Neither board is vendored into the
repo, so there is no way to diff the code against the design without network
access to a Claude Design project, and no way to tell which board revision
`de5098c` was built against. Every future "does this match?" question restarts
this audit from scratch.

**2. The Analysis flow ignores the only real data the app has.**
`finishRun` writes genuine sessions to AsyncStorage. Analysis never reads them.
`WEEK_GRID`, `THIRTY_DAY`, `TIME_SPENT` and `routine.rate` are frozen constants in
`src/data.ts`, rendered through arithmetic (`Math.round(hits / len * 30)`,
`reduce(rate) / length`) that makes them look derived. "up 8 points on last week"
is a string literal. A user who runs a routine every day for a month sees the same
chart on day 1 and day 30. This is the single biggest gap between what the app
appears to do and what it does.

**3. "Streak" has three incompatible definitions.**
- `store.streakFor(id)` = seeded `routine.streak` + 1 if completed today.
- `analysis.tsx` = `Math.max(...routines.map(r => r.streak)) + 1` — unconditional +1.
- `run/[id].tsx` Complete = `streakFor(id) + 1`.

None of them read the session history, so no streak ever advances past its seed+1,
and none of them can ever break. The board's "13-day streak" is achieved by seeding
12 and adding one.

**4. Seeded demo data is indistinguishable from the user's own.**
First launch seeds a 13-day account: three routines, two checklists, four notes,
four friends. There is no marker saying it is sample data and no empty first-run
state (the README lists empty states as out of scope). Two consequences: a real
install lies to the user on day one, and **backup merge restores against seeded
ids** — a merge that "adds only ids this device has never seen" will silently
skip a restored `morning` routine because the seed already claimed that id.

**5. Social is a fiction with no boundary marker.**
There is no backend, no account system and no networking anywhere in `src/`.
Friends, the feed, the story, "4 / 10", the nudge — all constants. Nudge writes
`state.nudged` and nothing consumes it. Yet it occupies one of five dock tabs,
i.e. 20% of the app's primary navigation. Either it is a demo (and should be
labelled or moved behind Labs) or it is a roadmap item (and should not be shipping
as a tab).

**6. Several controls persist state that nothing implements.**
`settings.timer.landscape`, `.sticky`, `.summary`; `settings.statusBarTimer`;
`settings.language`; the app-icon selection (in-app only, no launcher alias);
Explore's Filter and Social's Filter/Visibility pills; the avatar "+" on Edit
profile; Analysis's Routine/Task toggle. Each is a switch the user can flip that
changes nothing. The board draws them, so they were built as drawn — but shipping
them as live toggles rather than disabled/"coming" states is the wrong reading.

**7. Two sources of truth for "is backup on".**
Profile and Settings read `state.settings.backup.enabled`; Account reads
`backup.account?.email`. Enabling the schedule without connecting an account shows
"Backup & sync · On" next to "Email: Not signed in".

**8. The version number is a literal in three files.**
`1.4.2` is hardcoded in `profile.tsx`, `account/index.tsx` and `contact.tsx`
(and inside the mailto subject), duplicating `app.json`. It will drift on the
first release.

**9. Two surfaces ship with no design authority.**
The board is light-mode, Ember-only. The app ships a **dark theme** and **four
accents**, and derives the whole dark palette algorithmically. `check:contrast`
proves it is legible; nothing proves it is *right*. Same for the three extra app
icons. This is the largest body of un-designed surface area in the project.

**10. `#FF7A45 ember` in the board is not the value in the code.**
`ACCENTS.ember.base` is `#FF8A5B`. The *gradient* stops (`#FF9E70` → `#FF7440`)
do match the board exactly, so nothing renders wrong — but the documented brand
hex does not exist anywhere in `src/`.

**11. Two primary CTAs were renamed.**
"Start — done by 8:07am" → "Done at 8:07am" on both 1.11 and 3.1. The board's
version leads with the verb; the app's reads like a status, not a button.

**12. Destructive actions are under-labelled.** ✅ closed
Account ▸ **Sign out** calls `reset()` — a full local wipe with no confirmation,
sitting directly above **Delete account**, which *does* confirm and does the same
thing. There is no account to sign out of. *Sign out is removed; "Delete
everything" is the only destructive action on the screen and still confirms.*

**13. The app asked people to sign up for nothing.** ✅ closed
The board draws an auth surface — "Sign up in 10 seconds", "Start without an
account", "Already with us? Sign in", an Email row, a "Sign out", a "Delete
account". None of it was connected to anything, because there is nothing to
connect it to: no backend, no server, no social, and backup is an export file
the user carries themselves. All three welcome CTAs called the same `go()`. The
Email row printed the *Google Drive* address, so the one screen claiming to show
"your account" was showing somebody else's.

The cost of leaving it in was not cosmetic. It asks for a commitment the app
cannot honour, it invites the question "where is my data actually stored?" and
answers it wrongly, and it made a device wipe look like a session ending.

*Removed: 1.2 is now **Get started** + **Import a backup**; 8.2 is "Your data"
with no email and no sign-out; Profile's "Account" group is "Your data". The one
sign-in left is Google's, on the Drive backup screen, and it is now labelled as
Google's.* This **overrides "board always wins"** — the first place the board is
not just wrong about a number but about what the product is.

**14. The app promises alarms it never schedules.**
1.9 says "We'll help you remember your routine" over an **Alarm permission**
card. Nothing in the tree imports `expo-notifications`, nothing requests
`SCHEDULE_EXACT_ALARM`, and no notification is ever scheduled — the card is a
dimmed illustration behind the consent sheet, at `opacity: 0.62` and
`pointerEvents: 'none'`. It was also drawn as a bare dark capsule with *no
label*, so on a real device it reads as a greyed-out broken button rather than
a screen sitting behind a modal. *Labelled "Allow alarms" so it reads as the
backdrop it is; the underlying promise is still unimplemented.* Routine start
times exist and are shown ("in 6h", "8:00am") but nothing rings.

**15. Google Drive sync cannot work in any build made from this tree.**
`expo.extra.googleDrive` still holds `REPLACE_WITH_*` placeholders, so
`isDriveConfigured()` is false and every Drive path degrades to "Not set up".
That part is honest and the screen says so. Two traps wait behind it once real
ids are added: `expo.scheme` is `"productively"`, but Google's installed-app
redirect needs the **reversed client id** as a scheme, or the callback has
nowhere to land; and the Android OAuth client must be registered against
package `com.productively.app` *and* the SHA-1 of the keystore that actually
signed the APK. File export/import is independent of all of this and works.

**16. Onboarding's last two screens read backwards.** ✅ closed — 1.10 now ends it
1.10 says "You're all set to flow" and "Your first routine is ready", which is
terminal language, and its CTA — **Get started** — then pushes to 1.11, another
setup-looking screen. The board's order is not the problem. The CTA on 1.11 is:
the board draws **"Start — done by 8:07am"**, a verb, which makes 1.11 the
*launch pad* — here is the routine we built you, adjust it, run it now. The app
renamed it to **"Done at 8:07am"** (systemic 11), which reads as a confirm
button, so the screen loses its reason to exist and 1.10 → 1.11 feels like a
misfire. `finish()` also does not start anything; it sets `onboarded` and
replaces to Home.

*Resolved by ending onboarding at 1.10:* **Get started** now completes setup and
goes to Home. Completion moved out of the screen into `finishOnboarding()` in
`src/store.tsx`, because the last step of onboarding is not allowed to depend on
which screen happens to be last. 1.11 stays in the tree, still works end to end,
and reinstating it is a one-line change in `streak.tsx`.

Two real defects sat underneath it, both now fixed:

- **The reorder was theatre.** The coach mark says "reorder or remove anything
  that doesn't fit". `tasks` lived in local state and `finish()` never read it,
  so every edit was discarded on Done. It now writes back.
- **On a build with `demoSeed` off, onboarding created no routine at all.**
  `finish()` retimed `d.routines[0]`, and with no sample account there is no
  `d.routines[0]` — so the user was walked through "we've prepared your first
  routine" and landed on a completely empty Home. It now creates the routine it
  just showed you. 1.11 also seeds its rows from the routine that will actually
  run earliest, so with the sample account on you are editing the real thing
  rather than a three-task template belonging to nothing.

---

## Alignment plan

### Phase 0 — establish a source of truth (half a day)

1. Vendor `Productively v2.dc.html`, `android-frame.jsx` and the implementation
   plan into `docs/design/`, with the project id and pull date in a header.
2. Replace the README's v1 reference; state that the v2 board is authoritative.
3. Add `docs/design/DIVERGENCES.md` recording every deliberate departure, each
   with a reason: Account & data's real archive, the restore link on Welcome, the
   Jump-to sheet, Labs, the Data settings group, the fourth/extra app icons, dark
   mode, the accent presets. Right now these live in changelog prose and in my
   head; they need to survive both.

**Decision needed:** where the board and the shipped code disagree on *content*
(8.2's "copied to your account each night" vs the real Drive schedule), the code
wins and the board is stale. Confirm that's the standing rule.

### Phase 1 — make the numbers real ✅ done

1. ✅ One streak, derived from session history in `src/analytics.ts`. Counts back
   over *scheduled* days so a weekday routine survives the weekend; today is
   never a miss. `routine.streak` and `routine.rate` are gone from the type.
2. ✅ Completion, the 30-day bars, the week grid and "where the time goes" all
   read `state.sessions`. `WEEK_GRID`, `THIRTY_DAY` and `TIME_SPENT` are
   deleted; the sample account generates real sessions instead.
3. ✅ The week-over-week delta is measured, and withheld when last week ended
   before the first recorded session — a fresh install cannot report itself "up
   8 points" on a week it did not exist for.
4. ✅ The insight reads the user's own overruns, and needs three runs of a task
   before advising anything.
5. ✅ Sessions carry per-task timings; session days are local, not UTC.
6. ✅ `npm run check:analytics` — 40 assertions in plain Node.

Two bugs fixed on the way: `tierFor(0)` returned the *last* momentum tier, so a
new account drew its streak rail as "0 · 1 · 🏆 · 22 · 23"; and the three
`npm run check:*` scripts were broken on Windows (an `npx` spawn `execFileSync`
cannot resolve, and a POSIX/native path mismatch that made the token layer
report 106 violations of its own rule).

### Phase 2 — draw the fiction boundary (1 day, mostly decisions)

1. ✅ Social is removed — screen, mock data and dock tab. The dock is four tabs.
2. Either implement or visibly disable the inert switches in §6. Cheapest honest
   option: render them with a "Soon" chip and no toggle.
3. Reconcile the two backup-state sources into one derived `backupState`.
4. Read the version from `expo-constants` rather than three literals.
5. Rename Account ▸ "Sign out" to what it does, or hide it until there is an
   account to sign out of.

### Phase 3 — close the screen-level deltas (1–2 days)

In descending order of visibility:

1. **3.2 Settle** — rebuild to the board: routine name, `N tasks · M minutes`,
   the breathing ring, the "then we start with…" line. (Largest visual gap.)
2. **2.3 Timeline** — per-task time windows and side-by-side blocks.
3. **Streak rail** — re-encode to the board's completed/current/trophy/future.
4. **CTA copy** on 1.11 and 3.1 back to "Start — done by …".
5. **1.1** wordmark; **1.11** "BUILT FOR YOU" overline.
6. **2.4** — give Checklist a real destination; stop pointing two rows at Explore.
7. Decide on the four invented overlines (Library / Account / Your circle /
   Last 30 days): keep them all or drop them all — currently it's neither.

### Phase 2 — status after the release pass

Items 1 and 4 are closed. Item 5 was overtaken by systemic 13: there is no
"Sign out" to rename because there is no account. Items 2 and 3 are open.

### Phase 4 — cover the un-designed surfaces (open-ended)

Dark mode, the three extra accents, the three extra app icons. Either get board
coverage for them or freeze them at their current state and treat
`check:contrast` as the only contract.

---

## Production readiness

Checked against a real `assembleRelease`, not against the dev server. Four of
these were invisible in development and only wrong in a shipped build.

### Fixed before the build

| | Was | Why it mattered |
|---|---|---|
| Sample account | `extra.demoSeed: true` | Every real install would have opened on a stranger's 12-day streak, three routines they never wrote and four journal entries they never lived. |
| Version string | `1.4.2` typed into 4 places | A bumped release would still ship screens claiming the old number, and support mail arrived stamped with a version nobody was running. Now `src/release.ts` reads the manifest. |
| `SYSTEM_ALERT_WINDOW` | merged in from a dependency | Reads as "Display over other apps" on the listing, for a capability the app does not have. Blocked at manifest merge; `android.permissions` is now stated explicitly. |
| 18 more permissions | merged in with `expo-notifications` | Every launcher vendor's badge permission (ShortcutBadger), plus push (`c2dm.RECEIVE`) and Play install-referrer. The app sets no badge, has no push and no attribution. Same defect as the row above, at scale — read the merged manifest after adding *any* dependency, because none of this appears in the source. |
| `versionCode` | defaulted | The number Play orders releases by was not in source control. Declared, and bumped per build — 2 as of the barebones pass. |
| Profile bio | `"Building slowly. 13 days into the morning routine."` | A fabricated statistic on a fresh install, on the one screen whose every other number is derived. Ships with the demo now; empty otherwise. Found by walking the release build, not by reading it. |

### Icon and splash

All six image assets were the Expo template's, and the first release build
shipped with them. They are generated now — `npm run icons`, from the `logo`
glyph and `IDENTITY.icons.default` — so the launcher icon, the splash and the
"Default" tile on 7.8 are provably the same mark.

This does **not** close 7.8. The App icon screen offers ten variants and
persists the choice; changing the real launcher icon still needs an
`activity-alias` per variant and a config plugin to write them, which is native
work rather than a JS change. Until then the screen sets a preference that
nothing reads.

### Found by walking the release build, still open

**`profile.name` defaults to `'Prashant'`.** Onboarding never asks for a name —
the board draws no such step — so Home greets *every* install with "Good
evening, Prashant." It is editable at Profile ▸ edit, and it is the developer's
own name, so it may well be deliberate for a personal build. Shipping it to
anyone else is not. Two ways out, and they are a product decision rather than a
fix: add a name step to onboarding (the board has no screen for it), or default
the name empty and let Home fall back to "Good evening." on its own.

### Known, and shipping anyway

1. **The release APK is signed with the debug keystore.** This is the Expo
   template default and it is fine for sideloading; Play will reject it. A real
   upload keystore is a prerequisite for any store submission and nothing else
   in the build blocks on it.
2. **R8 is off** (`android.enableMinifyInReleaseBuilds` unset). Leaving it off
   is the safe default — turning it on without a Proguard pass over
   `react-native-svg`, Reanimated and the Expo modules is how a release breaks
   in ways debug never shows. Worth doing deliberately, not as part of a
   checklist sweep.
3. **Three switches in Settings ▸ Timer persist but do nothing**: *Task
   duration*, *Sticky notification*, *End-of-routine summary* (verified: no
   reader outside the settings screen itself). This is Phase 2 item 2, still
   open. *Sticky notification* is no longer blocked on a missing dependency —
   `expo-notifications` is in the build now — it is simply unwired.
   Labs' two toggles are equally inert but the screen says so in as many words,
   which makes them honest.
4. ~~**Alarms are still never scheduled**~~ **Closed** — see "Barebones pass"
   below. What ships is a weekly reminder notification, not a clock-app alarm.
5. **Google Drive degrades cleanly.** The client IDs in `app.json` are
   `REPLACE_WITH_…` placeholders, `isDriveConfigured()` reads that as "not set
   up", and the whole Drive group is hidden rather than throwing. Export and
   import by file work; Drive sync is simply absent from the build.
6. **The APK is 107 MB**, which is the single biggest thing wrong with the
   build. It breaks down as 78 MB of native libraries across all four ABIs
   (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` — a phone installs one and
   carries the other three), 40 MB of unminified dex across four `classes*.dex`
   files, and 3.5 MB of JS bundle. Two levers, in order of return: ship an
   **AAB** (Play splits per-device, ~35 MB delivered) or set
   `android.splits.abi` for sideloadable per-ABI APKs; then **R8**, which is
   what the dex is waiting on. `assets/main-hero-bg.png` (2.09 MB, crunched to
   1.9 MB in the APK) is real but rounding error against the above.
7. **Empty states are un-drawn, not broken.** Every `routines[0]` site is
   guarded (`explore.tsx`, `home-screen.tsx`, `analysis.tsx`, `task-picker.tsx`),
   so a `demoSeed: false` build no longer crashes — but the board never drew
   these screens with nothing in them, so they are bare rather than designed.
   This closes question 5 as "does not crash"; it does not close it as "looks
   deliberate".

---

## Barebones pass

Found by using the release build rather than reading it. Every item here is a
control the board drew and the code rendered, which did nothing when tapped —
the failure mode this codebase is most prone to, because a screen that matches
the picture passes every check we have.

| Screen | Was | Now |
|---|---|---|
| 2.4 add sheet | *Checklist* called `addChecklistItem('go', …)` against a group id no account has, so it silently no-opped. *Routine* and *Start from a template* both pushed to Explore. | *Checklist* opens the list composer; *Routine* creates an empty routine at the user's wake time and opens it. |
| 2.2 checklist | Toggle only. No way to create a list, rename one, delete one, or add an item — and with `demoSeed: false` the tab was permanently blank. | Full CRUD: new list, add/rename/remove item, rename/delete list, untick all. Empty state included. |
| 3.1 routine detail | The three dots in the header were decoration. Tasks could only come from `PICKER_TASKS`, a fixed six. A routine's name, start time and days could not be changed at all. | Dots open a real menu (rename / start time / repeat days / delete). `TaskComposer` writes a custom task — title, minutes, icon — and edits an existing one. |
| 5.1 Explore | *Picks* was a pill with no handler. Recommended tasks added to `routines[0]` without asking or confirming. Both RESET cards pushed `/guide`. | *Picks* removed pending the feature below. Recommended tasks ask which routine and confirm by name. RESET cards open `app/reset/[id].tsx`. |
| 1.9 permissions | *Allow alarms* sat inside a `pointerEvents: 'none'` backdrop and the app had no notification dependency. | Two phases: consent sheet, then the same layout live. The button asks Android for real and `src/alarms.ts` schedules weekly reminders. |
| 4.1 Analysis | Analysis / Note were two 21px display words with a capsule behind the live one — a bespoke control for the job the adjacent tab does with `Segmented`. | The same pill switch as Home. |

Two notes on judgement calls:

**Reminders are not alarms.** A full-screen, sound-through-silent alarm needs
`USE_FULL_SCREEN_INTENT` and `SCHEDULE_EXACT_ALARM`, both reviewed case by case
by Google, and a routine reminder does not qualify for either. What ships is a
`WEEKLY` notification a configurable number of minutes before the start time,
on each day the routine runs. `syncAlarms` rebuilds the whole schedule from the
routines on every relevant change rather than diffing, keyed on a signature so
an unrelated store write does not re-post it.

**The reset cards needed content, not a destination.** They are rescue cards —
tapped while it is happening. Sending them to a five-volume habit-design index
was the wrong shape regardless of which article they landed on, so each is now a
paced sequence: 5-4-3-2-1 grounding, and 4/4/6 breathing on a loop.

### Future — AI-assisted picks

The board's *Picks ✦* pill is the one control on Explore that needs a model
behind it: read the user's sessions, struggles and intents and suggest the task
or template that actually fits, instead of the two hardcoded entries in
`RECOMMENDED_TASKS` and the fixed six in `PICKER_TASKS`. It is hidden rather
than deleted, and `RECOMMENDED_TASKS` marks where the output would go.

Open questions before it could be built: it is the first feature that would send
user data off the device, which contradicts "nothing leaves the phone unless you
export it" in the README — so it needs either an on-device model or an explicit,
separate opt-in with its own consent copy. There is no backend, so there is
nowhere to put an API key that is not in the APK.

## Questions

1. ~~Board vs code on content?~~ **Answered: the board wins — except where the
   board describes a product this one is not.** 8.2 was the test case, and it is
   now resolved the other way: the screen keeps its computed archive figures
   *and* has lost the account furniture entirely (systemic 13). The rule that
   came out of it: the board is authoritative on layout, type and copy; it is not
   authoritative on whether a capability exists.
2. ~~Social?~~ **Answered: cut.** The app is being built to work without a
   backend, so the feature could never have become real.
3. ~~Seed data?~~ **Answered: kept, behind `expo.extra.demoSeed`,** generating
   real sessions. Ids are prefixed `demo-` so backup-merge can tell them apart.
4. **Is the Android launcher-icon swap (7.8) in scope?** Still open. It needs
   activity-alias entries in the manifest and a config plugin; it is not a JS
   change.
5. **New:** turning `demoSeed` off leaves Home, Analysis and the settings
   previews standing but bare — they no longer crash, but the designed empty
   states the board never drew are still missing. Worth deciding before any
   build ships with the flag off.
6. **New:** with `demoSeed` **on**, 1.10 still reads "1 day streak / your first
   routine is ready and waiting for tomorrow morning" and then drops the user
   onto a Home that says 21 days. That copy is the board's, and it is true for
   the real first-run case, so it was left alone — but the two flows disagree on
   screen, and a demo build is exactly what gets shown to people.
