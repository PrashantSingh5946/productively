/**
 * Shared primitives. Everything the screens draw is assembled from these so the
 * board's card / pill / ring language stays consistent across 50-odd screens.
 */
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextProps,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { C, DIAG, F, G, VERT } from './theme';
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
  color = C.ink,
  lh,
  center,
  ls,
  style,
  ...rest
}: TxtProps) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: faceFor(d, weight),
          fontSize: size,
          color,
          ...(lh ? { lineHeight: lh } : null),
          ...(center ? { textAlign: 'center' as const } : null),
          ...(ls !== undefined ? { letterSpacing: ls } : null),
        },
        style,
      ]}
    />
  );
}

/* ── gradients ────────────────────────────────────────────────────── */

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
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </LinearGradient>
  );
}

/** Sand-tinted card — the app's default container. */
export function Card({
  style,
  children,
  tinted,
  onPress,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Persimmon-washed variant with its border. */
  tinted?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <Grad
      colors={tinted ? G.accentWash : G.card}
      diag={tinted}
      style={[
        { borderRadius: 22, overflow: 'hidden' },
        tinted && { borderWidth: 1.5, borderColor: C.accentWashBorder },
        style,
      ]}
    >
      {children}
    </Grad>
  );
  return onPress ? <Tap onPress={onPress}>{inner}</Tap> : inner;
}

/* ── pressables ───────────────────────────────────────────────────── */

export function Tap({
  onPress,
  children,
  style,
  disabled,
  haptic = true,
  hitSlop,
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  hitSlop?: number;
}) {
  return (
    <Pressable
      hitSlop={hitSlop}
      disabled={disabled || !onPress}
      onPress={() => {
        if (haptic && haptics.enabled && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.();
      }}
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }]}
    >
      {children}
    </Pressable>
  );
}

type BtnKind = 'ink' | 'accent' | 'quiet' | 'ghost';

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
  const fg =
    disabled ? C.ghost : kind === 'ink' ? C.white : kind === 'quiet' ? C.textMid : C.ink;
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
      <View style={[{ borderRadius: 999, backgroundColor: C.disabled }, style]}>{content}</View>
    );
  }
  if (kind === 'ghost') {
    return (
      <Tap onPress={onPress} style={[S.btnGhost, { height, borderRadius: 999 }, style]}>
        {content}
      </Tap>
    );
  }
  if (kind === 'quiet') {
    return (
      <Tap onPress={onPress} style={style}>
        <Grad colors={G.press} style={{ borderRadius: 999 }}>
          {content}
        </Grad>
      </Tap>
    );
  }
  return (
    <Tap onPress={onPress} style={style}>
      <Grad colors={kind === 'accent' ? G.accent : G.ink} diag style={{ borderRadius: 999 }}>
        {content}
      </Grad>
    </Tap>
  );
}

/* ── ring / progress ──────────────────────────────────────────────── */

/**
 * Replaces the board's conic-gradient dials. `progress` 0–1; `over` swaps in
 * the overrun tone and fills the whole sweep.
 */
export function Dial({
  size,
  thickness,
  progress,
  over,
  children,
  inner,
  trackColor = C.cardTo,
}: {
  size: number;
  thickness: number;
  progress: number;
  over?: boolean;
  children?: React.ReactNode;
  /** Background colour of the punched-out centre. */
  inner?: string;
  trackColor?: string;
}) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const p = over ? 1 : Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGrad id="dialg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={over ? C.overRing : C.accentFrom} />
            <Stop offset="1" stopColor={over ? C.over : C.accentTo} />
          </SvgGrad>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#dialg)"
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${circ * p} ${circ}`}
          strokeLinecap={p > 0 && p < 1 ? 'round' : 'butt'}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          width: size - thickness * 2,
          height: size - thickness * 2,
          borderRadius: size,
          backgroundColor: inner ?? C.white,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Flat horizontal meter used for weekly completion and per-task averages. */
export function Meter({
  value,
  height = 7,
  fill,
  track = C.wellFrom,
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
  const w = `${Math.max(0, Math.min(1, value)) * 100}%` as const;
  return (
    <View
      style={{ height, borderRadius: radius, backgroundColor: track, overflow: 'hidden' }}
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
  const w = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <Grad colors={G.well} style={{ height: 7, borderRadius: 4, overflow: 'hidden' }}>
      {over ? (
        <View style={{ width: w, height: '100%', backgroundColor: C.over }} />
      ) : (
        <Grad colors={G.accent} diag style={{ width: w, height: '100%' }} />
      )}
    </Grad>
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
  const w = small ? 50 : 54;
  const h = small ? 29 : 31;
  const k = small ? 23 : 25;
  const knob = (
    <View
      style={{
        width: k,
        height: k,
        borderRadius: k,
        backgroundColor: C.white,
      }}
    />
  );
  return (
    <Tap onPress={() => onChange?.(!on)} hitSlop={8}>
      {on ? (
        <Grad
          colors={G.ink}
          diag
          style={{
            width: w,
            height: h,
            borderRadius: 999,
            paddingHorizontal: 3,
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexDirection: 'row',
          }}
        >
          {knob}
        </Grad>
      ) : (
        <View
          style={{
            width: w,
            height: h,
            borderRadius: 999,
            paddingHorizontal: 3,
            backgroundColor: C.ring,
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexDirection: 'row',
          }}
        >
          {knob}
        </View>
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
  return (
    <Grad colors={dark ? G.press : G.chip} style={S.segWrap}>
      {options.map((o) => {
        const on = o.key === value;
        const label = o.label ? (
          <T
            size={big ? 15.5 : 14.5}
            weight={on ? 700 : 600}
            color={on ? (dark ? C.white : C.ink) : dark ? C.faint : C.muted}
          >
            {o.label}
          </T>
        ) : null;
        const glyph = o.icon ? (
          <Icon name={o.icon} size={18} color={on ? (dark ? C.white : C.ink) : C.muted} />
        ) : null;
        const body = (
          <View style={[S.segItem, big && { flex: 1, paddingVertical: 13 }]}>
            {glyph}
            {label}
          </View>
        );
        return (
          <Tap key={o.key} onPress={() => onChange(o.key)} style={big ? { flex: 1 } : undefined}>
            {on ? (
              dark ? (
                <Grad colors={G.ink} diag style={{ borderRadius: 999 }}>
                  {body}
                </Grad>
              ) : (
                <View style={S.segOn}>{body}</View>
              )
            ) : (
              body
            )}
          </Tap>
        );
      })}
    </Grad>
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
  const fg =
    tone === 'ink' ? C.white : tone === 'tint' ? C.accentInkDeep : tone === 'accent' ? C.ink : C.textMid;
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
      <Grad colors={G.accentTint} diag style={S.pillShell}>
        {inner}
      </Grad>
    ) : tone === 'outline' ? (
      <View style={[S.pillShell, { borderWidth: 1.5, borderColor: C.border }]}>{inner}</View>
    ) : (
      <Grad colors={G.card} style={S.pillShell}>
        {inner}
      </Grad>
    );
  return onPress ? <Tap onPress={onPress}>{shell}</Tap> : shell;
}

/* ── sheet / dialog ───────────────────────────────────────────────── */

export function Sheet({
  visible,
  onClose,
  children,
  dimOpacity = 0.42,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dimOpacity?: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(20,20,24,${dimOpacity})` }]}
        onPress={onClose}
      />
      <View style={S.sheet}>
        <View style={S.grabber} />
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,20,24,0.42)' }]}
        onPress={onClose}
      />
      <View style={S.dialogWrap} pointerEvents="box-none">
        <View style={S.dialog}>{children}</View>
      </View>
    </Modal>
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

/** Back chevron + optional page dots, the recurring detail-screen header. */
export function TopBar({
  onBack,
  dots,
  right,
  center,
}: {
  onBack?: () => void;
  dots?: boolean;
  right?: React.ReactNode;
  center?: React.ReactNode;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingTop: 12 }}>
      <Tap onPress={onBack} hitSlop={12}>
        <Icon name="chevL" size={24} color={C.faint} />
      </Tap>
      {center}
      {dots ? (
        <Row gap={4}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={S.dot} />
          ))}
        </Row>
      ) : (
        right ?? <View style={{ width: 24 }} />
      )}
    </Row>
  );
}

/** Grouped settings card with a muted caption. */
export function Group({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Grad colors={G.card} style={[S.group, style]}>
      {title ? (
        <T size={13} weight={600} color={C.faint} style={{ paddingTop: 14, paddingBottom: 6 }}>
          {title}
        </T>
      ) : null}
      {children}
    </Grad>
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
  return (
    <Tap onPress={onPress}>
      <Row gap={14} style={{ paddingVertical: 15 }}>
        {icon ? <Icon name={icon} size={21} color={C.text} /> : null}
        <T size={16} weight={700} color={labelColor ?? C.ink} style={{ flex: 1 }}>
          {label}
        </T>
        {value ? (
          <T size={16} color={C.muted}>
            {value}
          </T>
        ) : null}
        {right}
        {chevron ? <Icon name="chevR" size={17} color={C.ghost} /> : null}
        {external ? <Icon name="arrowUR" size={16} color={C.ghost} /> : null}
      </Row>
    </Tap>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

export { ScrollView };

const S = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
  },
  btnGhost: { borderWidth: 1.6, borderColor: C.borderStrong },
  segWrap: { flexDirection: 'row', padding: 4, borderRadius: 999 },
  segItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
  },
  segOn: {
    backgroundColor: C.white,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pillShell: { borderRadius: 999, overflow: 'hidden' },
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
    backgroundColor: C.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 24,
  },
  grabber: {
    width: 56,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.borderStrong,
    alignSelf: 'center',
    marginBottom: 18,
  },
  dialogWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  dialog: {
    backgroundColor: C.white,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 24,
  },
  dot: { width: 4.5, height: 4.5, borderRadius: 3, backgroundColor: C.faint },
  group: { borderRadius: 22, paddingHorizontal: 18, paddingBottom: 8, overflow: 'hidden' },
});
