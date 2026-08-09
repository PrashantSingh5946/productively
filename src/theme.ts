/**
 * Design tokens transcribed from the Productively screen board.
 * Persimmon accent on warm-stone ink, sand-tinted cards.
 */

export const C = {
  // accent (persimmon)
  accent: '#FF8A5B',
  accentFrom: '#FFA47C',
  accentTo: '#FF7A45',
  accentDeep: '#D95D2B',
  accentInk: '#A8492A',
  accentInkDeep: '#8F3D22',
  accentInkSoft: '#CF6A3F',
  accentTintFrom: '#FFE6D9',
  accentTintTo: '#FFCDB6',
  accentWashFrom: '#FFF7F2',
  accentWashTo: '#FFE9DD',
  accentWashBorder: '#FFCDB4',

  // ink / neutrals
  ink: '#241F1C',
  inkFrom: '#4A423B',
  inkTo: '#332C27',
  inkDeepFrom: '#453D36',
  inkDeepTo: '#241F1C',
  text: '#3A332E',
  textMid: '#5D554E',
  textSoft: '#8B827A',
  muted: '#A49A92',
  faint: '#B3AAA2',
  ghost: '#C6BDB5',
  wisp: '#D6CEC7',

  // surfaces
  white: '#FFFFFF',
  cardFrom: '#FAF7F3',
  cardTo: '#F2ECE6',
  wellFrom: '#EFE9E2',
  wellTo: '#E7E0D8',
  chipFrom: '#F5F0EA',
  chipTo: '#EDE7E0',
  pressFrom: '#F2EDE7',
  pressTo: '#EAE3DB',
  hairline: '#F2ECE6',
  border: '#EAE4DD',
  borderStrong: '#E4DDD6',
  ring: '#DDD5CD',
  track: '#E8E1DA',
  disabled: '#ECE7E0',

  // semantic
  good: '#7FA98F',
  goodInk: '#4C7A63',
  goodBg: '#EEF3F0',
  over: '#A8342A',
  overRing: '#C9503A',
  danger: '#BD3B34',
  info: '#3C72C8',
  infoBg: '#EEF3FD',
} as const;

/** Task-icon colour pairs used across routines. */
export const TASK_TONES = {
  water: { bg: '#E8F2FC', fg: '#5B9EE0' },
  bed: { bg: '#F3EFE6', fg: '#B39A6D' },
  leaf: { bg: '#EEF3F0', fg: '#7FA98F' },
  heart: { bg: '#FDEAEC', fg: '#D1685F' },
  pencil: { bg: '#F1F0F6', fg: '#8A807A' },
  cup: { bg: '#F6EFE4', fg: '#C19A5B' },
  target: { bg: '#EEF1F8', fg: '#7D8FC4' },
  pill: { bg: '#FBE6E6', fg: '#C4726F' },
  book: { bg: '#F6EFE4', fg: '#C19A5B' },
  dumbbell: { bg: '#F1F0F6', fg: '#8A807A' },
  screen: { bg: '#F1F0F6', fg: '#8A807A' },
  sun: { bg: '#FFF0E7', fg: '#FF9F6D' },
  moon: { bg: '#F1F0F6', fg: '#8A807A' },
  drop: { bg: '#E8F2FC', fg: '#5B9EE0' },
  cal: { bg: '#EEF1F8', fg: '#7D8FC4' },
  bottle: { bg: '#E8F2FC', fg: '#5B9EE0' },
} as const;

export type TaskTone = keyof typeof TASK_TONES;

/** Gradient stop pairs, referenced as G.card etc. */
export const G = {
  accent: [C.accentFrom, C.accentTo] as const,
  accentTint: [C.accentTintFrom, C.accentTintTo] as const,
  accentWash: [C.accentWashFrom, C.accentWashTo] as const,
  ink: [C.inkFrom, C.inkTo] as const,
  inkDeep: [C.inkDeepFrom, C.inkDeepTo] as const,
  card: [C.cardFrom, C.cardTo] as const,
  well: [C.wellFrom, C.wellTo] as const,
  chip: [C.chipFrom, C.chipTo] as const,
  press: [C.pressFrom, C.pressTo] as const,
  peach: ['#FFF0E7', '#FFDCCB'] as const,
  dawn: ['#FFF6F0', '#FFF1E9', '#FFECE1'] as const,
  sunrise: ['#FFD9C6', '#FFF3EC', '#FFFFFF'] as const,
  welcome: ['#FFE4D5', '#FFF6F0', '#FFFCFA'] as const,
} as const;

/** Diagonal-ish direction matching the board's 135°/140° CSS gradients. */
export const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
export const VERT = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };

export const F = {
  // Bricolage Grotesque — display
  display: 'Bricolage_800ExtraBold',
  displayBold: 'Bricolage_700Bold',
  displaySemi: 'Bricolage_600SemiBold',
  // Instrument Sans — text
  regular: 'Instrument_400Regular',
  medium: 'Instrument_500Medium',
  semibold: 'Instrument_600SemiBold',
  bold: 'Instrument_700Bold',
} as const;

export const RADIUS = {
  pill: 999,
  card: 22,
  sheet: 26,
  tile: 18,
  chip: 14,
  icon: 11,
} as const;
