/**
 * Shared primitives — the v2 shape, elevation and colour language in one place.
 *
 * Everything the screens draw is assembled from these, so restyling the app is
 * a change here rather than 42 changes out there. Two rules keep that true:
 *   1. no raw hex — every colour resolves through a token in ./theme;
 *   2. no module-scope style object may capture a token, because the token
 *      objects are re-filled in place when the theme changes. Build colour
 *      styles inside render (the `useT()` call at the top of each component is
 *      what re-runs them).
 */
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TextProps,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C, DIAG, F, G, RADIUS, SHADOW, TYPE, VERT } from './theme';
import { useT } from './theming';
import { haptics } from './haptics';
import { Icon, IconName } from './icons';

/* ── text ─────────────────────────────────────────────────────────── */

type TxtProps = TextProps & {
  /** Display face (Bricolage) at the given weight, else Instrument Sans. */
  d?: boolean;
  size?: number;
  weight?: 400 | 500 | 600 | 700 | 800;
  color?: string;
  lh?: number;
  center?: boolean;
  ls?: number;
};

const faceFor = (d: boolean, w: number) => {
  if (d) return w >= 800 ? F.display : w >= 700 ? F.displayBold : F.displaySemi;
  if (w >= 700) return F.bold;
  if (w >= 600) return F.semibold;
  if (w >= 500) return F.medium;
  return F.regular;
};

export function T({
  d = false,
  size = 15,
  weight = 400,
  color,
  lh,
  center,
  ls,
  style,
  ...rest
}: TxtProps) {
  const t = useT();
  // Display type carries the board's −0.015em tracking unless told otherwise.
  const tracking = ls !== undefined ? ls : d ? size * TYPE.displayTracking : undefined;
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: faceFor(d, weight),
          fontSize: size,
          color: color ?? t.ink,
          ...(lh ? { lineHeight: lh } : null),
          ...(center ? { textAlign: 'center' as const } : null),
          ...(tracking !== undefined ? { letterSpacing: tracking } : null),
        },
        style,
      ]}
    />
  );
}

/** The wide uppercase eyebrow that sits above titles and inside grouped cards. */
export function Overline({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  return (
    <RNText
      style={[
        {
          fontFamily: F.bold,
          fontSize: TYPE.overline.size,
          letterSpacing: TYPE.overline.ls,
          textTransform: TYPE.overline.transform,
          color: color ?? t.muted,
        },
        style as never,
      ]}
    >
      {children}
    </RNText>
  );
}

/* ── surfaces ─────────────────────────────────────────────────────── */

type GradProps = {
  colors: readonly string[];
  diag?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pointerEvents?: 'none' | 'auto' | 'box-none';
};

export function Grad({ colors, diag, style, children, pointerEvents }: GradProps) {
  const dir = diag ? DIAG : VERT;
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string, ...string[]]}
      start={dir.start}
      end={dir.end}
      style={[style, pointerEvents ? { pointerEvents } : null]}
    >
      {children}
    </LinearGradient>
  );
}

/** Warm-paper page shell. Cards sit on this; it never goes white. */
export function Screen({
  children,
  style,
  top = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pad for the status bar. Off for screens that draw their own hero. */
  top?: boolean;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: t.paper, paddingTop: top ? insets.top : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Elevation wrapper for surfaces that must clip their children.
 *
 * A `boxShadow` and `overflow: 'hidden'` on the same view lose the corner radius
 * on iOS — fill and shadow both paint square. Keeping the shadow on a plain
 * outer view and the clip on the inner one avoids that. Surfaces with nothing to
 * clip skip this and carry both on one view, so the caller's padding still lands
 * where they expect it.
 */
function Elevated({
  shadow,
  radius,
  children,
  style,
}: {
  shadow: string;
  radius: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ borderRadius: radius, boxShadow: shadow }, style]}>{children}</View>;
}

/**
 * True-white elevated card: hairline border plus the two-layer shadow. `tinted`
 * is the selected/hero state — accent tint gradient behind a 1.5px tint border.
 */
export function Card({
  style,
  children,
  tinted,
  onPress,
  radius = RADIUS.card,
  flat,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  tinted?: boolean;
  onPress?: () => void;
  radius?: number;
  /** Drop the shadow — for cards nested inside another elevated surface. */
  flat?: boolean;
}) {
  const t = useT();
  const shell: ViewStyle = {
    borderRadius: radius,
    borderWidth: tinted ? 1.5 : 1,
    borderColor: tinted ? t.accentTintBorder : t.hairline,
    boxShadow: flat ? SHADOW.none : SHADOW.card,
  };
  const inner = tinted ? (
    <Grad colors={G.accentTint} diag style={[shell, style]}>
      {children}
    </Grad>
  ) : (
    <View style={[shell, { backgroundColor: t.card }, style]}>{children}</View>
  );
  return onPress ? <Tap onPress={onPress}>{inner}</Tap> : inner;
}

/** Lower-elevation list row on the same white-on-paper recipe. */
export function RowCard({
  style,
  children,
  tinted,
  onPress,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  tinted?: boolean;
  onPress?: () => void;
}) {
  const t = useT();
  const shell: ViewStyle = {
    borderRadius: RADIUS.row,
    borderWidth: tinted ? 1.5 : 1,
    borderColor: tinted ? t.accentTintBorder : t.hairline,
    boxShadow: SHADOW.row,
  };
  const inner = tinted ? (
    <Grad colors={G.accentTint} diag style={[shell, style]}>
      {children}
    </Grad>
  ) : (
    <View style={[shell, { backgroundColor: t.card }, style]}>{children}</View>
  );
  return onPress ? <Tap onPress={onPress}>{inner}</Tap> : inner;
}

/* ── surface skins ────────────────────────────────────────────────── */

/*
 * Style fragments for places that build their own container instead of using
 * `Card`. They read the live tokens, so they must be *called during render* —
 * `style={[LAYOUT, cardSkin()]}`, never assigned to a module-scope const.
 */

/** White, hairline-bordered, two-layer shadow — the default elevated surface. */
export const cardSkin = (): ViewStyle => ({
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.hairline,
  boxShadow: SHADOW.card,
});

/** The same recipe one step down, for list rows and small tiles. */
export const rowSkin = (): ViewStyle => ({
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.hairline,
  boxShadow: SHADOW.row,
});

/** Selected / hero state: 1.5px tint border over the accent tint gradient. */
export const tintSkin = (): ViewStyle => ({
  borderWidth: 1.5,
  borderColor: C.accentTintBorder,
});

/** Recessed well — inputs, tracks and the timeline's block bodies. */
export const wellSkin = (): ViewStyle => ({
  backgroundColor: C.wellFrom,
  borderWidth: 1,
  borderColor: C.hairline,
});

/** Flat, unelevated fill for chips and quiet buttons. */
export const chipSkin = (): ViewStyle => ({ backgroundColor: C.chipFrom });

/* ── pressables ───────────────────────────────────────────────────── */

export function Tap({
  onPress,
  onLongPress,
  children,
  style,
  disabled,
  haptic = true,
  hitSlop,
}: {
  onPress?: () => void;
  /** Secondary action on a row — rename / remove, where a button would crowd. */
  onLongPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  hitSlop?: number;
}) {
  const buzz = (weight: Haptics.ImpactFeedbackStyle) => {
    if (haptic && haptics.enabled && Platform.OS !== 'web') {
      Haptics.impactAsync(weight).catch(() => {});
    }
  };
  return (
    <Pressable
      hitSlop={hitSlop}
      disabled={disabled || !(onPress || onLongPress)}
      onPress={() => {
        buzz(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onLongPress={
        onLongPress &&
        (() => {
          // Heavier than a tap: the only signal that the long press registered
          // before the sheet animates in.
          buzz(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        })
      }
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }]}
    >
      {children}
    </Pressable>
  );
}

type BtnKind = 'ink' | 'accent' | 'quiet' | 'ghost';

/**
 * Primary is the ink pill. The accent pill is rationed to the one decisive
 * action on a screen — it carries ink text and an inset top highlight.
 */
export function Button({
  label,
  onPress,
  kind = 'ink',
  disabled,
  icon,
  style,
  height = 60,
}: {
  label: string;
  onPress?: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const t = useT();
  const fg = disabled
    ? t.disabledText
    : kind === 'ink'
      ? t.onInk
      : kind === 'accent'
        ? t.accentOn
        : kind === 'quiet'
          ? t.textMid
          : t.ink;

  const content = (
    <View style={[S.btnRow, { height }]}>
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <T d size={17} weight={700} color={fg}>
        {label}
      </T>
    </View>
  );

  if (disabled) {
    return (
      <View style={[{ borderRadius: RADIUS.pill, backgroundColor: t.disabled }, style]}>
        {content}
      </View>
    );
  }
  if (kind === 'ghost') {
    return (
      <Tap
        onPress={onPress}
        style={[
          {
            borderRadius: RADIUS.pill,
            backgroundColor: t.card,
            borderWidth: 1.5,
            borderColor: t.hairlineStrong,
            boxShadow: SHADOW.row,
          },
          style,
        ]}
      >
        {content}
      </Tap>
    );
  }
  if (kind === 'quiet') {
    return (
      <Tap onPress={onPress} style={style}>
        <View style={{ borderRadius: RADIUS.pill, backgroundColor: t.pressFrom }}>{content}</View>
      </Tap>
    );
  }
  const accent = kind === 'accent';
  return (
    <Tap onPress={onPress} style={style}>
      <Elevated shadow={accent ? SHADOW.fab : SHADOW.card} radius={RADIUS.pill}>
        <Grad
          colors={accent ? G.accent : G.ink}
          diag
          style={{ borderRadius: RADIUS.pill, overflow: 'hidden' }}
        >
          {accent ? (
            // Inset top highlight — the accent pill's only ornament.
            <LinearGradient
              colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)']}
              start={VERT.start}
              end={VERT.end}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: height * 0.55,
                pointerEvents: 'none',
              }}
            />
          ) : null}
          {content}
        </Grad>
      </Elevated>
    </Tap>
  );
}

/**
 * The white circle that replaced bare glyphs for back / close / overflow.
 * Renders at `size` but always keeps a 44px hit target.
 */
export function IconButton({
  icon,
  onPress,
  size = 40,
  glyph,
  color,
  tone = 'card',
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  glyph?: number;
  color?: string;
  tone?: 'card' | 'ink' | 'accent' | 'plain';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const pad = Math.max(0, (44 - size) / 2);
  const g = glyph ?? Math.round(size * 0.48);
  const shell: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  let body: React.ReactNode;
  if (tone === 'ink') {
    body = (
      <Elevated shadow={SHADOW.icon} radius={size / 2}>
        <Grad colors={G.ink} diag style={shell}>
          <Icon name={icon} size={g} color={color ?? t.onInk} />
        </Grad>
      </Elevated>
    );
  } else if (tone === 'accent') {
    body = (
      <Elevated shadow={SHADOW.icon} radius={size / 2}>
        <Grad colors={G.accent} diag style={shell}>
          <Icon name={icon} size={g} color={color ?? t.accentOn} />
        </Grad>
      </Elevated>
    );
  } else if (tone === 'plain') {
    body = (
      <View style={shell}>
        <Icon name={icon} size={g} color={color ?? t.muted} />
      </View>
    );
  } else {
    body = (
      <View
        style={[
          shell,
          {
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.hairline,
            boxShadow: SHADOW.icon,
          },
        ]}
      >
        <Icon name={icon} size={g} color={color ?? t.ink} />
      </View>
    );
  }

  return (
    <Tap onPress={onPress} hitSlop={pad + 4} style={style}>
      {body}
    </Tap>
  );
}

/** Accent-fill check coin — the selected marker on rows, tiles and cards. */
export function CheckCoin({ size = 26, on = true }: { size?: number; on?: boolean }) {
  const t = useT();
  if (!on) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: t.ring,
        }}
      />
    );
  }
  return (
    <Grad
      colors={G.accent}
      diag
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="check" size={Math.round(size * 0.56)} color={t.accentOn} />
    </Grad>
  );
}

/* ── ring / progress ──────────────────────────────────────────────── */

let ringSeq = 0;

/**
 * The v2 progress ring: rounded caps, −90° start, accent gradient over a stone
 * track, and a white inner dial that carries its own shadow. Replaces the
 * board's conic-gradient divs at every size (280 / 196 / 106).
 */
export function Ring({
  size,
  thickness,
  progress,
  over,
  tone,
  children,
  inner,
  trackColor,
  hollow,
}: {
  size: number;
  /** Defaults to the board's 15px stroke, scaled below 160px. */
  thickness?: number;
  progress: number;
  /** Overrun — fills the sweep in the overrun tone. Never re-accented. */
  over?: boolean;
  /** Explicit stop pair, e.g. success green for completion. */
  tone?: readonly string[];
  children?: React.ReactNode;
  /** Background of the punched-out centre. */
  inner?: string;
  trackColor?: string;
  /** Skip the inner dial — for mini previews drawn on a card. */
  hollow?: boolean;
}) {
  const t = useT();
  const id = React.useMemo(() => `ring${++ringSeq}`, []);
  const stroke = thickness ?? (size >= 160 ? 15 : Math.max(6, Math.round(size * 0.1)));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = over ? 1 : Math.max(0, Math.min(1, progress));
  const stops = tone ?? (over ? [t.overFrom, t.overTo] : [t.accentFrom, t.accentTo]);
  const innerSize = size - stroke * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGrad id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={stops[0]} />
            <Stop offset="1" stopColor={stops[1]} />
          </SvgGrad>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor ?? t.trackRing}
          strokeWidth={stroke}
          fill="none"
        />
        {p > 0.001 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circ * p} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      {hollow ? (
        children
      ) : (
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: inner ?? t.card,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: SHADOW.dial,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

/** Retained name — the board's dials are all rings now. */
export const Dial = Ring;

/** Flat horizontal meter used for weekly completion and per-task averages. */
export function Meter({
  value,
  height = 7,
  fill,
  track,
  radius = 4,
  children,
}: {
  value: number;
  height?: number;
  fill?: readonly string[] | string;
  track?: string;
  radius?: number;
  children?: React.ReactNode;
}) {
  const t = useT();
  const w = `${Math.max(0, Math.min(1, value)) * 100}%` as const;
  return (
    <View
      style={{
        height,
        borderRadius: radius,
        backgroundColor: track ?? t.trackRing,
        overflow: 'hidden',
      }}
    >
      {typeof fill === 'string' ? (
        <View style={{ width: w, height: '100%', backgroundColor: fill }} />
      ) : (
        <Grad colors={fill ?? G.accent} diag style={{ width: w, height: '100%' }} />
      )}
      {children}
    </View>
  );
}

/** Thin task-average bar; `over` swaps the fill to the overrun tone. */
export function MeterRow({ value, over }: { value: number; over?: boolean }) {
  const t = useT();
  const w = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View
      style={{ height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: t.trackRing }}
    >
      {over ? (
        <View style={{ width: w, height: '100%', backgroundColor: t.over }} />
      ) : (
        <Grad colors={G.accent} diag style={{ width: w, height: '100%' }} />
      )}
    </View>
  );
}

/* ── controls ─────────────────────────────────────────────────────── */

export function Toggle({
  on,
  onChange,
  small,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  small?: boolean;
}) {
  const t = useT();
  const w = small ? 48 : 52;
  const h = small ? 28 : 30;
  const k = small ? 22 : 24;
  const knob = (
    <View
      style={{
        width: k,
        height: k,
        borderRadius: k,
        backgroundColor: t.onInk,
        boxShadow: SHADOW.knob,
      }}
    />
  );
  const shell: ViewStyle = {
    width: w,
    height: h,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 3,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: on ? 'flex-end' : 'flex-start',
  };
  return (
    <Tap onPress={() => onChange?.(!on)} hitSlop={10}>
      {on ? (
        <Grad colors={G.ink} diag style={shell}>
          {knob}
        </Grad>
      ) : (
        <View style={[shell, { backgroundColor: t.ring }]}>{knob}</View>
      )}
    </Tap>
  );
}

/** Rounded pill segmented control (Routine / Checklist, List / Timeline …). */
export function Segmented({
  options,
  value,
  onChange,
  dark,
  big,
}: {
  options: { key: string; label?: string; icon?: IconName }[];
  value: string;
  onChange: (k: string) => void;
  /** Ink-filled selected chip instead of white. */
  dark?: boolean;
  big?: boolean;
}) {
  const t = useT();
  return (
    <View style={[S.segWrap, { backgroundColor: t.pressFrom }]}>
      {options.map((o) => {
        const on = o.key === value;
        const fg = on ? (dark ? t.onInk : t.ink) : t.muted;
        const body = (
          <View style={[S.segItem, big && { flex: 1, paddingVertical: 13 }]}>
            {o.icon ? <Icon name={o.icon} size={18} color={fg} /> : null}
            {o.label ? (
              <T size={big ? 15.5 : 14.5} weight={on ? 700 : 600} color={fg}>
                {o.label}
              </T>
            ) : null}
          </View>
        );
        return (
          <Tap key={o.key} onPress={() => onChange(o.key)} style={big ? { flex: 1 } : undefined}>
            {on ? (
              dark ? (
                <Grad colors={G.ink} diag style={{ borderRadius: RADIUS.pill }}>
                  {body}
                </Grad>
              ) : (
                // rowSkin() rather than a bare background + shadow. On Android a
                // plain view carrying a *pill* radius (999, far larger than the
                // view) together with `boxShadow` and no border paints its
                // background square: the chip rendered as a hard white rectangle
                // sitting inside its own perfectly round track. The hairline
                // border is what makes the radius stick. The knob in `Toggle`
                // and the interior of `Dial` are borderless too but use a radius
                // of exactly half their size, and those are fine.
                <View style={[rowSkin(), { borderRadius: RADIUS.pill }]}>{body}</View>
              )
            ) : (
              body
            )}
          </Tap>
        );
      })}
    </View>
  );
}

/** Small outlined / filled pill used for tags and filters. */
export function Pill({
  label,
  tone = 'sand',
  icon,
  onPress,
  size = 14,
}: {
  label: string;
  tone?: 'sand' | 'ink' | 'accent' | 'outline' | 'tint';
  icon?: IconName;
  onPress?: () => void;
  size?: number;
}) {
  const t = useT();
  const fg =
    tone === 'ink'
      ? t.onInk
      : tone === 'tint'
        ? t.accentText
        : tone === 'accent'
          ? t.accentOn
          : t.textMid;
  const inner = (
    <View style={S.pillRow}>
      {icon ? <Icon name={icon} size={size} color={fg} /> : null}
      <T size={size} weight={tone === 'ink' || tone === 'accent' ? 700 : 600} color={fg}>
        {label}
      </T>
    </View>
  );
  const shell =
    tone === 'ink' ? (
      <Grad colors={G.ink} diag style={S.pillShell}>
        {inner}
      </Grad>
    ) : tone === 'accent' ? (
      <Grad colors={G.accent} diag style={S.pillShell}>
        {inner}
      </Grad>
    ) : tone === 'tint' ? (
      <Grad
        colors={G.accentTint}
        diag
        style={[S.pillShell, { borderWidth: 1, borderColor: t.accentTintBorder }]}
      >
        {inner}
      </Grad>
    ) : tone === 'outline' ? (
      <View style={[S.pillShell, { borderWidth: 1.5, borderColor: t.hairlineStrong }]}>
        {inner}
      </View>
    ) : (
      <View
        style={[
          S.pillShell,
          { backgroundColor: t.card, borderWidth: 1, borderColor: t.hairline },
        ]}
      >
        {inner}
      </View>
    );
  return onPress ? <Tap onPress={onPress}>{shell}</Tap> : shell;
}

/* ── sheet / dialog ───────────────────────────────────────────────── */

export function Sheet({
  visible,
  onClose,
  children,
  dimOpacity,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dimOpacity?: number;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dimOpacity === undefined ? t.scrim : `rgba(24,18,14,${dimOpacity})` },
        ]}
        onPress={onClose}
      />
      <View
        style={[
          S.sheet,
          {
            backgroundColor: t.card,
            borderTopWidth: 1,
            borderColor: t.hairline,
            paddingBottom: 24 + insets.bottom,
            boxShadow: SHADOW.sheet,
          },
        ]}
      >
        <View style={[S.grabber, { backgroundColor: t.ring }]} />
        {children}
      </View>
    </Modal>
  );
}

export function Dialog({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }]}
        onPress={onClose}
      />
      <View style={[S.dialogWrap, { pointerEvents: 'box-none' }]}>
        <View
          style={[
            S.dialog,
            {
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.hairline,
              boxShadow: SHADOW.dialog,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

/**
 * A one-line text field in a dialog — "name this list", "rename this task".
 *
 * The app had no way to type anything a screen had not already written for it,
 * which is why every create affordance was either missing or wired to a
 * hardcoded string. This is the primitive the create flows are built on.
 *
 * `visible` is what mounts it, and the draft resets on every open, so a
 * cancelled edit never leaks into the next one.
 */
export function Prompt({
  visible,
  title,
  placeholder,
  initial = '',
  confirm = 'Save',
  keyboard = 'default',
  autoClose = true,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  placeholder?: string;
  initial?: string;
  confirm?: string;
  keyboard?: 'default' | 'number-pad';
  /**
   * False leaves the dialog standing and empties the field instead, so a list
   * can be filled item after item without reopening it. The caller then owns
   * dismissal — either by moving its own state on, or by Cancel.
   */
  autoClose?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState(initial);
  const field = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (!visible) return;
    setDraft(initial);
    // `autoFocus` does not survive being mounted inside a Modal on Android —
    // the window takes focus after the child mounts, so the request is made
    // against a view that is not attached yet and is silently dropped. One
    // frame later it lands, and the keyboard comes up with the dialog instead
    // of after a second tap on the field.
    const id = setTimeout(() => field.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [visible, initial]);

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onSubmit(v);
    if (autoClose) onClose();
    else setDraft('');
  };

  return (
    <Dialog visible={visible} onClose={onClose}>
      <T d size={21} weight={800}>
        {title}
      </T>
      <View
        style={{
          marginTop: 16,
          borderRadius: RADIUS.tile,
          borderWidth: 1.5,
          borderColor: t.borderStrong,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 14 : 6,
        }}
      >
        <TextInput
          ref={field}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={t.ghost}
          keyboardType={keyboard}
          returnKeyType="done"
          onSubmitEditing={submit}
          style={{
            fontFamily: F.medium,
            fontSize: 16,
            color: t.ink,
            padding: 0,
          }}
        />
      </View>
      <Row gap={10} style={{ marginTop: 18, justifyContent: 'flex-end' }}>
        <Tap onPress={onClose}>
          <T size={15} weight={600} color={t.muted} style={{ padding: 10 }}>
            Cancel
          </T>
        </Tap>
        <Tap onPress={submit}>
          <T size={15} weight={700} color={draft.trim() ? t.accentInk : t.ghost} style={{ padding: 10 }}>
            {confirm}
          </T>
        </Tap>
      </Row>
    </Dialog>
  );
}

/**
 * The recurring "⋯ on a row" menu — a sheet of labelled actions, one of which
 * may be destructive. Saves every screen hand-rolling the same list of rows.
 */
export function MenuSheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: { key: string; label: string; icon?: IconName; danger?: boolean; onPress: () => void }[];
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Sheet visible={visible} onClose={onClose}>
      {title ? (
        <T d size={22} weight={800} style={{ marginBottom: 4 }}>
          {title}
        </T>
      ) : null}
      <View style={{ gap: 10, marginTop: 16 }}>
        {actions.map((a) => (
          <Tap
            key={a.key}
            onPress={() => {
              onClose();
              a.onPress();
            }}
          >
            <View
              style={[
                rowSkin(),
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 17,
                  paddingHorizontal: 18,
                  borderRadius: RADIUS.tile,
                },
              ]}
            >
              {a.icon ? (
                <Icon name={a.icon} size={20} color={a.danger ? t.danger : t.textMid} />
              ) : null}
              <T size={16} weight={700} color={a.danger ? t.danger : t.ink} style={{ flex: 1 }}>
                {a.label}
              </T>
            </View>
          </Tap>
        ))}
      </View>
    </Sheet>
  );
}

/* ── layout helpers ───────────────────────────────────────────────── */

export function Row({
  children,
  gap = 0,
  style,
  center = true,
}: {
  children?: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  center?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', gap, alignItems: center ? 'center' : 'flex-start' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const Spacer = () => <View style={{ flex: 1 }} />;

/** Back button + optional page dots — the recurring detail-screen header. */
export function TopBar({
  onBack,
  dots,
  right,
  center,
  style,
}: {
  onBack?: () => void;
  dots?: boolean;
  right?: React.ReactNode;
  center?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  return (
    <Row style={[{ justifyContent: 'space-between', paddingTop: 12 }, style]}>
      {onBack ? (
        <IconButton icon="chevL" onPress={onBack} size={40} glyph={20} />
      ) : (
        <View style={{ width: 40 }} />
      )}
      {center}
      {dots ? (
        <Row gap={4}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ width: 4.5, height: 4.5, borderRadius: 3, backgroundColor: t.faint }}
            />
          ))}
        </Row>
      ) : (
        right ?? <View style={{ width: 40 }} />
      )}
    </Row>
  );
}

/**
 * Grouped settings card: white, hairline-bordered, with an in-card uppercase
 * overline and hairline dividers between its rows.
 */
export function Group({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[
        {
          borderRadius: RADIUS.card,
          paddingHorizontal: 18,
          paddingBottom: 4,
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.hairline,
          boxShadow: SHADOW.card,
        },
        style,
      ]}
    >
      {title ? <Overline style={{ paddingTop: 16, paddingBottom: 2 }}>{title}</Overline> : null}
      {items.map((child, i) => (
        <View
          key={i}
          style={
            i > 0
              ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider }
              : undefined
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export function RowItem({
  icon,
  label,
  value,
  chevron,
  external,
  onPress,
  right,
  labelColor,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  chevron?: boolean;
  external?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  labelColor?: string;
}) {
  const t = useT();
  return (
    <Tap onPress={onPress}>
      <Row gap={14} style={{ paddingVertical: 15, minHeight: 52 }}>
        {icon ? <Icon name={icon} size={21} color={t.textMid} /> : null}
        <T size={16} weight={700} color={labelColor ?? t.ink} style={{ flex: 1 }}>
          {label}
        </T>
        {value ? (
          <T size={16} color={t.muted}>
            {value}
          </T>
        ) : null}
        {right}
        {chevron ? <Icon name="chevR" size={17} color={t.faint} /> : null}
        {external ? <Icon name="arrowUR" size={16} color={t.faint} /> : null}
      </Row>
    </Tap>
  );
}

export function Loading() {
  const t = useT();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.paper,
      }}
    >
      <ActivityIndicator color={t.accent} />
    </View>
  );
}

export { ScrollView };

/* Layout-only styles. Colour lives in render so the theme can move. */
const S = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: RADIUS.pill,
  },
  segWrap: { flexDirection: 'row', padding: 4, borderRadius: RADIUS.pill },
  segItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    minHeight: 44,
  },
  pillShell: { borderRadius: RADIUS.pill, overflow: 'hidden' },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  dialogWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  dialog: {
    borderRadius: RADIUS.dialog,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
});
