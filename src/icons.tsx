/**
 * The board's hand-drawn flat icon set, ported 1:1 from its <symbol> defs.
 * No emoji anywhere in the app — every glyph comes from here.
 */
import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { C, IDENTITY } from './theme';

export type IconName =
  | 'chevL' | 'chevR' | 'chevD' | 'arrowUR' | 'plus' | 'check' | 'x'
  | 'gear' | 'bell' | 'filter' | 'clock' | 'cal' | 'alarm' | 'headset'
  | 'help' | 'compass' | 'flask' | 'star' | 'starF' | 'share' | 'gift'
  | 'bookmark' | 'spark' | 'lock' | 'grid' | 'play' | 'playc' | 'pause'
  | 'skip' | 'search' | 'people' | 'chart' | 'user' | 'note' | 'trophy'
  | 'flame' | 'leaf' | 'ring' | 'sun' | 'moon' | 'drop' | 'bottle' | 'bed'
  | 'heart' | 'book' | 'cup' | 'screen' | 'pencil' | 'dumbbell' | 'pill'
  | 'target' | 'list' | 'rows' | 'img' | 'shield' | 'mail' | 'logo'
  | 'cloud' | 'cloudUp' | 'cloudDown' | 'download' | 'trash' | 'refresh';

type Props = { name: IconName; size?: number; color?: string; opacity?: number };

/** Shared stroke geometry so every outline icon reads as one hand. */
const S = (w: number, extra: object = {}) => ({
  fill: 'none' as const,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...extra,
});

export function Icon({ name, size = 24, color, opacity }: Props) {
  const c = color ?? C.ink;
  const vb = name === 'logo' ? '0 0 40 40' : '0 0 24 24';

  return (
    <Svg width={size} height={size} viewBox={vb} opacity={opacity}>
      {body(name, c)}
    </Svg>
  );
}

function body(name: IconName, c: string): React.ReactNode {
  switch (name) {
    case 'chevL':
      return <Path d="M15 4.5 7.5 12 15 19.5" stroke={c} {...S(2.2)} />;
    case 'chevR':
      return <Path d="M9 4.5 16.5 12 9 19.5" stroke={c} {...S(2.2)} />;
    case 'chevD':
      return <Path d="M5 9l7 7 7-7" stroke={c} {...S(2.2)} />;
    case 'arrowUR':
      return <Path d="M7 17 17 7M8 7h9v9" stroke={c} {...S(2)} />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" stroke={c} {...S(2.2)} />;
    case 'check':
      return <Path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke={c} {...S(2.4)} />;
    case 'x':
      return <Path d="M6 6l12 12M18 6 6 18" stroke={c} {...S(2.2)} />;

    case 'gear':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="3.2" />
          <Path d="M12 2.6l1.5 2.2 2.6-.5.6 2.6 2.4 1.1-1 2.5 1 2.5-2.4 1.1-.6 2.6-2.6-.5L12 21.4l-1.5-2.2-2.6.5-.6-2.6-2.4-1.1 1-2.5-1-2.5 2.4-1.1.6-2.6 2.6.5z" />
        </G>
      );
    case 'bell':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" />
          <Path d="M10 18a2 2 0 0 0 4 0" />
        </G>
      );
    case 'filter':
      return <Path d="M4 7h16M7 12h10M10 17h4" stroke={c} {...S(1.9)} />;
    case 'clock':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M12 7.5V12l3 1.8" />
        </G>
      );
    case 'cal':
      return (
        <G stroke={c} {...S(1.9)}>
          <Rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <Path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
        </G>
      );
    case 'alarm':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="13" r="7.5" />
          <Path d="M12 9.5V13l2.5 1.5M4 6l3-2.5M20 6l-3-2.5" />
        </G>
      );
    case 'headset':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
          <Rect x="2.8" y="13" width="4" height="6.5" rx="2" />
          <Rect x="17.2" y="13" width="4" height="6.5" rx="2" />
          <Path d="M19.2 19.5c0 1.4-1.6 2.3-3.4 2.3" />
        </G>
      );
    case 'help':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="8.6" />
          <Path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.5v.4" />
          <Circle cx="12" cy="16.6" r=".9" fill={c} stroke="none" />
        </G>
      );
    case 'compass':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="8.6" />
          <Path d="M15.4 8.6 13.6 13.6 8.6 15.4 10.4 10.4z" />
        </G>
      );
    case 'flask':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M9.5 3v6.2L4.8 17.4A2.4 2.4 0 0 0 6.9 21h10.2a2.4 2.4 0 0 0 2.1-3.6L14.5 9.2V3" />
          <Path d="M8.4 3h7.2M7.6 14.5h8.8" />
        </G>
      );
    case 'star':
      return (
        <Path
          d="m12 3.6 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z"
          stroke={c}
          {...S(1.9)}
        />
      );
    case 'starF':
      return (
        <Path
          d="m12 3.6 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z"
          fill={c}
        />
      );
    case 'share':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
          <Path d="M5 13.5v5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-5" />
        </G>
      );
    case 'gift':
      return (
        <G stroke={c} {...S(1.9)}>
          <Rect x="3.5" y="9" width="17" height="11.5" rx="2" />
          <Path d="M2.5 9h19v3.5h-19zM12 9v11.5" />
          <Path d="M12 9S10.6 4 8.3 4a2.2 2.2 0 0 0 0 5M12 9s1.4-5 3.7-5a2.2 2.2 0 0 1 0 5" />
        </G>
      );
    case 'bookmark':
      return <Path d="M6 3.8h12v17l-6-4.2-6 4.2z" stroke={c} {...S(1.9)} />;
    case 'spark':
      return (
        <G fill={c}>
          <Path d="M12 2.6c.9 4.5 2.4 6 6.9 6.9-4.5.9-6 2.4-6.9 6.9-.9-4.5-2.4-6-6.9-6.9 4.5-.9 6-2.4 6.9-6.9z" />
          <Path d="M18.6 15.4c.5 2.3 1.2 3 3.4 3.4-2.2.5-2.9 1.2-3.4 3.4-.5-2.2-1.2-2.9-3.4-3.4 2.2-.4 2.9-1.1 3.4-3.4z" />
        </G>
      );
    case 'lock':
      return (
        <G stroke={c} {...S(1.9)}>
          <Rect x="4.5" y="10.5" width="15" height="10" rx="2.6" />
          <Path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
        </G>
      );
    case 'grid':
      return (
        <G stroke={c} {...S(2)}>
          <Rect x="3.6" y="3.6" width="7" height="7" rx="2" />
          <Rect x="13.4" y="3.6" width="7" height="7" rx="2" />
          <Rect x="3.6" y="13.4" width="7" height="7" rx="2" />
          <Rect x="13.4" y="13.4" width="7" height="7" rx="2" />
        </G>
      );
    case 'play':
      return (
        <Path
          d="M8 5.3v13.4a.7.7 0 0 0 1.07.6l10.4-6.7a.7.7 0 0 0 0-1.2L9.07 4.7A.7.7 0 0 0 8 5.3z"
          fill={c}
        />
      );
    case 'playc':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="8.8" />
          <Path d="M10.2 8.7 15.8 12l-5.6 3.3z" fill={c} />
        </G>
      );
    case 'pause':
      return (
        <G fill={c}>
          <Rect x="6.4" y="5" width="3.6" height="14" rx="1.6" />
          <Rect x="14" y="5" width="3.6" height="14" rx="1.6" />
        </G>
      );
    case 'skip':
      return (
        <G fill={c}>
          <Path d="M5 5.6v12.8a.6.6 0 0 0 .93.5l9.2-6.4a.6.6 0 0 0 0-1L5.93 5.1A.6.6 0 0 0 5 5.6z" />
          <Rect x="16.6" y="5" width="2.8" height="14" rx="1.3" />
        </G>
      );
    case 'search':
      return (
        <G stroke={c} {...S(2)}>
          <Circle cx="11" cy="11" r="6.8" />
          <Path d="m16.2 16.2 4.3 4.3" />
        </G>
      );
    case 'people':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="9" cy="8.4" r="3.4" />
          <Circle cx="16.6" cy="9.2" r="2.6" />
          <Path d="M3.4 18.6c0-3 2.5-4.6 5.6-4.6s5.6 1.6 5.6 4.6" />
          <Path d="M16.4 14.4c2.5.2 4.2 1.7 4.2 4.2" />
        </G>
      );
    case 'chart':
      return <Path d="M5 19.4V11M12 19.4V4.6M19 19.4v-5.8" stroke={c} {...S(2.1)} />;
    case 'user':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="8.2" r="3.9" />
          <Path d="M4.6 20c0-3.7 3.3-5.8 7.4-5.8s7.4 2.1 7.4 5.8" />
        </G>
      );
    case 'note':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M5 4.6h9.4L19 9.2V19.4a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 5 4.6z" />
          <Path d="M14 4.6v5h5M7.5 13h8M7.5 16.6h5" />
        </G>
      );
    case 'trophy':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M7 4h10v5a5 5 0 0 1-10 0z" />
          <Path d="M7 5.5H4.4V7a3.4 3.4 0 0 0 3 3.4M17 5.5h2.6V7a3.4 3.4 0 0 1-3 3.4M9.5 20h5M12 14v6" />
        </G>
      );
    case 'flame':
      return (
        <Path
          d="M13 2.3c.5 3-1.4 4.4-2.9 5.9C8.3 9.9 7 11.6 7 14.2A5.6 5.6 0 0 0 12.6 20a5.6 5.6 0 0 0 5.6-5.8c0-3.4-2.3-5.3-3.3-8.2-.4 1.4-1.2 2-2 2.6.5-2.3.6-4.4.1-6.3z"
          fill={c}
        />
      );
    case 'leaf':
      return (
        <Path
          d="M20 3.6c-9 0-14 3.3-14 9.4 0 1.6.5 3 1.3 4.1L4 20.4l1.5 1.5 3.3-3.3c1.2.8 2.6 1.2 4.2 1.2C18.6 19.8 20 12.6 20 3.6z"
          fill={c}
        />
      );
    case 'ring':
      return (
        <G stroke={c} {...S(2.3)}>
          <Path d="M12 3.2a8.8 8.8 0 1 1-8.8 8.8" />
          <Path d="M12 7.8a4.2 4.2 0 1 1-4.2 4.2" />
        </G>
      );
    case 'sun':
      return (
        <G stroke={c} {...S(1.9)}>
          <Circle cx="12" cy="12" r="4.2" />
          <Path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
        </G>
      );
    case 'moon':
      return (
        <Path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.7 8.7 0 1 0 20 14.4z" stroke={c} {...S(1.9)} />
      );
    case 'drop':
      return (
        <Path d="M12 2.8c4 4.9 6.4 8.2 6.4 11.2A6.4 6.4 0 0 1 5.6 14c0-3 2.4-6.3 6.4-11.2z" fill={c} />
      );
    case 'bottle':
      return (
        <G fill={c}>
          <Rect x="9.4" y="2.4" width="5.2" height="2.6" rx="1" />
          <Path d="M9.4 5.6h5.2v1.7l1.6 2.3v10.6a2.4 2.4 0 0 1-2.4 2.4h-3.6a2.4 2.4 0 0 1-2.4-2.4V9.6l1.6-2.3z" />
        </G>
      );
    case 'bed':
      return (
        <G fill={c}>
          <Path d="M3 10.4h8.2V8a1.4 1.4 0 0 1 1.4-1.4h5.2A3.2 3.2 0 0 1 21 9.8v2.6H3z" />
          <Rect x="2.2" y="13.6" width="19.6" height="3.4" rx="1.4" />
          <Rect x="2.6" y="17.4" width="2.4" height="3" rx="1" />
          <Rect x="19" y="17.4" width="2.4" height="3" rx="1" />
        </G>
      );
    case 'heart':
      return (
        <Path
          d="M12 20.6 4.6 13.4a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 1 1 6.6 6.7z"
          fill={c}
        />
      );
    case 'book':
      return (
        <G fill={c}>
          <Path d="M4 4.4h6.2A2.8 2.8 0 0 1 13 7.2v13a3.6 3.6 0 0 0-2.8-1.3H4z" />
          <Path
            d="M20 4.4h-6.2A2.8 2.8 0 0 0 11 7.2v13a3.6 3.6 0 0 1 2.8-1.3H20z"
            opacity={0.55}
          />
        </G>
      );
    case 'cup':
      return (
        <G fill={c}>
          <Path d="M4 8h12v6.6a4.6 4.6 0 0 1-4.6 4.6H8.6A4.6 4.6 0 0 1 4 14.6z" />
          <Path d="M16.6 9.4h1.6a2.6 2.6 0 0 1 0 5.2h-1.6z" opacity={0.5} />
          <Rect x="3" y="20.4" width="14" height="1.8" rx=".9" />
        </G>
      );
    case 'screen':
      return (
        <G fill={c}>
          <Rect x="2.4" y="4" width="19.2" height="12.6" rx="2.4" />
          <Rect x="8.4" y="19.4" width="7.2" height="1.8" rx=".9" />
        </G>
      );
    case 'pencil':
      return (
        <G fill={c}>
          <Path d="m14.9 4.6 4.5 4.5L9.6 18.9l-5.6 1.1 1.1-5.6z" />
          <Path
            d="m16.4 3.1 1.6-1.6a1.4 1.4 0 0 1 2 0l2.5 2.5a1.4 1.4 0 0 1 0 2l-1.6 1.6z"
            opacity={0.5}
          />
        </G>
      );
    case 'dumbbell':
      return (
        <G fill={c}>
          <Rect x="2" y="9.4" width="3" height="5.2" rx="1.2" />
          <Rect x="5.6" y="7.4" width="3.4" height="9.2" rx="1.4" />
          <Rect x="9" y="10.8" width="6" height="2.4" />
          <Rect x="15" y="7.4" width="3.4" height="9.2" rx="1.4" />
          <Rect x="19" y="9.4" width="3" height="5.2" rx="1.2" />
        </G>
      );
    case 'pill':
      return (
        <G>
          <Path
            d="M4.9 12.4 12.4 4.9a4.6 4.6 0 0 1 6.6 6.6l-7.5 7.5a4.6 4.6 0 0 1-6.6-6.6z"
            fill={c}
          />
          <Path d="M8.6 8.6 15.4 15.4" stroke={C.card} strokeWidth={1.8} />
        </G>
      );
    case 'target':
      return (
        <G stroke={c} strokeWidth={1.9} fill="none">
          <Circle cx="12" cy="12" r="8.4" />
          <Circle cx="12" cy="12" r="4.6" />
          <Circle cx="12" cy="12" r="1.2" fill={c} />
        </G>
      );
    case 'list':
      return (
        <Path
          d="M8.4 6.4h11.2M8.4 12h11.2M8.4 17.6h11.2M4.4 6.4h.02M4.4 12h.02M4.4 17.6h.02"
          stroke={c}
          {...S(2)}
        />
      );
    case 'rows':
      return (
        <G stroke={c} strokeWidth={1.8} fill="none">
          <Rect x="3.4" y="4.4" width="17.2" height="4.4" rx="1.6" />
          <Rect x="3.4" y="10.6" width="12" height="4.4" rx="1.6" />
          <Rect x="3.4" y="16.8" width="17.2" height="3.2" rx="1.4" />
        </G>
      );
    case 'img':
      return (
        <G stroke={c} {...S(1.8)}>
          <Rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.6" />
          <Circle cx="8.8" cy="9.8" r="1.8" />
          <Path d="m4.4 17.6 4.8-4.6 3.4 3 3-2.6 5 4.2" />
        </G>
      );
    case 'shield':
      return (
        <Path
          d="M12 2.8 4.6 5.8v6c0 4.4 3 8 7.4 9.4 4.4-1.4 7.4-5 7.4-9.4v-6z"
          stroke={c}
          {...S(1.9)}
        />
      );
    case 'mail':
      return (
        <G stroke={c} {...S(1.9)}>
          <Rect x="3" y="5.4" width="18" height="13.2" rx="2.6" />
          <Path d="m3.8 7 8.2 6 8.2-6" />
        </G>
      );
    // One cloud silhouette, three payloads — the backup screens read as a set.
    case 'cloud':
    case 'cloudUp':
    case 'cloudDown':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M7.2 18.5A4.2 4.2 0 0 1 6.8 10.2 5.6 5.6 0 0 1 17.6 9.4a3.9 3.9 0 0 1 .6 7.7z" />
          {name === 'cloudUp' ? <Path d="M12 20.5v-6m0 0-2.2 2.2M12 14.5l2.2 2.2" /> : null}
          {name === 'cloudDown' ? <Path d="M12 14.5v6m0 0-2.2-2.2M12 20.5l2.2-2.2" /> : null}
        </G>
      );
    case 'download':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M12 3.5v11m0 0-4-4m4 4 4-4" />
          <Path d="M4.5 16.5v2.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-2.2" />
        </G>
      );
    case 'trash':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
          <Path d="M6.6 6.5l.9 12.2a1.8 1.8 0 0 0 1.8 1.7h5.4a1.8 1.8 0 0 0 1.8-1.7l.9-12.2" />
        </G>
      );
    case 'refresh':
      return (
        <G stroke={c} {...S(1.9)}>
          <Path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <Path d="M20 4v4.4h-4.4" />
        </G>
      );
    case 'logo':
      return (
        <G fill={c}>
          <Rect x="7" y="8.5" width="26" height="6" rx="3" opacity={0.38} />
          <Rect x="7" y="17" width="26" height="6" rx="3" />
          <Rect x="7" y="25.5" width="18" height="6" rx="3" opacity={0.62} />
        </G>
      );
    default:
      return null;
  }
}

/** The five mood faces from the end-of-routine review. */
export function MoodFace({
  level,
  size = 26,
  color,
}: {
  level: 0 | 1 | 2 | 3 | 4;
  size?: number;
  color?: string;
}) {
  const c = color ?? IDENTITY.moodFace;
  const s = S(level === 3 ? 1.9 : 1.8);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {level === 4 ? (
        <G stroke={c} {...s}>
          <Path d="M6.8 9.6a2.4 2.4 0 0 1 3.6 0M13.6 9.6a2.4 2.4 0 0 1 3.6 0" />
          <Path d="M7.8 14a5.2 5.2 0 0 0 8.4 0" />
        </G>
      ) : (
        <G stroke={c} {...s}>
          <Circle cx="8.6" cy={level === 3 ? '9.4' : '9.6'} r={level === 3 ? 1 : 0.9} fill={c} />
          <Circle cx="15.4" cy={level === 3 ? '9.4' : '9.6'} r={level === 3 ? 1 : 0.9} fill={c} />
          {level === 0 && <Path d="M8.4 16.4a4.6 4.6 0 0 1 7.2 0" />}
          {level === 1 && <Path d="M8.6 15.6h6.8" />}
          {level === 2 && <Path d="M8.6 15.2h6.8" />}
          {level === 3 && <Path d="M7.8 14.4a5.2 5.2 0 0 0 8.4 0" />}
        </G>
      )}
    </Svg>
  );
}
