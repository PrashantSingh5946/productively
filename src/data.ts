/**
 * Seed content. The board is explicit that the app should read as a lived-in
 * account — a 13-day run, real analysis, a small friends list — not a fresh
 * install, so these numbers are the ones drawn on the screens.
 */
import { IconName } from './icons';
import { TaskTone } from './theme';

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
  streak: number;
  /** Rolling completion, shown on the home cards. */
  rate: number;
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

export type Session = {
  id: string;
  routineId: string;
  /** ISO day. */
  day: string;
  durationMin: number;
  done: number;
  total: number;
  mood?: number;
  note?: string;
};

const t = (
  id: string,
  title: string,
  icon: IconName,
  tone: TaskTone,
  minutes: number
): Task => ({ id, title, icon, tone, minutes });

export const MORNING_TASKS: Task[] = [
  t('m1', 'Stretch and drink water', 'bottle', 'water', 2),
  t('m2', 'Tidy up the bed', 'bed', 'bed', 2),
  t('m3', 'Deep breathing', 'leaf', 'leaf', 3),
  t('m4', 'Pep talk', 'heart', 'heart', 3),
  t('m5', 'Morning pages', 'pencil', 'pencil', 10),
  t('m6', 'Coffee, no phone', 'cup', 'cup', 8),
  t('m7', "Pick today's one thing", 'target', 'target', 6),
];

export const ROUTINES: Routine[] = [
  {
    id: 'morning',
    name: 'Morning routine',
    start: 8 * 60,
    days: [1, 2, 3, 4, 5],
    tasks: MORNING_TASKS,
    streak: 12,
    rate: 0.96,
  },
  {
    id: 'deep',
    name: 'Deep work block',
    start: 13 * 60 + 30,
    days: [1, 2, 3, 4, 5],
    tasks: [
      t('d1', 'Silence every notification', 'screen', 'screen', 1),
      t('d2', 'Name the outcome', 'target', 'target', 4),
      t('d3', 'Deep sprint', 'flask', 'pencil', 50),
      t('d4', 'Stand up and stretch', 'dumbbell', 'dumbbell', 5),
    ],
    streak: 6,
    rate: 0.96,
  },
  {
    id: 'wind',
    name: 'Wind down',
    start: 21 * 60 + 30,
    days: [0, 1, 2, 3, 4, 5, 6],
    tasks: [
      t('w1', 'Tea before bed', 'cup', 'cup', 5),
      t('w2', 'Screens off', 'screen', 'screen', 2),
      t('w3', 'Three lines in the journal', 'pencil', 'pencil', 5),
      t('w4', "Tomorrow's one thing", 'target', 'target', 4),
      t('w5', 'Read ten pages', 'book', 'book', 10),
    ],
    streak: 9,
    rate: 0.88,
  },
];

export const CHECKLISTS: ChecklistGroup[] = [
  {
    id: 'go',
    title: 'Before you go',
    items: [
      { id: 'g1', title: 'Wallet, keys, pass', done: true },
      { id: 'g2', title: 'Gas and electronics off', done: true },
      { id: 'g3', title: 'Water bottle refilled', done: false },
      { id: 'g4', title: 'Laptop charger', done: false },
      { id: 'g5', title: 'Headphones', done: true },
      { id: 'g6', title: 'Lunch packed', done: true },
      { id: 'g7', title: 'Office badge', done: true },
      { id: 'g8', title: 'Umbrella if rain', done: false },
    ],
  },
  {
    id: 'reset',
    title: 'Weekly reset',
    items: [
      { id: 'r1', title: 'Empty the inbox', done: true },
      { id: 'r2', title: "Plan next week's blocks", done: false },
      { id: 'r3', title: 'Laundry and sheets', done: false },
      { id: 'r4', title: 'Groceries order', done: false },
    ],
  },
];

export const NOTES: NoteEntry[] = [
  {
    id: 'n1',
    routineId: 'morning',
    day: 'Thu, Aug 6',
    durationMin: 34,
    done: 7,
    total: 7,
    ring: 0,
    body: 'Doing the breathing before the bed made the whole thing feel calmer. Keep that order.',
  },
  {
    id: 'n2',
    routineId: 'morning',
    day: 'Tue, Aug 4',
    durationMin: 41,
    done: 6,
    total: 7,
    ring: 1,
    body: 'Woke up late, skipped the pep talk and still finished. Good to know it survives a bad start.',
  },
  {
    id: 'n3',
    routineId: 'morning',
    day: 'Mon, Aug 3',
    durationMin: 33,
    done: 7,
    total: 7,
    ring: 0,
    body: 'Phone stayed in the other room. Easiest morning in weeks.',
  },
  {
    id: 'n4',
    routineId: 'wind',
    day: 'Wed, Aug 5',
    durationMin: 24,
    done: 5,
    total: 5,
    ring: 0,
    body: 'Tea first, then the journal. Asleep before eleven for once.',
  },
];

/* ── analysis ─────────────────────────────────────────────────────── */

/** 0 miss · 1 partial · 2 done · 3 not scheduled */
export type DayState = 0 | 1 | 2 | 3;

export const WEEK_GRID: { routineId: string; label: string; days: DayState[] }[] = [
  { routineId: 'morning', label: 'Morning', days: [3, 2, 2, 2, 2, 2, 3] },
  { routineId: 'deep', label: 'Deep work', days: [3, 2, 1, 2, 2, 0, 3] },
  { routineId: 'wind', label: 'Wind down', days: [2, 2, 2, 0, 2, 0, 3] },
];

/** Per-routine 30-day bars, as drawn (12 sampled columns). */
export const THIRTY_DAY = [
  { h: 0.52, hit: false },
  { h: 0.74, hit: false },
  { h: 1.0, hit: true },
  { h: 0.88, hit: true },
  { h: 0.36, hit: false },
  { h: 0.92, hit: true },
  { h: 0.7, hit: false },
  { h: 1.0, hit: true },
  { h: 0.96, hit: true },
  { h: 0.44, hit: false },
  { h: 0.86, hit: true },
  { h: 1.0, hit: true },
];

export const TIME_SPENT = [
  { taskId: 'm5', title: 'Morning pages', icon: 'pencil', tone: 'pencil', pct: 0.92, avg: '12m avg', over: true },
  { taskId: 'm6', title: 'Coffee, no phone', icon: 'cup', tone: 'cup', pct: 0.62, avg: '8m avg', over: false },
  { taskId: 'm7', title: "Pick today's one thing", icon: 'target', tone: 'target', pct: 0.44, avg: '5m avg', over: false },
  { taskId: 'm3', title: 'Deep breathing', icon: 'leaf', tone: 'leaf', pct: 0.24, avg: '3m avg', over: false },
] as { taskId: string; title: string; icon: IconName; tone: TaskTone; pct: number; avg: string; over: boolean }[];

export const MOMENTUM_TIERS = [
  { name: 'First light', range: 'day 1', from: 1, to: 1, color: '#FFD9C6' },
  { name: 'Warm-up', range: 'days 2 – 3', from: 2, to: 3, color: '#FFB894' },
  { name: 'Rhythm', range: 'days 4 – 7', from: 4, to: 7, color: '#FF9E73' },
  { name: 'Momentum', range: 'days 8 – 14', from: 8, to: 14, color: '#FF8A5B' },
  { name: 'Groove', range: 'days 15 – 21', from: 15, to: 21, color: '#D95D2B' },
];

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
    iconColor: '#FF9F6D',
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
    iconColor: '#5B9EE0',
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
    iconColor: '#8A807A',
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
    iconColor: '#8A807A',
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
    iconColor: '#7D8FC4',
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
    iconColor: '#7FA98F',
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
    tagBg: '#BD3B34',
    bg: '#FDF3F3',
    iconBg: '#FBE6E6',
    icon: 'heart' as IconName,
    iconColor: '#DC8A88',
  },
  {
    id: 'breath',
    title: 'When breathing\nfeels hard',
    tagBg: '#2F9C78',
    bg: '#EEF7F3',
    iconBg: '#DCEFE7',
    icon: 'leaf' as IconName,
    iconColor: '#68B39A',
  },
];

export const RECOMMENDED_TASKS: Task[] = [
  t('rec1', 'Take your\nmedication', 'pill', 'pill', 1),
  t('rec2', 'Read ten\npages', 'book', 'book', 10),
];

export const PICKER_TASKS: Task[] = [
  t('p1', 'Tea before bed', 'cup', 'cup', 5),
  t('p2', 'Screens off', 'screen', 'screen', 2),
  t('p3', 'Breathe deeply', 'leaf', 'leaf', 4),
  t('p4', 'Check tomorrow', 'cal', 'cal', 3),
  t('p5', 'Medication', 'pill', 'pill', 1),
  t('p6', 'Brain dump', 'pencil', 'pencil', 6),
];

/* ── social ───────────────────────────────────────────────────────── */

export type Friend = {
  id: string;
  name: string;
  status: string;
  avatarBg: string;
  avatarFg: string;
  tierColor?: string;
  running?: boolean;
  quiet?: boolean;
  bookmarked?: boolean;
};

export const FRIENDS: Friend[] = [
  {
    id: 'meera',
    name: 'Meera',
    status: 'Running Morning routine now',
    avatarBg: '#FFFFFF',
    avatarFg: '#CF6A3F',
    tierColor: '#FF8A5B',
    running: true,
  },
  {
    id: 'daran',
    name: 'Daran',
    status: 'Finished 2h ago · 31 days',
    avatarBg: '#E6DED2',
    avatarFg: '#B09B7F',
    tierColor: '#D95D2B',
    bookmarked: true,
  },
  {
    id: 'althea',
    name: 'Althea',
    status: 'Finished 5h ago · 6 days',
    avatarBg: '#DFE7E2',
    avatarFg: '#95AB9F',
    tierColor: '#FFB894',
  },
  {
    id: 'rue',
    name: 'Rue',
    status: 'Quiet for 3 days',
    avatarBg: '#E4E2EE',
    avatarFg: '#A09CBB',
    quiet: true,
  },
];

export type FeedPost = {
  id: string;
  friendId: string;
  name: string;
  ago: string;
  avatarBg: string;
  avatarFg: string;
  tierColor: string;
  routines: string[];
  duration: string;
  window: string;
  tasks: { title: string; icon: IconName; color: string; len: string }[];
  more: number;
};

export const FEED: FeedPost[] = [
  {
    id: 'f1',
    friendId: 'daran',
    name: 'Daran',
    ago: '2h ago',
    avatarBg: '#E6DED2',
    avatarFg: '#B09B7F',
    tierColor: '#D95D2B',
    routines: ['Morning routine', 'Night routine'],
    duration: '11m 30s',
    window: '9:00am – 9:11am',
    tasks: [
      { title: 'Play something instrumental', icon: 'leaf', color: '#7FA98F', len: '30s' },
      { title: 'Make the bed', icon: 'bed', color: '#B39A6D', len: '1m' },
      { title: 'Cold shower', icon: 'drop', color: '#5B9EE0', len: '1m' },
      { title: 'Three lines in the journal', icon: 'pencil', color: '#8A807A', len: '2m' },
    ],
    more: 3,
  },
  {
    id: 'f2',
    friendId: 'althea',
    name: 'Althea',
    ago: '5h ago',
    avatarBg: '#DFE7E2',
    avatarFg: '#95AB9F',
    tierColor: '#FFB894',
    routines: ['Evening reset'],
    duration: '18m 04s',
    window: '8:40pm – 8:58pm',
    tasks: [
      { title: 'Tea before bed', icon: 'cup', color: '#C19A5B', len: '5m' },
      { title: 'Screens off', icon: 'screen', color: '#8A807A', len: '2m' },
      { title: 'Read ten pages', icon: 'book', color: '#C19A5B', len: '10m' },
    ],
    more: 1,
  },
];

export const STORY = {
  kicker: 'USER STORY · DINA',
  title: 'How a marketer with two jobs protects her mornings',
};

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
  'Wrong translation',
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

export const APP_ICONS = [
  { id: 'default', name: 'Default', bg: ['#FFA47C', '#FF7A45'], fg: '#241F1C' },
  { id: 'paper', name: 'Paper', bg: ['#FFFFFF', '#FFFFFF'], fg: '#D95D2B', border: true },
  { id: 'gentle', name: 'Gentle day', bg: ['#FFE4D5', '#FF8A5B'], fg: '#8F3D22' },
  { id: 'deep', name: 'Deep immersion', bg: ['#453D36', '#241F1C'], fg: '#FF8A5B' },
  { id: 'calm', name: 'Calm mind', bg: ['#EEF0F2', '#EEF0F2'], fg: '#9AA0A8' },
  { id: 'clay', name: 'Clay', bg: ['#F3E6DD', '#F3E6DD'], fg: '#A8492A' },
  { id: 'soft', name: 'Soft start', bg: ['#FFF0E7', '#FFDCCB'], fg: '#D95D2B' },
];

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

export function tierFor(streak: number) {
  return (
    MOMENTUM_TIERS.find((x) => streak >= x.from && streak <= x.to) ??
    MOMENTUM_TIERS[MOMENTUM_TIERS.length - 1]
  );
}
