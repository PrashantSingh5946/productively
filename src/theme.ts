/**
 * The live token objects every screen draws from.
 *
 * `C`, `G`, `SHADOW` and `TASK_TONES` keep a stable identity for the life of the
 * process and are re-filled in place by `applyPalette` when the accent or theme
 * changes — that is what makes the switch instant and screen-agnostic. Because
 * the values move underneath you, **never capture a token into a module-scope
 * style object** (`const CARD = { backgroundColor: C.card }` would freeze at
 * import time). Build styles inside render, or from a factory function.
 *
 * Subscribing to re-renders is `useT()` in ./theming.
 */
import { Accent, Mode, Palette, TaskTone, TaskTones, alpha, buildPalette } from './tokens';

export {
  ACCENTS,
  ACCENT_KEYS,
  IDENTITY,
  accentBase,
  accentLabel,
  accentSwatch,
  // The wheel screen builds a throwaway palette per frame to preview a colour
  // it has not committed to — that is a read, not a theme change, so it calls
  // the builder rather than `applyPalette`.
  buildPalette,
  contrast,
  hslOf,
  isAccent,
  isAccentKey,
  lightnessRamp,
  rgbOf,
  wheelHex,
  wheelHues,
} from './tokens';
export type { Accent, AccentKey, Mode, TaskTone } from './tokens';

const seed = buildPalette('ember', 'light');

/** Semantic colour tokens. Mutated in place — read them during render only. */
export const C: Omit<Palette, 'tasks'> = { ...seed };

/** Task-icon pairs. Hue is identity and never follows the accent. */
export const TASK_TONES: TaskTones = { ...seed.tasks };

/** Gradient stop pairs, referenced as `G.accent` etc. */
export const G = {
  accent: [seed.accentFrom, seed.accentTo] as readonly string[],
  accentTint: [seed.accentTintFrom, seed.accentTintTo] as readonly string[],
  /** v2 folds the old "wash" into the single tint pair. */
  accentWash: [seed.accentTintFrom, seed.accentTintTo] as readonly string[],
  ink: [seed.inkFrom, seed.inkTo] as readonly string[],
  inkDeep: [seed.inkFrom, seed.inkTo] as readonly string[],
  card: [seed.card, seed.card] as readonly string[],
  well: [seed.wellFrom, seed.wellTo] as readonly string[],
  chip: [seed.chipFrom, seed.chipTo] as readonly string[],
  press: [seed.pressFrom, seed.pressTo] as readonly string[],
  over: [seed.overFrom, seed.overTo] as readonly string[],
  stone: [seed.stone, seed.stoneDeep] as readonly string[],
  /** The lightest accent step — hero panels and onboarding backdrops. */
  tintSoft: [seed.accentWash, seed.accentTintFrom] as readonly string[],
  peach: [seed.accentTintFrom, seed.accentTintTo] as readonly string[],
  dawn: [seed.accentTintFrom, seed.paper, seed.paper] as readonly string[],
  sunrise: [seed.accentTintTo, seed.accentTintFrom, seed.card] as readonly string[],
  welcome: [seed.accentTintTo, seed.accentTintFrom, seed.paper] as readonly string[],
};

/**
 * Elevation recipes as `boxShadow` strings — the two-layer contact + ambient
 * pair the board specifies. Dark drops the shadows and lets hairlines carry
 * depth instead.
 */
export const SHADOW = {
  card: '' as string,
  row: '' as string,
  dock: '' as string,
  fab: '' as string,
  sheet: '' as string,
  dialog: '' as string,
  dial: '' as string,
  knob: '' as string,
  icon: '' as string,
  none: 'none' as string,
};

const INK_SHADOW = '32, 27, 23';

function fillShadows(mode: Mode) {
  if (mode === 'dark') {
    // Depth comes from hairlines and surface steps; shadows read as mud on ink.
    SHADOW.card = 'none';
    SHADOW.row = 'none';
    SHADOW.dock = `0px 16px 34px -22px rgba(0, 0, 0, 0.9)`;
    SHADOW.fab = `0px 14px 28px -14px rgba(0, 0, 0, 0.85)`;
    SHADOW.sheet = `0px -12px 44px -20px rgba(0, 0, 0, 0.9)`;
    SHADOW.dialog = `0px 24px 60px -24px rgba(0, 0, 0, 0.95)`;
    SHADOW.dial = 'none';
    SHADOW.knob = `0px 1px 2px rgba(0, 0, 0, 0.5)`;
    SHADOW.icon = 'none';
    return;
  }
  const s = (a: number) => `rgba(${INK_SHADOW}, ${a})`;
  SHADOW.card = `0px 1px 2px ${s(0.04)}, 0px 14px 30px -20px ${s(0.25)}`;
  SHADOW.row = `0px 1px 2px ${s(0.035)}, 0px 10px 22px -18px ${s(0.22)}`;
  SHADOW.dock = `0px 2px 6px ${s(0.05)}, 0px 18px 40px -22px ${s(0.38)}`;
  SHADOW.fab = `0px 3px 8px ${s(0.08)}, 0px 16px 30px -14px ${s(0.42)}`;
  SHADOW.sheet = `0px -10px 44px -18px ${s(0.34)}`;
  SHADOW.dialog = `0px 24px 60px -22px ${s(0.42)}`;
  SHADOW.dial = `0px 6px 18px -10px ${s(0.3)}`;
  SHADOW.knob = `0px 1px 2px ${s(0.28)}`;
  SHADOW.icon = `0px 1px 2px ${s(0.05)}, 0px 6px 14px -10px ${s(0.3)}`;
}

/** Current accent + mode, for anything that needs to branch on them. */
export const activeTheme: { accent: Accent; mode: Mode } = { accent: 'ember', mode: 'light' };

/** Rebuild every token in place. Cheap — called once per theme change. */
export function applyPalette(accent: Accent, mode: Mode) {
  const p = buildPalette(accent, mode);
  const { tasks, ...flat } = p;

  (Object.keys(flat) as (keyof typeof flat)[]).forEach((k) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (C as any)[k] = flat[k];
  });
  (Object.keys(tasks) as TaskTone[]).forEach((k) => {
    TASK_TONES[k] = tasks[k];
  });

  G.accent = [p.accentFrom, p.accentTo];
  G.accentTint = [p.accentTintFrom, p.accentTintTo];
  G.accentWash = [p.accentTintFrom, p.accentTintTo];
  G.ink = [p.inkFrom, p.inkTo];
  G.inkDeep = [p.inkFrom, p.inkTo];
  G.card = [p.card, p.card];
  G.well = [p.wellFrom, p.wellTo];
  G.chip = [p.chipFrom, p.chipTo];
  G.press = [p.pressFrom, p.pressTo];
  G.over = [p.overFrom, p.overTo];
  G.stone = [p.stone, p.stoneDeep];
  G.tintSoft = [p.accentWash, p.accentTintFrom];
  G.peach = [p.accentTintFrom, p.accentTintTo];
  G.dawn = [p.accentTintFrom, p.paper, p.paper];
  G.sunrise = [p.accentTintTo, p.accentTintFrom, p.card];
  G.welcome = [p.accentTintTo, p.accentTintFrom, p.paper];

  fillShadows(mode);
  activeTheme.accent = accent;
  activeTheme.mode = mode;
}

applyPalette('ember', 'light');

/** Translucent ink at an arbitrary alpha — for one-off overlays on any theme. */
export const inkA = (a: number) => alpha(C.hairlineOn, a);

/** Diagonal (135–150°) and vertical gradient directions. */
export const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
export const VERT = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };

export const F = {
  // Bricolage Grotesque — display
  display: 'Bricolage_800ExtraBold',
  displayBold: 'Bricolage_700Bold',
  displaySemi: 'Bricolage_600SemiBold',
  // Instrument Sans — UI
  regular: 'Instrument_400Regular',
  medium: 'Instrument_500Medium',
  semibold: 'Instrument_600SemiBold',
  bold: 'Instrument_700Bold',
} as const;

/** v2 shape scale: card / row-card / tile / coin / pill, sheet top. */
export const RADIUS = {
  card: 24,
  row: 20,
  tile: 16,
  coin: 12,
  pill: 999,
  sheet: 32,
  dialog: 28,
  // legacy aliases kept so older call sites keep compiling
  chip: 16,
  icon: 12,
} as const;

/** Space a tab screen must leave at the bottom so the floating dock clears it. */
export const DOCK_CLEARANCE = 116;

/** Display type is tracked in slightly; overlines are the wide uppercase label. */
export const TYPE = {
  displayTracking: -0.015,
  overline: { size: 10.5, weight: 700 as const, ls: 1.79, transform: 'uppercase' as const },
};
