/**
 * Every number the app claims about the user's history, derived from
 * `state.sessions` and nothing else.
 *
 * Before this module the analysis flow read frozen constants — a week grid, a
 * 30-day chart and a "where the time goes" table that never moved no matter
 * what you did — while `finishRun` quietly recorded real sessions beside them.
 * Everything here reads the sessions.
 *
 * Two rules the callers depend on:
 *
 *   - **Days are local.** `dayKey` formats the device's own calendar day.
 *     `toISOString().slice(0, 10)` — what the app used before — is UTC, so a
 *     9:30pm Wind down west of Greenwich recorded itself as *tomorrow* and broke
 *     the streak it had just extended.
 *   - **A day only counts against you once it is over.** Today is never a miss;
 *     a routine you have not run yet is pending, not failed.
 */
import type { DayState, Routine, Session } from './data';
import type { IconName } from './icons';
import type { TaskTone } from './theme';

/* ── days ─────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');

/** The device's local calendar day, as `YYYY-MM-DD`. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Midnight local, so date maths never drifts on a DST boundary. */
export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export const isScheduled = (routine: Routine, date: Date) => routine.days.includes(date.getDay());

export const sessionOn = (sessions: Session[], routineId: string, day: string) =>
  sessions.find((s) => s.routineId === routineId && s.day === day);

/** Ran every task it started, none skipped. */
export const isFullyDone = (s: Session) => s.total > 0 && s.done >= s.total;

/* ── streak ───────────────────────────────────────────────────────── */

/**
 * Consecutive scheduled days ending today, counting back until a scheduled day
 * has no session.
 *
 * Today is skipped rather than counted as a break, so the number does not drop
 * to zero every midnight and climb back at breakfast. A routine with no
 * scheduled days (a template that has never been given a weekday) has no
 * streak — returning 0 rather than looping forever.
 */
export function streakFor(routine: Routine | undefined, sessions: Session[], now = new Date()): number {
  if (!routine || routine.days.length === 0) return 0;

  let streak = 0;
  let cursor = startOfDay(now);
  const todayKey = dayKey(cursor);

  // Two years of scheduled days is far past any streak worth drawing, and it
  // stops a corrupt `days` array from spinning.
  for (let i = 0; i < 730; i++) {
    if (isScheduled(routine, cursor)) {
      const key = dayKey(cursor);
      const done = !!sessionOn(sessions, routine.id, key);
      if (done) streak++;
      else if (key !== todayKey) break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** The routine carrying the longest current streak — the one Analysis leads with. */
export function bestStreak(routines: Routine[], sessions: Session[], now = new Date()) {
  return routines
    .map((r) => ({ routine: r, streak: streakFor(r, sessions, now) }))
    .sort((a, b) => b.streak - a.streak)[0];
}

/* ── completion ───────────────────────────────────────────────────── */

export type Completion = {
  /** Scheduled days in the window that already have a session. */
  completed: number;
  /** Scheduled days in the window, today included only once it is done. */
  scheduled: number;
  /** 0–1, or null when the window contains nothing to complete. */
  rate: number | null;
};

/**
 * Completion over the `days` calendar days ending today.
 *
 * Today counts toward the denominator only if it has been run, for the same
 * reason the streak skips it: a morning routine should not read 0% at 7am.
 */
export function completionOver(
  routine: Routine,
  sessions: Session[],
  days = 28,
  now = new Date()
): Completion {
  const todayKey = dayKey(startOfDay(now));
  let completed = 0;
  let scheduled = 0;

  for (let i = 0; i < days; i++) {
    const date = addDays(startOfDay(now), -i);
    if (!isScheduled(routine, date)) continue;
    const key = dayKey(date);
    const ran = !!sessionOn(sessions, routine.id, key);
    if (key === todayKey && !ran) continue;
    scheduled++;
    if (ran) completed++;
  }

  return { completed, scheduled, rate: scheduled === 0 ? null : completed / scheduled };
}

/** The single percentage a routine card shows. Null until there is a week of it. */
export const rateFor = (routine: Routine, sessions: Session[], now = new Date()) =>
  completionOver(routine, sessions, 28, now).rate;

/* ── the week ─────────────────────────────────────────────────────── */

export function weekStartDate(now: Date, weekStart: 'Sun' | 'Mon'): Date {
  const d = startOfDay(now);
  const offset = weekStart === 'Sun' ? d.getDay() : (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}

export type WeekRow = { routineId: string; label: string; days: DayState[] };

/**
 * The seven-dot grid. `3` covers both "not scheduled" and "not here yet" — the
 * dot is drawn as a dashed outline either way, which reads as pending rather
 * than missed.
 */
export function weekGrid(
  routines: Routine[],
  sessions: Session[],
  weekStart: 'Sun' | 'Mon',
  now = new Date()
): WeekRow[] {
  const from = weekStartDate(now, weekStart);
  const todayKey = dayKey(startOfDay(now));

  return routines.map((r) => ({
    routineId: r.id,
    label: shortName(r.name),
    days: Array.from({ length: 7 }, (_, i): DayState => {
      const date = addDays(from, i);
      if (!isScheduled(r, date)) return 3;
      const key = dayKey(date);
      const s = sessionOn(sessions, r.id, key);
      if (s) return isFullyDone(s) ? 2 : 1;
      // Today-not-yet and the rest of the week are pending, not missed.
      return key >= todayKey ? 3 : 0;
    }),
  }));
}

/** "Morning routine" → "Morning". The grid's label column is 96px wide. */
function shortName(name: string) {
  const first = name.split(' ')[0];
  return first.length >= 4 ? first : name.split(' ').slice(0, 2).join(' ');
}

export type WeekSummary = {
  /** 0–100, or null when nothing was scheduled. */
  pct: number | null;
  /** Percentage points against the previous week, or null with no prior week. */
  deltaPoints: number | null;
};

/**
 * Completion across every routine this week, and the move on last week.
 *
 * The delta is withheld when last week ended before the first session ever
 * recorded. Otherwise a fresh install reads its own pre-history as a week of
 * total failure and announces it is "up 67 points" — which is the invented
 * number this module exists to get rid of. A week the user genuinely had the
 * app and missed still counts against them.
 */
export function weekSummary(
  routines: Routine[],
  sessions: Session[],
  weekStart: 'Sun' | 'Mon',
  now = new Date()
): WeekSummary {
  const thisWeek = weekWindow(routines, sessions, weekStartDate(now, weekStart), now);
  const pct = thisWeek.rate === null ? null : Math.round(thisWeek.rate * 100);

  const prevStart = addDays(weekStartDate(now, weekStart), -7);
  const prevEnd = dayKey(addDays(prevStart, 6));
  const firstEver = sessions.reduce<string | null>(
    (min, s) => (min === null || s.day < min ? s.day : min),
    null
  );
  if (firstEver === null || prevEnd < firstEver) return { pct, deltaPoints: null };

  const prev = weekWindow(routines, sessions, prevStart, now);
  const prevPct = prev.rate === null ? null : Math.round(prev.rate * 100);

  return {
    pct,
    deltaPoints: pct === null || prevPct === null ? null : pct - prevPct,
  };
}

function weekWindow(routines: Routine[], sessions: Session[], from: Date, now: Date): Completion {
  const todayKey = dayKey(startOfDay(now));
  let completed = 0;
  let scheduled = 0;

  routines.forEach((r) => {
    for (let i = 0; i < 7; i++) {
      const date = addDays(from, i);
      const key = dayKey(date);
      // Days that have not happened cannot be missed.
      if (key > todayKey) continue;
      if (!isScheduled(r, date)) continue;
      const ran = !!sessionOn(sessions, r.id, key);
      if (key === todayKey && !ran) continue;
      scheduled++;
      if (ran) completed++;
    }
  });

  return { completed, scheduled, rate: scheduled === 0 ? null : completed / scheduled };
}

/* ── the 30-day chart ─────────────────────────────────────────────── */

export type DayBar = { day: string; h: number; hit: boolean };
export type ThirtyDay = { bars: DayBar[]; completed: number; scheduled: number };

/**
 * The last 30 *scheduled* occurrences, oldest first.
 *
 * Bar height is the run's duration against its plan, clamped so a very short
 * session still draws something and a big overrun does not blow the axis. A
 * missed day draws a stub, which is what makes the gaps legible.
 */
export function thirtyDay(routine: Routine, sessions: Session[], now = new Date()): ThirtyDay {
  const planned = routine.tasks.reduce((n, t) => n + t.minutes, 0) || 1;
  const todayKey = dayKey(startOfDay(now));
  const bars: DayBar[] = [];

  let cursor = startOfDay(now);
  for (let i = 0; i < 400 && bars.length < 30; i++) {
    if (isScheduled(routine, cursor)) {
      const key = dayKey(cursor);
      const s = sessionOn(sessions, routine.id, key);
      // Today, un-run, is not yet a data point.
      if (!(key === todayKey && !s)) {
        bars.push({
          day: key,
          hit: !!s,
          h: s ? Math.max(0.35, Math.min(1, s.durationMin / planned)) : 0.18,
        });
      }
    }
    cursor = addDays(cursor, -1);
  }

  bars.reverse();
  return {
    bars,
    completed: bars.filter((b) => b.hit).length,
    scheduled: bars.length,
  };
}

/* ── where the time goes ──────────────────────────────────────────── */

export type TaskAverage = {
  taskId: string;
  title: string;
  icon: IconName;
  tone: TaskTone;
  /** Mean seconds actually spent, across runs that did not skip it. */
  avgSeconds: number;
  /** Bar width, 0–1, against the longest task in the routine. */
  pct: number;
  /**
   * Averaging over its planned minutes — measured on the *displayed* figure,
   * not the raw seconds. A 3m task averaging 3m10s still reads "3m avg", and a
   * row that says 3m against a 3m plan must not also be coloured as an overrun.
   */
  over: boolean;
  runs: number;
};

/**
 * Mean time per task, longest first.
 *
 * Needs `session.taskSpent`, which only exists on runs recorded after this
 * shipped — older sessions simply contribute nothing rather than skewing the
 * mean with a zero.
 */
export function timeSpent(routine: Routine, sessions: Session[]): TaskAverage[] {
  const mine = sessions.filter((s) => s.routineId === routine.id && s.taskSpent?.length);
  if (!mine.length) return [];

  const rows = routine.tasks
    .map((task) => {
      const spent = mine
        .flatMap((s) => s.taskSpent ?? [])
        .filter((x) => x.taskId === task.id && !x.skipped)
        .map((x) => x.spent);
      if (!spent.length) return null;
      const avgSeconds = spent.reduce((a, b) => a + b, 0) / spent.length;
      return {
        taskId: task.id,
        title: task.title,
        icon: task.icon,
        tone: task.tone,
        avgSeconds,
        pct: 0,
        over: avgMinutes(avgSeconds) > task.minutes,
        runs: spent.length,
      } satisfies TaskAverage;
    })
    .filter((x): x is TaskAverage => x !== null)
    .sort((a, b) => b.avgSeconds - a.avgSeconds);

  const longest = rows[0]?.avgSeconds ?? 1;
  return rows.map((r) => ({ ...r, pct: longest === 0 ? 0 : r.avgSeconds / longest }));
}

/** Whole minutes, floored at 1 so a 30-second task never reads "0m". */
const avgMinutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));

/** "12m avg" — the same figure the overrun flag is judged on. */
export const avgLabel = (seconds: number) => `${avgMinutes(seconds)}m avg`;

/**
 * The one adjustment worth making, drawn from the user's own overruns.
 *
 * Deliberately conservative: it needs three runs of the same task before it
 * will tell anyone to change anything, and it says nothing at all rather than
 * inventing an observation.
 */
export function insightFor(routine: Routine, sessions: Session[]): string | null {
  const rows = timeSpent(routine, sessions);
  const worst = rows.find((r) => r.over && r.runs >= 3);
  if (!worst) return null;

  const task = routine.tasks.find((t) => t.id === worst.taskId);
  if (!task) return null;

  const overruns = sessions
    .filter((s) => s.routineId === routine.id)
    .flatMap((s) => s.taskSpent ?? [])
    .filter((x) => x.taskId === worst.taskId && !x.skipped);
  const overCount = overruns.filter((x) => x.spent > task.minutes * 60).length;
  const cap = Math.max(1, Math.round(worst.avgSeconds / 60));

  const before = rows.find((r) => r.taskId !== worst.taskId && !r.over);
  const move = before ? ` Try moving it after ${before.title.toLowerCase()}, or cap` : ' Try capping';

  return `${worst.title} overruns ${overCount} runs in ${overruns.length}.${move} it at ${cap} minutes.`;
}
