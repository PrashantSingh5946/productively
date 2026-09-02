/**
 * Static content — the library, the guide, the onboarding copy — and the shapes
 * everything else is built from.
 *
 * What is *not* here any more: the user's account. The board draws a lived-in
 * 13-day history, and this file used to hold that history as frozen numbers
 * (`WEEK_GRID`, `THIRTY_DAY`, `TIME_SPENT`, a `streak` on each routine) that the
 * analysis screens rendered as though they had been calculated. They are now
 * generated as real sessions in ./demo and derived in ./analytics.
 */
import { IconName } from './icons';
import { C, IDENTITY, TaskTone } from './theme';
import { TASK_ICON_FG } from './tokens';

export type Task = {
  id: string;
  title: string;
  icon: IconName;
  tone: TaskTone;
  minutes: number;
};

export type Routine = {
  id: string;
  name: string;
  /** Minutes past midnight. */
  start: number;
  /** 0 = Sunday. */
  days: number[];
  tasks: Task[];
};

export type ChecklistGroup = {
  id: string;
  title: string;
  items: { id: string; title: string; done: boolean }[];
};

export type NoteEntry = {
  id: string;
  routineId: string;
  day: string;
  durationMin: number;
  done: number;
  total: number;
  /** 0 full, 1 partial. */
  ring: 0 | 1;
  body: string;
};

/** What one task cost on one run. `spent` is seconds. */
export type TaskSpent = { taskId: string; spent: number; skipped: boolean };

export type Session = {
  id: string;
  routineId: string;
  /** Local calendar day, `YYYY-MM-DD`. See `dayKey` in ./analytics. */
  day: string;
  durationMin: number;
  done: number;
  total: number;
  mood?: number;
  note?: string;
  /**
   * Per-task timings. Optional because sessions recorded before this existed
   * do not have it — "where the time goes" skips those runs rather than
   * averaging in a zero.
   */
  taskSpent?: TaskSpent[];
};

const t = (
  id: string,
  title: string,
  icon: IconName,
  tone: TaskTone,
  minutes: number
): Task => ({ id, title, icon, tone, minutes });

/* ── analysis ─────────────────────────────────────────────────────── */

/** 0 miss · 1 partial · 2 done · 3 not scheduled or not here yet */
export type DayState = 0 | 1 | 2 | 3;

export const MOMENTUM_TIERS = [
  { name: 'First light', range: 'day 1', from: 1, to: 1, step: 0 },
  { name: 'Warm-up', range: 'days 2 – 3', from: 2, to: 3, step: 1 },
  { name: 'Rhythm', range: 'days 4 – 7', from: 4, to: 7, step: 2 },
  { name: 'Momentum', range: 'days 8 – 14', from: 8, to: 14, step: 3 },
  { name: 'Groove', range: 'days 15 – 21', from: 15, to: 21, step: 4 },
];

/** Live colour for a momentum step — reads the accent ramp, so it recolours. */
export const stepColor = (step: number) => C.accentRamp[Math.min(step, C.accentRamp.length - 1)];

/* ── explore ──────────────────────────────────────────────────────── */

export type Template = {
  id: string;
  name: string;
  blurb: string;
  about: string;
  minutes: number;
  icon: IconName;
  iconColor: string;
  badge?: { label: string; tone: 'popular' | 'beginner' };
  using?: string;
  category: 'Morning' | 'Evening' | 'Focus' | 'Rest';
  tasks: Task[];
};

export const TEMPLATES: Template[] = [
  {
    id: 'reset30',
    name: 'The 30-minute reset',
    blurb: 'Everything you want out of a morning',
    about:
      "Short enough to survive a bad night's sleep. Six small anchors that get you out of bed, hydrated and pointed at one clear thing before the day starts asking for you.",
    minutes: 30,
    icon: 'sun',
    iconColor: TASK_ICON_FG.sun,
    badge: { label: 'POPULAR', tone: 'popular' },
    using: '14.2k using',
    category: 'Morning',
    tasks: [
      t('r30-1', 'Drink a full glass of water', 'bottle', 'water', 1),
      t('r30-2', 'Make the bed', 'bed', 'bed', 2),
      t('r30-3', 'Box breathing', 'leaf', 'leaf', 4),
      t('r30-4', 'Move for a song', 'dumbbell', 'dumbbell', 4),
      t('r30-5', 'Coffee away from the phone', 'cup', 'cup', 10),
      t('r30-6', "Name today's one thing", 'target', 'target', 9),
    ],
  },
  {
    id: 'calm',
    name: 'Calm and ready',
    blurb: 'A morning where you lead, gently',
    about:
      'For mornings that already feel loud. Nothing here asks for effort you have not got — it just puts the first three decisions of the day on rails.',
    minutes: 22,
    icon: 'bottle',
    iconColor: TASK_ICON_FG.water,
    badge: { label: 'BEGINNER', tone: 'beginner' },
    category: 'Morning',
    tasks: [
      t('calm-1', 'Water before anything', 'bottle', 'water', 1),
      t('calm-2', 'Open a window', 'leaf', 'leaf', 2),
      t('calm-3', 'Slow breathing', 'leaf', 'leaf', 5),
      t('calm-4', 'Warm drink, sitting down', 'cup', 'cup', 8),
      t('calm-5', 'One line in the journal', 'pencil', 'pencil', 6),
    ],
  },
  {
    id: 'energy',
    name: 'Energy boost',
    blurb: 'Build an energetic day from minute one',
    about:
      'Movement first, decisions second. Best on the days you already know you will be sitting down for eight hours.',
    minutes: 26,
    icon: 'dumbbell',
    iconColor: TASK_ICON_FG.pencil,
    category: 'Morning',
    tasks: [
      t('en-1', 'Cold shower', 'drop', 'drop', 3),
      t('en-2', 'Move for two songs', 'dumbbell', 'dumbbell', 8),
      t('en-3', 'Protein and water', 'bottle', 'water', 10),
      t('en-4', "Pick today's one thing", 'target', 'target', 5),
    ],
  },
  {
    id: 'shutdown',
    name: 'The shutdown',
    blurb: 'Close the working day properly',
    about:
      'A short sequence that tells your head the day is finished, so the evening does not get spent half-working.',
    minutes: 18,
    icon: 'moon',
    iconColor: TASK_ICON_FG.pencil,
    category: 'Evening',
    tasks: [
      t('sd-1', 'Clear the inbox to zero', 'mail', 'cal', 6),
      t('sd-2', "Write tomorrow's three", 'pencil', 'pencil', 5),
      t('sd-3', 'Tidy the desk', 'rows', 'bed', 3),
      t('sd-4', 'Screens off', 'screen', 'screen', 4),
    ],
  },
  {
    id: 'sprint',
    name: 'Focus sprint',
    blurb: 'One block, no negotiation',
    about: 'A single protected stretch with a warm-up and a hard stop on either side.',
    minutes: 60,
    icon: 'target',
    iconColor: TASK_ICON_FG.target,
    category: 'Focus',
    tasks: [
      t('sp-1', 'Silence notifications', 'screen', 'screen', 1),
      t('sp-2', 'Write the outcome down', 'pencil', 'pencil', 4),
      t('sp-3', 'Deep sprint', 'flask', 'pencil', 50),
      t('sp-4', 'Stand up and stretch', 'dumbbell', 'dumbbell', 5),
    ],
  },
  {
    id: 'sunday',
    name: 'Slow Sunday',
    blurb: 'A rest day with a little shape',
    about: 'Enough structure to stop the day evaporating, not so much that it becomes work.',
    minutes: 40,
    icon: 'leaf',
    iconColor: TASK_ICON_FG.leaf,
    category: 'Rest',
    tasks: [
      t('su-1', 'Walk without a podcast', 'leaf', 'leaf', 20),
      t('su-2', 'Read ten pages', 'book', 'book', 10),
      t('su-3', 'Tea, properly made', 'cup', 'cup', 10),
    ],
  },
];

export const RESET_CARDS = [
  {
    id: 'anxious',
    title: 'When you feel\nanxious',
    tone: 'alert' as const,
    tagBg: IDENTITY.tagAlert,
    icon: 'heart' as IconName,
    iconColor: IDENTITY.tagAlertIcon,
  },
  {
    id: 'breath',
    title: 'When breathing\nfeels hard',
    tone: 'fresh' as const,
    tagBg: IDENTITY.tagFresh,
    icon: 'leaf' as IconName,
    iconColor: IDENTITY.tagFreshIcon,
  },
];

/**
 * What is behind a reset card.
 *
 * Both cards used to open the article index — the same destination as every
 * other card on the screen, and the wrong shape entirely: a rescue card is
 * something you tap *while* it is happening, and reading five volumes on habit
 * design is not that. Each is a short paced sequence instead, run by
 * `app/reset/[id].tsx`.
 *
 * `loop` repeats the steps until stopped, which is what a breathing exercise
 * is; grounding runs once and finishes.
 */
export type ResetStep = { label: string; note?: string; seconds: number };

export type ResetGuide = {
  id: string;
  title: string;
  lede: string;
  loop: boolean;
  steps: ResetStep[];
  after: string;
};

export const RESET_GUIDES: ResetGuide[] = [
  {
    id: 'anxious',
    title: 'When you feel anxious',
    lede: 'Anxiety runs on the future. This drags attention back to the room you are actually in, one sense at a time. Say the answers out loud if you can.',
    loop: false,
    steps: [
      { label: 'Five things you can see', note: 'Ordinary ones. The door, your hands.', seconds: 40 },
      { label: 'Four things you can feel', note: 'The chair, the floor, fabric, temperature.', seconds: 35 },
      { label: 'Three things you can hear', note: 'Including the quiet ones underneath.', seconds: 30 },
      { label: 'Two things you can smell', note: 'Or two you like the smell of.', seconds: 25 },
      { label: 'One slow breath', note: 'All the way out. Longer than you think.', seconds: 20 },
    ],
    after: 'If it has not shifted, run it again. It works by repetition, not insight.',
  },
  {
    id: 'breath',
    title: 'When breathing feels hard',
    lede: 'A long out-breath is the one lever you have on your own nervous system. Follow the ring — in for four, hold for four, out for six. Stop whenever you like.',
    loop: true,
    steps: [
      { label: 'Breathe in', note: 'Through the nose, into the belly.', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Breathe out', note: 'Slowly, through the mouth.', seconds: 6 },
      { label: 'Rest', seconds: 2 },
    ],
    after: 'Six or seven rounds is usually enough. Light-headed means you are pulling too hard — go shallower.',
  },
];

export const RECOMMENDED_TASKS: Task[] = [
  t('rec1', 'Take your\nmedication', 'pill', 'pill', 1),
  t('rec2', 'Read ten\npages', 'book', 'book', 10),
];

/**
 * The icon set offered when someone writes their own task.
 *
 * Icon and tone travel together — the hue is part of what the glyph means, and
 * letting the two be chosen separately produces a blue dumbbell. Ordered by how
 * often a morning or evening routine reaches for them.
 */
export const TASK_PALETTE: { icon: IconName; tone: TaskTone }[] = [
  { icon: 'check', tone: 'target' },
  { icon: 'bottle', tone: 'water' },
  { icon: 'cup', tone: 'cup' },
  { icon: 'leaf', tone: 'leaf' },
  { icon: 'dumbbell', tone: 'dumbbell' },
  { icon: 'bed', tone: 'bed' },
  { icon: 'drop', tone: 'drop' },
  { icon: 'pill', tone: 'pill' },
  { icon: 'book', tone: 'book' },
  { icon: 'pencil', tone: 'pencil' },
  { icon: 'target', tone: 'target' },
  { icon: 'heart', tone: 'heart' },
  { icon: 'screen', tone: 'screen' },
  { icon: 'cal', tone: 'cal' },
  { icon: 'sun', tone: 'sun' },
  { icon: 'moon', tone: 'moon' },
  { icon: 'mail', tone: 'cal' },
  { icon: 'flask', tone: 'pencil' },
];

export const PICKER_TASKS: Task[] = [
  t('p1', 'Tea before bed', 'cup', 'cup', 5),
  t('p2', 'Screens off', 'screen', 'screen', 2),
  t('p3', 'Breathe deeply', 'leaf', 'leaf', 4),
  t('p4', 'Check tomorrow', 'cal', 'cal', 3),
  t('p5', 'Medication', 'pill', 'pill', 1),
  t('p6', 'Brain dump', 'pencil', 'pencil', 6),
];

/* ── guide ────────────────────────────────────────────────────────── */

export type Article = {
  id: string;
  vol: string;
  title: string;
  blurb?: string;
  icon: IconName;
  heading: string;
  lede: string;
  sections: { h: string; p: string; muted?: string }[];
};

export const ARTICLES: Article[] = [
  {
    id: 'what',
    vol: 'vol. 01',
    title: 'What is a routine?',
    blurb: 'Designing habits that organise a life',
    icon: 'help',
    heading: "A routine isn't a rigid checklist",
    lede: "It's a system you assemble around your own energy, and it should survive a bad night's sleep. This guide walks through building a morning you can keep — and how to set it up here.",
    sections: [
      {
        h: '1. Start with why',
        p: 'A routine only lasts if it means something. If it\'s a list of things you should do, it becomes a debt.',
        muted: 'Before you add a single task, ask what you want the morning to solve.',
      },
      {
        h: '2. Three anchors, not thirty',
        p: 'Pick the smallest set you could still do on your worst morning. Everything after that is a bonus, not a requirement.',
        muted: 'Two minutes of water and a made bed beats an hour you skip.',
      },
      {
        h: '3. Let the timer carry it',
        p: 'The point of a timer is not speed. It removes the decision of when to stop, which is where most routines quietly die.',
      },
    ],
  },
  {
    id: 'start',
    vol: 'vol. 02',
    title: 'How to start one',
    blurb: 'A simple, sustainable approach',
    icon: 'book',
    heading: 'Start smaller than feels worthwhile',
    lede: 'Most abandoned routines were simply too big on day one. Here is the version that survives contact with a real week.',
    sections: [
      {
        h: 'Week one: show up',
        p: 'Three tasks, under ten minutes, same time every day. Completion is the only metric that matters this week.',
      },
      {
        h: 'Week two: add one thing',
        p: 'Only once the first three feel automatic. If a week goes badly, add nothing and hold.',
        muted: 'The streak is a side effect, not the goal.',
      },
    ],
  },
  {
    id: 'bends',
    vol: 'vol. 03',
    title: 'Designing a routine that bends',
    blurb: 'A practical structure for real weeks',
    icon: 'rows',
    heading: 'Build in the version for bad days',
    lede: 'A routine that only works when everything goes right is a routine you will lose the first time it does not.',
    sections: [
      {
        h: 'Keep a short version',
        p: 'Mark the two or three tasks that are non-negotiable. On a bad morning, run only those and still count the day.',
      },
      {
        h: 'Move, do not delete',
        p: 'If a task overruns four days in five, it is in the wrong place — not the wrong routine.',
        muted: 'Analysis will tell you which one before you notice it yourself.',
      },
    ],
  },
  {
    id: 'consistency',
    vol: 'vol. 04',
    title: 'When consistency beats speed',
    blurb: 'For when timers feel like pressure',
    icon: 'target',
    heading: 'The timer is a fence, not a whip',
    lede: 'If the countdown makes you anxious, you are reading it as a target. It is a boundary.',
    sections: [
      {
        h: 'Turn off remaining time',
        p: 'In Timer settings you can hide the countdown entirely and keep only the ring. Most people who nearly quit did this instead.',
      },
      {
        h: 'Overrun is data',
        p: 'Going over is not a failure — it is the app telling you the estimate was wrong. Adjust the estimate.',
      },
    ],
  },
  {
    id: 'ending',
    vol: 'vol. 05',
    title: 'Ending the day on purpose',
    icon: 'moon',
    heading: 'An evening routine is mostly subtraction',
    lede: 'Mornings are about starting. Evenings are about stopping, which is harder and gets less attention.',
    sections: [
      {
        h: 'Decide when the day ends',
        p: 'Set an end-of-day time in Settings and let the app draw the line for you.',
      },
      {
        h: 'Leave tomorrow a note',
        p: 'One line about the single thing that matters tomorrow removes most of the friction from the next morning.',
      },
    ],
  },
];

export const CONTACT_TOPICS = [
  'Backup, sync or lost data',
  'Notifications or alarms',
  'Performance or battery',
  'Something else',
];

/* ── onboarding copy ──────────────────────────────────────────────── */

export const INTENTS = [
  { id: 'doing', label: 'Stop planning, start doing', icon: 'play' as IconName },
  { id: 'schedule', label: 'Stay on top of my schedule', icon: 'cal' as IconName },
  { id: 'focus', label: 'Master deep focus', icon: 'target' as IconName },
  { id: 'track', label: 'Track every task I have', icon: 'check' as IconName },
  { id: 'moment', label: 'Take a moment for myself', icon: 'cup' as IconName },
  { id: 'energy', label: 'Own my daily energy', icon: 'spark' as IconName },
];

export const STRUGGLES = [
  'I keep planning without taking action',
  'I struggle to manage my schedule',
  'I struggle to stay focused',
  'I keep forgetting my tasks',
  "I'm constantly busy without a break",
  'I feel drained and unmotivated',
];

export const FIRST_ROUTINE_TASKS: Task[] = [
  t('f1', 'Stretch and drink water', 'bottle', 'water', 2),
  t('f2', 'Tidy up the bed', 'bed', 'bed', 2),
  t('f3', 'Give yourself a pep talk', 'heart', 'heart', 3),
];

const APP_ICON_NAMES: Record<keyof typeof IDENTITY.icons, string> = {
  default: 'Default',
  paper: 'Paper',
  gentle: 'Gentle day',
  deep: 'Deep immersion',
  calm: 'Calm mind',
  clay: 'Clay',
  soft: 'Soft start',
  sky: 'Sky',
  moss: 'Moss',
  orchid: 'Orchid',
};

export type AppIcon = { id: string; name: string; bg: readonly string[]; fg: string; border?: boolean };

export const APP_ICONS: AppIcon[] = (
  Object.keys(IDENTITY.icons) as (keyof typeof IDENTITY.icons)[]
).map((id) => {
  const art = IDENTITY.icons[id] as { bg: readonly string[]; fg: string; border?: boolean };
  return { id, name: APP_ICON_NAMES[id], bg: art.bg, fg: art.fg, border: art.border };
});


/* ── helpers ──────────────────────────────────────────────────────── */

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function daysLabel(days: number[]): string {
  if (days.length === 7) return 'S·M·T·W·T·F·S';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LETTERS[d])
    .join('·');
}

export function fmtClock(mins: number, h24 = false): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (h24) return `${String(h).padStart(2, '0')}:${mm}`;
  const suffix = h < 12 ? 'am' : 'pm';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${mm}${suffix}`;
}

export function totalMinutes(tasks: Task[]): number {
  return tasks.reduce((s, x) => s + x.minutes, 0);
}

export function mmss(seconds: number): string {
  const s = Math.max(0, Math.abs(Math.round(seconds)));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The momentum tier a streak sits in.
 *
 * Clamped at both ends. A streak of 0 used to fall through the `find` and land
 * on the *last* tier, so a brand-new account drew its rail as "0 · 1 · 🏆 · 22 ·
 * 23" — the milestones for someone three weeks in.
 */
export function tierFor(streak: number) {
  if (streak < MOMENTUM_TIERS[0].from) return MOMENTUM_TIERS[0];
  return (
    MOMENTUM_TIERS.find((x) => streak >= x.from && streak <= x.to) ??
    MOMENTUM_TIERS[MOMENTUM_TIERS.length - 1]
  );
}
