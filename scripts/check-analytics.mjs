/**
 * Acceptance check: the derived history.
 *
 * Everything the app claims about the user — the streak on Home, the percentage
 * on a routine card, the week grid, the 30-day chart — comes out of
 * src/analytics.ts. It used to come out of frozen constants, so nothing could
 * be wrong; now it can be, and the failure mode is an app that quietly tells
 * someone they broke a streak they did not break. Type-only imports mean this
 * runs in plain Node, off a device.
 *
 *   node scripts/check-analytics.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = mkdtempSync(join(tmpdir(), 'productively-analytics-'));
// Direct, not via `npx` — see the note in check-contrast.mjs.
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    'src/analytics.ts',
    '--ignoreConfig',
    '--outDir',
    out,
    '--module',
    'es2020',
    '--target',
    'es2020',
    '--skipLibCheck',
    // The type-only imports reach data.ts, which pulls the .tsx icon set into
    // the program. All of it is erased from the emit, but tsc still parses it.
    '--jsx',
    'react-jsx',
  ],
  { stdio: 'inherit' }
);

const a = await import(pathToFileURL(join(out, 'analytics.js')).href);

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`  FAIL ${name}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`  ${name}`);
  }
}

/* A Wednesday, so weekday maths is unambiguous. */
const NOW = new Date(2026, 7, 12, 9, 0, 0); // 2026-08-12
const key = (offset) => a.dayKey(a.addDays(a.startOfDay(NOW), offset));

const everyDay = { id: 'r', name: 'Daily', start: 480, days: [0, 1, 2, 3, 4, 5, 6], tasks: [
  { id: 't1', title: 'One', icon: 'leaf', tone: 'leaf', minutes: 10 },
  { id: 't2', title: 'Two', icon: 'cup', tone: 'cup', minutes: 5 },
] };
const weekdays = { ...everyDay, id: 'w', days: [1, 2, 3, 4, 5] };

const session = (routineId, offset, extra = {}) => ({
  id: `${routineId}-${key(offset)}`,
  routineId,
  day: key(offset),
  durationMin: 15,
  done: 2,
  total: 2,
  ...extra,
});

/* ── days ─────────────────────────────────────────────────────────── */

console.log('\ndays');
check('dayKey is local, not UTC', a.dayKey(new Date(2026, 7, 12, 23, 30)), '2026-08-12');
check('dayKey pads', a.dayKey(new Date(2026, 0, 5)), '2026-01-05');

/* ── streak ───────────────────────────────────────────────────────── */

console.log('\nstreak');
check('no sessions, no streak', a.streakFor(everyDay, [], NOW), 0);
check('no routine, no streak', a.streakFor(undefined, [], NOW), 0);
check(
  'a routine with no scheduled days terminates',
  a.streakFor({ ...everyDay, days: [] }, [session('r', -1)], NOW),
  0
);

check(
  'three days ending yesterday',
  a.streakFor(everyDay, [session('r', -1), session('r', -2), session('r', -3)], NOW),
  3
);
check(
  "today un-run does not break it",
  a.streakFor(everyDay, [session('r', -1), session('r', -2)], NOW),
  2
);
check(
  'today counts once it is run',
  a.streakFor(everyDay, [session('r', 0), session('r', -1), session('r', -2)], NOW),
  3
);
check(
  'a gap ends it',
  a.streakFor(everyDay, [session('r', -1), session('r', -3), session('r', -4)], NOW),
  1
);
check(
  'a missed yesterday, with today done, is a streak of one',
  a.streakFor(everyDay, [session('r', 0), session('r', -2)], NOW),
  1
);

// The weekend gap is the case that matters: a Mon–Fri routine run every weekday
// must not have its streak broken by the Saturday it was never scheduled on.
check(
  'unscheduled days are skipped, not counted as misses',
  a.streakFor(
    weekdays,
    // Wed 12th back through Thu 6th: -1 Tue, -2 Mon, -5 Fri, -6 Thu (-3/-4 weekend)
    [session('w', -1), session('w', -2), session('w', -5), session('w', -6)],
    NOW
  ),
  4
);

/* ── completion ───────────────────────────────────────────────────── */

console.log('\ncompletion');
check('null rate with no scheduled days in window', a.completionOver(everyDay, [], 0, NOW).rate, null);
check(
  'today un-run is excluded from the denominator',
  a.completionOver(everyDay, [session('r', -1)], 2, NOW),
  { completed: 1, scheduled: 1, rate: 1 }
);
check(
  'a real miss counts against it',
  a.completionOver(everyDay, [session('r', -1), session('r', -3)], 4, NOW),
  { completed: 2, scheduled: 3, rate: 2 / 3 }
);

/* ── the week ─────────────────────────────────────────────────────── */

console.log('\nweek');
check('week starts Sunday', a.dayKey(a.weekStartDate(NOW, 'Sun')), '2026-08-09');
check('week starts Monday', a.dayKey(a.weekStartDate(NOW, 'Mon')), '2026-08-10');

// Sun 9th … Sat 15th, today Wed 12th. Ran Mon and Tue, not Sun, not yet today.
const grid = a.weekGrid([everyDay], [session('r', -1), session('r', -2)], 'Sun', NOW);
check('grid row is seven days', grid[0].days.length, 7);
check(
  'missed / done / done / pending-today / future',
  grid[0].days,
  [0, 2, 2, 3, 3, 3, 3]
);
check(
  'a partial run reads as partial',
  a.weekGrid([everyDay], [session('r', -1, { done: 1 })], 'Sun', NOW)[0].days[2],
  1
);
check(
  'unscheduled weekend days are never misses',
  a.weekGrid([weekdays], [], 'Sun', NOW)[0].days[0],
  3
);

check(
  'no prior week means no delta claimed',
  a.weekSummary([everyDay], [session('r', -1), session('r', -2)], 'Sun', NOW).deltaPoints,
  null
);
{
  // This week: Mon+Tue done, Sun missed → 2/3. Last week: all seven → 7/7.
  const sessions = [session('r', -1), session('r', -2)];
  for (let i = 4; i <= 10; i++) sessions.push(session('r', -i));
  const s = a.weekSummary([everyDay], sessions, 'Sun', NOW);
  check('this week is computed', s.pct, 67);
  check('the delta is computed, not printed', s.deltaPoints, -33);
}

/* ── the 30-day chart ─────────────────────────────────────────────── */

console.log('\nthirty days');
{
  const chart = a.thirtyDay(everyDay, [session('r', -1), session('r', -2)], NOW);
  check('caps at 30 bars', chart.bars.length, 30);
  check('counts only the days that ran', chart.completed, 2);
  check('oldest first', chart.bars[chart.bars.length - 1].day, a.dayKey(a.addDays(a.startOfDay(NOW), -1)));
  check('today un-run is not plotted', chart.bars.some((b) => b.day === a.dayKey(NOW)), false);
}
check('an empty history plots nothing', a.thirtyDay(everyDay, [], NOW).bars.length, 30);
check('an empty history has no hits', a.thirtyDay(everyDay, [], NOW).completed, 0);

/* ── where the time goes ──────────────────────────────────────────── */

console.log('\ntime spent');
check('no per-task record, no table', a.timeSpent(everyDay, [session('r', -1)]), []);
{
  const withSpent = [
    session('r', -1, { taskSpent: [
      { taskId: 't1', spent: 900, skipped: false },
      { taskId: 't2', spent: 240, skipped: false },
    ] }),
    session('r', -2, { taskSpent: [
      { taskId: 't1', spent: 780, skipped: false },
      { taskId: 't2', spent: 300, skipped: true },
    ] }),
  ];
  const rows = a.timeSpent(everyDay, withSpent);
  check('longest first', rows.map((r) => r.taskId), ['t1', 't2']);
  check('mean of the runs that happened', rows[0].avgSeconds, 840);
  check('a skipped run is not averaged in', rows[1].avgSeconds, 240);
  check('over its plan is flagged', rows[0].over, true);
  check('under its plan is not', rows[1].over, false);
  check('the longest task fills the bar', rows[0].pct, 1);
  check('label rounds to minutes', a.avgLabel(840), '14m avg');
  check('a short task never reads 0m', a.avgLabel(20), '1m avg');
  check('two runs is not enough to advise anyone', a.insightFor(everyDay, withSpent), null);
}
{
  // The flag is judged on the figure the row prints, so a row can never read
  // "5m avg" against a 5m plan and still be coloured as an overrun.
  const rows = a.timeSpent(everyDay, [
    session('r', -1, { taskSpent: [{ taskId: 't2', spent: 310, skipped: false }] }),
  ]);
  check('ten seconds over does not colour a 5m row red', rows[0].over, false);
  check('and it still prints the rounded figure', a.avgLabel(rows[0].avgSeconds), '5m avg');
}
{
  const rows = a.timeSpent(everyDay, [
    session('r', -1, { taskSpent: [{ taskId: 't2', spent: 340, skipped: false }] }),
  ]);
  check('once it rounds up past the plan it is flagged', rows[0].over, true);
  check('and the label agrees', a.avgLabel(rows[0].avgSeconds), '6m avg');
}
{
  // Three overrunning runs is the threshold for saying something.
  const many = [-1, -2, -3].map((o) =>
    session('r', o, { taskSpent: [
      { taskId: 't1', spent: 900, skipped: false },
      { taskId: 't2', spent: 200, skipped: false },
    ] })
  );
  const insight = a.insightFor(everyDay, many);
  check('three runs earns an insight', typeof insight, 'string');
  check('it names the overrunning task', insight.startsWith('One overruns'), true);
}

console.log(failures ? `\nanalytics: ${failures} failure(s)` : '\nanalytics: all checks pass');
process.exit(failures ? 1 : 0);
