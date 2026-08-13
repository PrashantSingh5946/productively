/**
 * The sample account.
 *
 * The board draws a lived-in phone — twelve days into a morning routine, a
 * couple of checklists half-ticked, notes worth reading. That used to be faked:
 * a `streak: 12` field on a routine, a frozen week grid, a bar chart that never
 * moved. Here it is generated instead — real sessions on real days, with real
 * per-task timings — so every screen derives the same history the user would
 * have had if they had actually run these routines, and the charts agree with
 * the notes.
 *
 * It is off unless `expo.extra.demoSeed` is true in app.json. A build with the
 * flag off starts genuinely empty.
 *
 * The generator is deterministic: same day in, same account out. It uses a
 * small LCG rather than `Math.random` so a reinstall on the same date produces
 * the same phone, which makes the screens comparable against the board.
 */
import Constants from 'expo-constants';
import { addDays, dayKey, isScheduled, startOfDay } from './analytics';
import {
  ChecklistGroup,
  NoteEntry,
  Routine,
  Session,
  Task,
  TaskSpent,
  totalMinutes,
} from './data';
import { IconName } from './icons';
import { TaskTone } from './theme';

/** Whether this build seeds the sample account at all. */
export const DEMO_SEED: boolean = Constants.expoConfig?.extra?.demoSeed === true;

const t = (id: string, title: string, icon: IconName, tone: TaskTone, minutes: number): Task => ({
  id,
  title,
  icon,
  tone,
  minutes,
});

/**
 * Demo ids are prefixed so a restore can tell them apart from anything the user
 * made. Merge-restoring onto a seeded device used to silently skip a real
 * `morning` routine because the seed had already claimed that id.
 */
const ID = 'demo-';

export const DEMO_ROUTINES: Routine[] = [
  {
    id: `${ID}morning`,
    name: 'Morning routine',
    start: 8 * 60,
    days: [1, 2, 3, 4, 5],
    tasks: [
      t(`${ID}m1`, 'Stretch and drink water', 'bottle', 'water', 2),
      t(`${ID}m2`, 'Tidy up the bed', 'bed', 'bed', 2),
      t(`${ID}m3`, 'Deep breathing', 'leaf', 'leaf', 3),
      t(`${ID}m4`, 'Pep talk', 'heart', 'heart', 3),
      t(`${ID}m5`, 'Morning pages', 'pencil', 'pencil', 10),
      t(`${ID}m6`, 'Coffee, no phone', 'cup', 'cup', 8),
      t(`${ID}m7`, "Pick today's one thing", 'target', 'target', 6),
    ],
  },
  {
    id: `${ID}deep`,
    name: 'Deep work block',
    start: 13 * 60 + 30,
    days: [1, 2, 3, 4, 5],
    tasks: [
      t(`${ID}d1`, 'Silence every notification', 'screen', 'screen', 1),
      t(`${ID}d2`, 'Name the outcome', 'target', 'target', 4),
      t(`${ID}d3`, 'Deep sprint', 'flask', 'pencil', 50),
      t(`${ID}d4`, 'Stand up and stretch', 'dumbbell', 'dumbbell', 5),
    ],
  },
  {
    id: `${ID}wind`,
    name: 'Wind down',
    start: 21 * 60 + 30,
    days: [0, 1, 2, 3, 4, 5, 6],
    tasks: [
      t(`${ID}w1`, 'Tea before bed', 'cup', 'cup', 5),
      t(`${ID}w2`, 'Screens off', 'screen', 'screen', 2),
      t(`${ID}w3`, 'Three lines in the journal', 'pencil', 'pencil', 5),
      t(`${ID}w4`, "Tomorrow's one thing", 'target', 'target', 4),
      t(`${ID}w5`, 'Read ten pages', 'book', 'book', 10),
    ],
  },
];

export const DEMO_CHECKLISTS: ChecklistGroup[] = [
  {
    id: `${ID}go`,
    title: 'Before you go',
    items: [
      { id: `${ID}g1`, title: 'Wallet, keys, pass', done: true },
      { id: `${ID}g2`, title: 'Gas and electronics off', done: true },
      { id: `${ID}g3`, title: 'Water bottle refilled', done: false },
      { id: `${ID}g4`, title: 'Laptop charger', done: false },
      { id: `${ID}g5`, title: 'Headphones', done: true },
      { id: `${ID}g6`, title: 'Lunch packed', done: true },
      { id: `${ID}g7`, title: 'Office badge', done: true },
      { id: `${ID}g8`, title: 'Umbrella if rain', done: false },
    ],
  },
  {
    id: `${ID}reset`,
    title: 'Weekly reset',
    items: [
      { id: `${ID}r1`, title: 'Empty the inbox', done: true },
      { id: `${ID}r2`, title: "Plan next week's blocks", done: false },
      { id: `${ID}r3`, title: 'Laundry and sheets', done: false },
      { id: `${ID}r4`, title: 'Groceries order', done: false },
    ],
  },
];

/* ── history ──────────────────────────────────────────────────────── */

/**
 * How each routine's past should read. `streak` is the number of consecutive
 * scheduled days ending yesterday — today is deliberately left un-run so the
 * board's numbers land: Home says twelve days, and finishing the morning makes
 * it thirteen, which is exactly what 3.5 draws.
 */
const HISTORY: { id: string; streak: number; window: number; missRate: number }[] = [
  { id: `${ID}morning`, streak: 12, window: 40, missRate: 0.18 },
  { id: `${ID}deep`, streak: 6, window: 40, missRate: 0.3 },
  { id: `${ID}wind`, streak: 9, window: 40, missRate: 0.22 },
];

/** Mulberry32 — small, seeded, and good enough for jitter. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One run of one routine, jittered around the plan.
 *
 * `Morning pages` is deliberately made to overrun — it is the observation the
 * board's insight card is built on, and now the insight is derived from these
 * timings rather than hardcoded, so the data has to actually contain it.
 */
function runSession(routine: Routine, day: string, random: () => number): Session {
  const skipIndex = random() < 0.12 ? Math.floor(random() * routine.tasks.length) : -1;

  const taskSpent: TaskSpent[] = routine.tasks.map((task, i) => {
    if (i === skipIndex) return { taskId: task.id, spent: 0, skipped: true };
    const planned = task.minutes * 60;
    const overrunner = task.title === 'Morning pages';
    // ±25% ordinarily; the overrunner sits 10–45% over its plan four days in five.
    const drift = overrunner
      ? random() < 0.8
        ? 1.1 + random() * 0.35
        : 0.9 + random() * 0.1
      : 0.78 + random() * 0.42;
    return { taskId: task.id, spent: Math.round(planned * drift), skipped: false };
  });

  const spentSec = taskSpent.reduce((n, x) => n + x.spent, 0);
  const done = taskSpent.filter((x) => !x.skipped).length;

  return {
    id: `${routine.id}-${day}`,
    routineId: routine.id,
    day,
    durationMin: Math.max(1, Math.round(spentSec / 60)),
    done,
    total: routine.tasks.length,
    mood: 2 + Math.floor(random() * 3),
    taskSpent,
  };
}

/**
 * Sessions for every routine: an unbroken run of `streak` scheduled days ending
 * yesterday, and a patchier stretch before it so the 30-day chart has gaps and
 * the week-on-week delta has something to compare against.
 */
export function demoSessions(routines: Routine[], now = new Date()): Session[] {
  const out: Session[] = [];
  const today = startOfDay(now);

  HISTORY.forEach((plan, planIndex) => {
    const routine = routines.find((r) => r.id === plan.id);
    if (!routine) return;

    // Seeded on the routine and the date, so the same day rebuilds the same past.
    const random = rng(today.getTime() / 86400000 + planIndex * 7919);

    let scheduledSeen = 0;
    let cursor = addDays(today, -1);

    for (let i = 0; i < plan.window * 2 && scheduledSeen < plan.window; i++) {
      if (isScheduled(routine, cursor)) {
        scheduledSeen++;
        const withinStreak = scheduledSeen <= plan.streak;
        if (withinStreak || random() > plan.missRate) {
          out.push(runSession(routine, dayKey(cursor), random));
        }
      }
      cursor = addDays(cursor, -1);
    }
  });

  return out.sort((a, b) => a.day.localeCompare(b.day));
}

/** Notes hung off real sessions, so their duration and counts are not invented. */
export function demoNotes(sessions: Session[], now = new Date()): NoteEntry[] {
  const bodies: { routineSuffix: string; body: string }[] = [
    {
      routineSuffix: 'morning',
      body: 'Doing the breathing before the bed made the whole thing feel calmer. Keep that order.',
    },
    {
      routineSuffix: 'morning',
      body: 'Woke up late, skipped the pep talk and still finished. Good to know it survives a bad start.',
    },
    {
      routineSuffix: 'morning',
      body: 'Phone stayed in the other room. Easiest morning in weeks.',
    },
    {
      routineSuffix: 'wind',
      body: 'Tea first, then the journal. Asleep before eleven for once.',
    },
  ];

  const out: NoteEntry[] = [];
  bodies.forEach((entry, i) => {
    const routineId = `${ID}${entry.routineSuffix}`;
    const mine = sessions.filter((s) => s.routineId === routineId).slice().reverse();
    // Space them out: most recent, then every second run back.
    const session = mine[i];
    if (!session) return;
    out.push({
      id: `${ID}n${i + 1}`,
      routineId,
      day: label(session.day),
      durationMin: session.durationMin,
      done: session.done,
      total: session.total,
      ring: session.done >= session.total ? 0 : 1,
      body: entry.body,
    });
  });

  return out.sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 4);
}

/** `2026-08-06` → `Thu, Aug 6`, the form the note cards render. */
function label(day: string) {
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export type DemoAccount = {
  routines: Routine[];
  checklists: ChecklistGroup[];
  sessions: Session[];
  notes: NoteEntry[];
};

/** The whole sample phone. Empty everything when the flag is off. */
export function buildDemoAccount(now = new Date()): DemoAccount {
  if (!DEMO_SEED) return { routines: [], checklists: [], sessions: [], notes: [] };

  const routines = DEMO_ROUTINES.map((r) => ({ ...r, tasks: r.tasks.map((x) => ({ ...x })) }));
  const sessions = demoSessions(routines, now);
  return {
    routines,
    checklists: DEMO_CHECKLISTS.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })),
    sessions,
    notes: demoNotes(sessions, now),
  };
}

/** Does this account still look like the untouched sample? Drives the demo badge. */
export const isDemoAccount = (routines: Routine[]) =>
  DEMO_SEED && routines.length > 0 && routines.every((r) => r.id.startsWith(ID));

/** Planned length of a demo routine, for the seed's own sanity checks. */
export const plannedMinutes = (r: Routine) => totalMinutes(r.tasks);
