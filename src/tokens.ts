/**
 * v2 token layer.
 *
 * One base colour goes in, the whole accent family comes out — derived once per
 * theme build, never per frame. Everything the app draws resolves through the
 * `Palette` this module produces; screens never name a raw hex.
 *
 * Derivation rules (plan §4.2):
 *   hue & saturation — take the preset's hue shift and saturation ratio against
 *     Ember and apply them to every reference token;
 *   lightness        — anchor the base's lightness and scale the family around
 *     it, never lightening a dark text token;
 *   on-accent        — ink on the fill while it stays light enough, white once
 *     the derived fill drops below the 4.5:1 ink threshold.
 */

/* ── colour maths ─────────────────────────────────────────────────── */

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

const byte = (v: number) =>
  Math.round(clamp(v) * 255)
    .toString(16)
    .padStart(2, '0');

const rgbToHex = ({ r, g, b }: RGB) => `#${byte(r)}${byte(g)}${byte(b)}`.toUpperCase();

function rgbToHsl({ r, g, b }: RGB): HSL {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return { h: (h + 360) % 360, s: clamp(s), l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return { r: clamp(rgb[0] + m), g: clamp(rgb[1] + m), b: clamp(rgb[2] + m) };
}

const toHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
const toHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));

/** WCAG relative luminance. */
function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two opaque colours, 1–21. */
export function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `#RRGGBB` at an alpha, as the `rgba()` string RN and expo-linear-gradient take. */
export function alpha(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/** Flatten `fg` at `a` over an opaque `bg` — used to contrast-check tints. */
function over(fg: string, a: number, bg: string) {
  const f = hexToRgb(fg);
  const k = hexToRgb(bg);
  return rgbToHex({
    r: f.r * a + k.r * (1 - a),
    g: f.g * a + k.g * (1 - a),
    b: f.b * a + k.b * (1 - a),
  });
}

/** Walk lightness until `fg` clears `ratio` against `bg`, or we run out of room. */
function ensureContrast(fg: string, bg: string, ratio: number, dir: 'darken' | 'lighten') {
  const step = dir === 'darken' ? -0.01 : 0.01;
  const hsl = toHsl(fg);
  let l = hsl.l;
  for (let i = 0; i < 100; i++) {
    const candidate = toHex({ ...hsl, l });
    if (contrast(candidate, bg) >= ratio) return candidate;
    l = clamp(l + step);
    if (l === 0 || l === 1) break;
  }
  return toHex({ ...hsl, l });
}

/* ── accent presets ───────────────────────────────────────────────── */

export const ACCENTS = {
  ember: { key: 'ember', label: 'Ember', base: '#FF8A5B', note: 'Brand persimmon' },
  sky: { key: 'sky', label: 'Sky', base: '#6AA9F0', note: 'Cool alternative' },
  moss: { key: 'moss', label: 'Moss', base: '#86BF6A', note: 'Calm green' },
  orchid: { key: 'orchid', label: 'Orchid', base: '#C98FD6', note: 'Lavender' },
} as const;

export type AccentKey = keyof typeof ACCENTS;
export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];
export const isAccentKey = (v: unknown): v is AccentKey =>
  typeof v === 'string' && (ACCENT_KEYS as string[]).includes(v);

/**
 * An accent is either one of the four presets or a colour the user mixed on
 * the wheel, carried as its own `#RRGGBB`.
 *
 * Storing the hex rather than an index into a saved-themes array is what keeps
 * a custom accent working after the theme it came from is deleted, and what
 * lets `buildPalette` stay a pure function of (colour, mode) — every one of the
 * forty-odd accent tokens is derived from the base by `deriveAccent`, so a
 * mixed colour is not a special case anywhere below this line.
 */
export type Accent = AccentKey | string;

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Is this a colour we can build a palette from — a preset key or a hex? */
export const isAccent = (v: unknown): v is Accent =>
  isAccentKey(v) || (typeof v === 'string' && HEX6.test(v));

/** The base colour behind an accent, whichever of the two forms it takes. */
export const accentBase = (a: Accent) => (isAccentKey(a) ? ACCENTS[a].base : a.toUpperCase());

/** Preset label, or the hex itself for a mixed colour. */
export const accentLabel = (a: Accent) => (isAccentKey(a) ? ACCENTS[a].label : a.toUpperCase());

/** Ember's family, verbatim from the board. Every other preset is a remap of it. */
const REF = {
  base: ACCENTS.ember.base,
  fillFrom: '#FF9E70',
  fillTo: '#FF7440',
  tintFrom: '#FFF3EA',
  tintTo: '#FFE4D2',
  tintBorder: '#FFCFB2',
  text: '#A8441F',
  icon: '#D6642F',
} as const;

export type Mode = 'light' | 'dark';

type AccentFamily = {
  base: string;
  fillFrom: string;
  fillTo: string;
  tintFrom: string;
  tintTo: string;
  tintBorder: string;
  text: string;
  icon: string;
  /** Ink or white, whichever clears 4.5:1 on the fill. */
  onFill: string;
};

/**
 * On-accent content is measured against the *dark* ink in both themes: accent
 * fills stay light-valued even in dark mode, so the foreground that sits on
 * them does not flip with the theme — only with the preset's own luminance.
 */
const ON_ACCENT_INK = '#201B17';

function deriveAccent(baseHex: string, mode: Mode, paperCard: string): AccentFamily {
  const ref = toHsl(REF.base);
  const b = toHsl(baseHex);
  const dh = b.h - ref.h;
  const satRatio = ref.s === 0 ? 1 : b.s / ref.s;

  /**
   * Hue/saturation shift, then re-anchor lightness on the preset's base: tokens
   * lighter than Ember's base keep their proportion of the room above it,
   * darker tokens keep their proportion of the room below.
   */
  const remap = (hex: string, noLighten = false) => {
    const c = toHsl(hex);
    const h = (((c.h + dh) % 360) + 360) % 360;
    const s = clamp(c.s * satRatio);
    let l: number;
    if (c.l >= ref.l) {
      const t = ref.l >= 1 ? 0 : (c.l - ref.l) / (1 - ref.l);
      l = b.l + t * (1 - b.l);
    } else {
      const t = ref.l <= 0 ? 0 : c.l / ref.l;
      l = t * b.l;
    }
    if (noLighten) l = Math.min(l, c.l);
    return toHex({ h, s, l });
  };

  const fillFrom = remap(REF.fillFrom);
  const fillTo = remap(REF.fillTo);

  if (mode === 'light') {
    const tintFrom = remap(REF.tintFrom);
    const tintTo = remap(REF.tintTo);
    // Text and icons sit on the tint gradient; its darker stop is the worst case.
    const text = ensureContrast(remap(REF.text, true), tintTo, 4.5, 'darken');
    const icon = ensureContrast(remap(REF.icon, true), tintTo, 3, 'darken');
    return {
      base: baseHex,
      fillFrom,
      fillTo,
      tintFrom,
      tintTo,
      tintBorder: remap(REF.tintBorder),
      text,
      icon,
      onFill: contrast(ON_ACCENT_INK, fillTo) >= 4.5 ? ON_ACCENT_INK : '#FFFFFF',
    };
  }

  // Dark: fills gain 6 points of lightness, tints become low-alpha overlays of
  // the base, and text/icons flip to the light end of the family.
  const lift = (hex: string) => {
    const c = toHsl(hex);
    return toHex({ ...c, l: clamp(c.l + 0.06) });
  };
  const darkFillFrom = lift(fillFrom);
  const darkFillTo = lift(fillTo);
  const tintFrom = alpha(baseHex, 0.1);
  const tintTo = alpha(baseHex, 0.16);
  // Contrast-check against the flattened tint rather than the alpha string.
  const flatTint = over(baseHex, 0.16, paperCard);
  const lightEnd = toHex({ ...toHsl(baseHex), l: clamp(toHsl(baseHex).l + 0.14) });
  return {
    base: baseHex,
    fillFrom: darkFillFrom,
    fillTo: darkFillTo,
    tintFrom,
    tintTo,
    tintBorder: alpha(baseHex, 0.32),
    text: ensureContrast(lightEnd, flatTint, 4.5, 'lighten'),
    icon: ensureContrast(lightEnd, flatTint, 3, 'lighten'),
    onFill: contrast(ON_ACCENT_INK, darkFillTo) >= 4.5 ? ON_ACCENT_INK : '#FFFFFF',
  };
}

/* ── neutrals & semantics ─────────────────────────────────────────── */

const LIGHT_NEUTRALS = {
  paper: '#F4F1EA',
  paperDeep: '#EDE8DF',
  card: '#FFFFFF',
  ink: '#201B17',
  inkFrom: '#3F382F',
  inkTo: '#201B17',
  secondary: '#57504A',
  muted: '#8D857C',
  faint: '#B3AAA0',
  hairlineOn: '#201B17',
  hairlineAlpha: 0.08,
  trackRing: '#E8E2D7',
  onInk: '#FFFFFF',
};

const DARK_NEUTRALS = {
  paper: '#17120E',
  paperDeep: '#100C09',
  card: '#221C16',
  ink: '#F2EDE5',
  // The ink ramp is "maximum contrast against the page", so in dark it inverts
  // to bone — a near-black primary button on near-black paper reads as absent.
  inkFrom: '#F6F1E9',
  inkTo: '#DFD7CA',
  secondary: '#C3BAAF',
  muted: '#93897E',
  faint: '#6E655C',
  hairlineOn: '#F4EFE8',
  hairlineAlpha: 0.09,
  trackRing: '#2F2820',
  onInk: '#17120E',
};

/** Never recoloured by the accent — these carry meaning, not brand. */
const SEMANTIC = {
  light: {
    good: '#679B7C',
    goodInk: '#3F6A52',
    goodBg: '#EDF3EF',
    over: '#B23A2C',
    overFrom: '#CF5340',
    overTo: '#A8342A',
    danger: '#B23A2C',
    info: '#3C72C8',
    infoBg: '#E9F0FB',
  },
  dark: {
    good: '#7FB795',
    goodInk: '#9BCBAE',
    goodBg: 'rgba(103, 155, 124, 0.16)',
    over: '#E1705E',
    overFrom: '#E0705C',
    overTo: '#C04936',
    danger: '#E1705E',
    info: '#8DB4F0',
    infoBg: 'rgba(60, 114, 200, 0.18)',
  },
} as const;

/**
 * Task icons are identity, not state: the hue never moves with the accent. Only
 * the chip behind them adapts, so a bottle stays blue on paper and on charcoal.
 */
const TASK_FG = {
  water: '#5B9EE0',
  bed: '#B39A6D',
  leaf: '#679B7C',
  heart: '#D1685F',
  pencil: '#8A807A',
  cup: '#C19A5B',
  target: '#7D8FC4',
  pill: '#C4726F',
  book: '#C19A5B',
  dumbbell: '#8A807A',
  screen: '#8A807A',
  sun: '#E8853F',
  moon: '#8A807A',
  drop: '#5B9EE0',
  cal: '#7D8FC4',
  bottle: '#5B9EE0',
} as const;

export type TaskTone = keyof typeof TASK_FG;

export type TaskTones = Record<TaskTone, { bg: string; fg: string }>;

function buildTaskTones(mode: Mode): TaskTones {
  const out = {} as TaskTones;
  (Object.keys(TASK_FG) as TaskTone[]).forEach((k) => {
    const fg = TASK_FG[k];
    out[k] =
      mode === 'light'
        ? { bg: over(fg, 0.14, '#FFFFFF'), fg }
        : { bg: alpha(fg, 0.18), fg: toHex({ ...toHsl(fg), l: clamp(toHsl(fg).l + 0.1) }) };
  });
  return out;
}

/** Foreground that clears AA on a saturated fill — white unless the fill is pale. */
function onSolid(bg: string) {
  return contrast('#FFFFFF', bg) >= 4.5 ? '#FFFFFF' : ON_ACCENT_INK;
}

/** One reset card's surfaces, derived from its tag hue. */
function resetTone(hue: string, mode: Mode, card: string) {
  const tag = mode === 'light' ? hue : ensureContrast(hue, '#FFFFFF', 4.5, 'darken');
  return {
    bg: mode === 'light' ? over(hue, 0.05, card) : alpha(hue, 0.16),
    iconBg: mode === 'light' ? over(hue, 0.13, card) : alpha(hue, 0.26),
    tag,
    onTag: onSolid(tag),
  };
}

/* ── the palette ──────────────────────────────────────────────────── */

export type Palette = ReturnType<typeof buildPalette>;

export function buildPalette(accentKey: Accent, mode: Mode) {
  const n = mode === 'light' ? LIGHT_NEUTRALS : DARK_NEUTRALS;
  const s = SEMANTIC[mode];
  const a = deriveAccent(accentBase(accentKey), mode, n.card);
  // The board's #3C72C8 on #E9F0FB lands at 4.13:1; nudge it until info chips
  // clear AA. Hue is untouched, so the chip still reads as the same cool blue.
  const infoBgFlat = s.infoBg.startsWith('rgba') ? over(SEMANTIC.light.info, 0.18, n.card) : s.infoBg;
  const info = ensureContrast(s.info, infoBgFlat, 4.5, mode === 'light' ? 'darken' : 'lighten');

  const hair = (mult = 1) => alpha(n.hairlineOn, n.hairlineAlpha * mult);
  const inkAlpha = (v: number) => alpha(n.hairlineOn, v);

  return {
    mode,
    accentKey,

    /* surfaces */
    paper: n.paper,
    paperDeep: n.paperDeep,
    /** Fully transparent paper — the top stop of the fade under the dock. */
    paperFade: alpha(n.paper, 0),
    /** The colour hairlines and scrims are mixed from — ink in light, bone in dark. */
    hairlineOn: n.hairlineOn,
    card: n.card,
    /** Kept as a literal white for the few places that need true white on ink. */
    white: mode === 'light' ? '#FFFFFF' : n.card,
    onInk: n.onInk,
    /** Secondary copy sitting on the ink gradient. */
    onInkSoft: alpha(n.onInk, 0.62),
    /** A pill or well drawn on the ink gradient — inverts with the ramp. */
    onInkWash: alpha(n.onInk, 0.1),

    /* borders */
    hairline: hair(),
    hairlineStrong: hair(1.15),
    border: hair(),
    borderStrong: hair(1.6),
    ring: hair(2),
    divider: hair(0.9),

    /* ink ramp */
    ink: n.ink,
    inkFrom: n.inkFrom,
    inkTo: n.inkTo,
    inkDeepFrom: n.inkFrom,
    inkDeepTo: n.inkTo,
    text: n.secondary,
    textMid: n.secondary,
    textSoft: n.muted,
    muted: n.muted,
    faint: n.faint,
    ghost: n.faint,
    /** Inactive dock glyphs — held at ≥3:1 on the dock's white. */
    dockIdle: ensureContrast(
      mode === 'light' ? '#A89F94' : '#7C7268',
      n.card,
      3,
      mode === 'light' ? 'darken' : 'lighten'
    ),
    wisp: mode === 'light' ? '#D6CEC7' : '#453C33',

    /* accent */
    accent: a.base,
    accentFrom: a.fillFrom,
    accentTo: a.fillTo,
    accentDeep: a.fillTo,
    accentOn: a.onFill,
    accentTintFrom: a.tintFrom,
    accentTintTo: a.tintTo,
    accentTintBorder: a.tintBorder,
    accentText: a.text,
    accentIcon: a.icon,
    // back-compat names still referenced across the screens
    accentInk: a.text,
    accentInkDeep: a.text,
    accentInkSoft: a.icon,
    accentWashFrom: a.tintFrom,
    accentWashTo: a.tintTo,
    accentWashBorder: a.tintBorder,

    /* fills that used to be sand washes and are now white-on-paper */
    cardFrom: n.card,
    cardTo: n.card,
    wellFrom: mode === 'light' ? '#F1EDE5' : '#1D1813',
    wellTo: mode === 'light' ? '#EAE5DB' : '#1A150F',
    chipFrom: inkAlpha(0.05),
    chipTo: inkAlpha(0.05),
    pressFrom: inkAlpha(0.06),
    pressTo: inkAlpha(0.06),
    track: n.trackRing,
    trackRing: n.trackRing,
    disabled: inkAlpha(0.08),
    disabledText: n.faint,

    /* semantics — never recoloured */
    good: s.good,
    goodInk: s.goodInk,
    goodBg: s.goodBg,
    over: s.over,
    overFrom: s.overFrom,
    overTo: s.overTo,
    overRing: s.overFrom,
    danger: s.danger,
    info,
    infoBg: s.infoBg,

    /* stone steps — neutral fills expressed as ink over paper, so they invert
       with the theme instead of needing a second hand-picked ramp */
    stoneSoft: over(n.hairlineOn, 0.03, n.paper),
    stone: over(n.hairlineOn, 0.07, n.paper),
    stoneLine: over(n.hairlineOn, 0.1, n.paper),
    stoneDeep: over(n.hairlineOn, 0.13, n.paper),

    /* extra accent steps for heroes and ramps */
    accentWash: over(a.base, mode === 'light' ? 0.07 : 0.1, n.card),
    accentSoft: toHex({ ...toHsl(a.base), l: clamp(toHsl(a.base).l + 0.1) }),
    /** Five stops light→deep, for the momentum tiers. Follows the accent. */
    accentRamp: [0.14, 0.08, 0, -0.07, -0.16].map((d) =>
      toHex({ ...toHsl(a.base), l: clamp(toHsl(a.base).l + d) })
    ),

    /**
     * Explore's reset cards. Their hue is content, not accent — but the surface
     * has to follow the theme or the title goes invisible on dark.
     */
    reset: {
      alert: resetTone(IDENTITY.tagAlert, mode, n.card),
      fresh: resetTone(IDENTITY.tagFresh, mode, n.card),
    },

    /* scrims */
    scrim: 'rgba(24, 18, 14, 0.44)',

    tasks: buildTaskTones(mode),
  };
}

/**
 * Content colours that are neither accent nor semantic: brand swatches for the
 * app-icon variants, avatar tints, template tags. They live here so the "no raw
 * hex outside the token layer" rule holds for the seed data too, and so a lint
 * sweep has exactly one file to allow.
 */
export const IDENTITY = {
  avatarSage: '#CFDED6',
  avatarSageInk: '#5E7C6E',
  avatarSand: '#E6DED2',
  avatarSandInk: '#B09B7F',
  avatarMoss: '#DFE7E2',
  avatarMossInk: '#95AB9F',
  avatarIris: '#E4E2EE',
  avatarIrisInk: '#A09CBB',
  tagAlert: '#B23A2C',
  tagAlertBg: '#FDF3F3',
  tagAlertIconBg: '#FBE6E6',
  tagAlertIcon: '#DC8A88',
  tagFresh: '#2F9C78',
  tagFreshBg: '#EEF7F3',
  tagFreshIconBg: '#DCEFE7',
  tagFreshIcon: '#68B39A',
  badgeMint: '#E3F2EA',
  moodFace: '#D8A288',
  /** App-icon artwork — fixed, because it ships as a launcher asset. */
  icons: {
    default: { bg: ['#FFA47C', '#FF7A45'], fg: '#241F1C' },
    paper: { bg: ['#FFFFFF', '#FFFFFF'], fg: '#D95D2B', border: true },
    gentle: { bg: ['#FFE4D5', '#FF8A5B'], fg: '#8F3D22' },
    deep: { bg: ['#453D36', '#241F1C'], fg: '#FF8A5B' },
    calm: { bg: ['#EEF0F2', '#EEF0F2'], fg: '#9AA0A8' },
    clay: { bg: ['#F3E6DD', '#F3E6DD'], fg: '#A8492A' },
    soft: { bg: ['#FFF0E7', '#FFDCCB'], fg: '#D95D2B' },
    sky: { bg: ['#9CC6F5', '#4E93E8'], fg: '#17324F' },
    moss: { bg: ['#AFD79A', '#6FAE52'], fg: '#1E3314' },
    orchid: { bg: ['#E0B6E9', '#B76FC8'], fg: '#3A1C42' },
  },
} as const;

/** Task-icon foregrounds, exported for seed data that names a tone directly. */
export const TASK_ICON_FG = TASK_FG;

/** Convenience for the picker's swatches — no palette build needed. */
export const accentSwatch = (k: Accent) => {
  const b = toHsl(accentBase(k));
  return {
    from: toHex({ ...b, l: clamp(b.l + 0.06) }),
    to: toHex({ ...b, l: clamp(b.l - 0.09) }),
  };
};

/* ── colour wheel ─────────────────────────────────────────────────── */

/**
 * `count` evenly spaced hues at the wheel's fixed saturation and lightness.
 *
 * The board draws the ring as a CSS `conic-gradient`, which React Native has
 * no equivalent for. These stops feed an SVG arc per segment instead, which is
 * why the count is a parameter: it trades file size against banding.
 */
export const wheelHues = (count: number, s = 0.72, l = 0.6) =>
  Array.from({ length: count }, (_, i) => toHex({ h: (i * 360) / count, s, l }));

/**
 * The lightness ramp under the wheel, light on the left running to dark on the
 * right — the board's direction, and the one the rail's `1 - x/width` mapping
 * assumes. Reversing this without reversing that puts the knob on a stop whose
 * colour it does not match.
 */
export const lightnessRamp = (hex: string, count: number) => {
  const b = toHsl(hex);
  return Array.from({ length: count }, (_, i) => toHex({ ...b, l: 1 - i / (count - 1) }));
};

/**
 * R/G/B as the 0–255 bytes people expect to read, not the 0–1 floats the
 * internal colour maths runs on — `hexToRgb` normalises, so printing its
 * output directly gives "R 0 G 1 B 1" for every colour.
 */
export const rgbOf = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

/** Hue + lightness back out of a hex, for seeding the wheel from a saved theme. */
export const hslOf = (hex: string) => toHsl(hex);

/** A wheel position (hue 0–360, lightness 0–1) as a hex at wheel saturation. */
export const wheelHex = (h: number, l: number, s = 0.72) => toHex({ h, s, l });
