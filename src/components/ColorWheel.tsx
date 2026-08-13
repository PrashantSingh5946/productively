/**
 * The 3.3 colour wheel and its lightness rail.
 *
 * The board draws the ring as a CSS `conic-gradient`, which React Native has no
 * equivalent for — not in a view, not in `expo-linear-gradient`, which only
 * interpolates along a line. It is drawn here as `SEGMENTS` annular sectors in
 * SVG, each filled with one flat hue. At 72 segments the seams are a fraction
 * of a degree apart and read as continuous; the count is the only knob if that
 * ever needs revisiting.
 *
 * Hue and lightness are kept separate all the way through — the ring sets hue
 * at a fixed saturation and lightness so it stays legible, and the rail below
 * sets lightness against the chosen hue. Folding them into one control is what
 * makes colour pickers unusable with a thumb.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, PanResponder, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path } from 'react-native-svg';
import { C, SHADOW, lightnessRamp, wheelHues } from '../theme';

const SEGMENTS = 72;
/** Hole radius as a fraction of the outer radius — the board's 83/125. */
const INNER = 0.66;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

/** One annular sector, from `a1` to `a2` degrees, between radii `r` and `R`. */
function sector(cx: number, cy: number, r: number, R: number, a1: number, a2: number) {
  const p = (a: number, rr: number) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const [x1, y1] = p(a1, R);
  const [x2, y2] = p(a2, R);
  const [x3, y3] = p(a2, r);
  const [x4, y4] = p(a1, r);
  return `M${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 0 0 ${x4} ${y4}Z`;
}

export function ColorWheel({
  size,
  hue,
  onHue,
  children,
}: {
  size: number;
  hue: number;
  onHue: (hue: number) => void;
  children?: React.ReactNode;
}) {
  const c = size / 2;
  const R = c;
  const r = c * INNER;

  const hues = useMemo(() => wheelHues(SEGMENTS), []);
  const paths = useMemo(
    () =>
      hues.map((fill, i) => ({
        fill,
        // A hair of overlap past the next segment's start, so antialiasing
        // does not leave a paper-coloured hairline between every pair.
        d: sector(c, c, r, R, (i * 360) / SEGMENTS, ((i + 1) * 360) / SEGMENTS + 0.6),
      })),
    [hues, c, r, R]
  );

  // Latest handler without re-installing the PanResponder on every render —
  // recreating it mid-drag drops the gesture.
  const cb = useRef(onHue);
  cb.current = onHue;

  const pan = useMemo(
    () => {
      const track = (x: number, y: number) => {
        const dx = x - c;
        const dy = y - c;
        // atan2 measures from +x anticlockwise; the wheel starts at 12 o'clock
        // and runs clockwise, hence the quarter turn and the wrap.
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        cb.current(((deg % 360) + 360) % 360);
      };
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
      });
    },
    [c]
  );

  const knob = {
    left: c + (r + (R - r) / 2) * Math.cos(rad(hue)) - KNOB / 2,
    top: c + (r + (R - r) / 2) * Math.sin(rad(hue)) - KNOB / 2,
  };

  return (
    <View style={{ width: size, height: size }} {...pan.panHandlers}>
      {/* The ring is inert so every touch lands on the wrapper above, which is
          the only view whose bounds `locationX/Y` can be trusted against. */}
      <Svg width={size} height={size} pointerEvents="none">
        <G>
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.fill} />
          ))}
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: knob.left,
          top: knob.top,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          borderWidth: 4,
          borderColor: C.card,
          backgroundColor: hues[Math.round((hue / 360) * SEGMENTS) % SEGMENTS],
          boxShadow: SHADOW.knob,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: c - r,
          top: c - r,
          width: r * 2,
          height: r * 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

const KNOB = 28;

/**
 * Lightness from near-white to near-black at the current hue.
 *
 * Rendered as a many-stop linear gradient rather than the board's three, so
 * the middle of the rail is the actual colour at that lightness — with three
 * stops the interpolation runs through RGB and the midpoints lie.
 */
export function LightnessRail({
  hex,
  value,
  onChange,
  width,
}: {
  hex: string;
  value: number;
  onChange: (l: number) => void;
  width: number;
}) {
  const stops = useMemo(() => lightnessRamp(hex, 12), [hex]);
  const w = useRef(width);
  const cb = useRef(onChange);
  cb.current = onChange;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    w.current = e.nativeEvent.layout.width;
  }, []);

  const pan = useMemo(
    () => {
      // The rail runs light to dark, so x maps to 1 - lightness.
      const track = (x: number) => cb.current(1 - Math.min(1, Math.max(0, x / w.current)));
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => track(e.nativeEvent.locationX),
        onPanResponderMove: (e) => track(e.nativeEvent.locationX),
      });
    },
    []
  );

  return (
    <View style={{ width, height: 30, justifyContent: 'center' }} onLayout={onLayout} {...pan.panHandlers}>
      <LinearGradient
        colors={stops as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={{ height: 14, borderRadius: 999 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (1 - value) * width - 11,
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 4,
          borderColor: C.card,
          backgroundColor: hex,
          boxShadow: SHADOW.knob,
        }}
      />
    </View>
  );
}

/** The small conic coin on Customize that opens the wheel. */
export function WheelCoin({ size = 46 }: { size?: number }) {
  const c = size / 2;
  const hues = useMemo(() => wheelHues(SEGMENTS), []);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {hues.map((fill, i) => (
            <Path
              key={i}
              d={sector(c, c, 0, c, (i * 360) / SEGMENTS, ((i + 1) * 360) / SEGMENTS + 0.6)}
              fill={fill}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
