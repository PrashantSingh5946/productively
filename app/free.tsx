/** 8.1 Free forever. No tiers, no trial, nothing to unlock later. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Row, Spacer, T, Tap, rowSkin } from '../src/ui';
import { Icon, IconName } from '../src/icons';
import { C, G, TASK_TONES } from '../src/theme';

import { useT } from '../src/theming';
const points = (): {
  icon: IconName;
  bg: string | readonly string[];
  fg: string;
  title: string;
  body: string;
  rail?: readonly string[];
}[] => [
  {
    icon: 'check',
    bg: G.accent,
    fg: C.ink,
    title: 'Every layout, every screen',
    body: 'Timeline view, unlimited routines, full history, all app icons.',
    rail: [C.accent, C.accentTintTo],
  },
  {
    icon: 'shield',
    bg: C.goodBg,
    fg: C.good,
    title: 'Your data stays yours',
    body: 'Kept on the device, backed up only if you ask, exportable any time.',
    rail: [C.stoneDeep, C.stone],
  },
  {
    icon: 'x',
    bg: TASK_TONES.pencil.bg,
    fg: TASK_TONES.pencil.fg,
    title: 'No ads, no upsells',
    body: 'Nothing in here is trying to sell you the next thing.',
  },
];

export default function Free() {
  useT();
  const insets = useSafeAreaInsets();

  return (
    <Grad
      colors={G.sunrise}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 22,
      }}
    >
      <Tap
        onPress={() => router.back()}
        hitSlop={14}
        style={{ position: 'absolute', right: 22, top: insets.top + 14, zIndex: 1 }}
      >
        <Icon name="x" size={24} color={C.textSoft} />
      </Tap>

      <T d size={34} weight={800} lh={40} center style={{ marginTop: 52 }}>
        Free, all of it
      </T>
      <T size={15.5} weight={500} lh={24} center color={C.accentInkDeep} style={{ marginTop: 14 }}>
        No tiers, no trial, no ads. Nothing to unlock later.
      </T>

      <View style={{ marginTop: 34 }}>
        {points().map((p, i) => (
          <Row key={p.title} gap={16} center={false}>
            <View style={{ alignItems: 'center' }}>
              {typeof p.bg === 'string' ? (
                <View style={[BULLET, { backgroundColor: p.bg }]}>
                  <Icon name={p.icon} size={22} color={p.fg} />
                </View>
              ) : (
                <Grad colors={p.bg} diag style={BULLET}>
                  <Icon name={p.icon} size={22} color={p.fg} />
                </Grad>
              )}
              {p.rail ? <Grad colors={p.rail} style={RAIL} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: i === points().length - 1 ? 0 : 26 }}>
              <T d size={17} weight={800} lh={22}>
                {p.title}
              </T>
              <T size={14.5} lh={22} color={C.muted} style={{ marginTop: 6 }}>
                {p.body}
              </T>
            </View>
          </Row>
        ))}
      </View>

      <Spacer />

      <Grad colors={G.card} style={[FOOT, rowSkin()]}>
        <T size={14.5} lh={23} color={C.textMid}>
          Built as a personal tool and kept that way. If a feature is missing, ask for it — that's
          the whole roadmap.
        </T>
      </Grad>

      <Button label="Got it" height={62} onPress={() => router.back()} style={{ marginTop: 14 }} />
    </Grad>
  );
}

const BULLET = {
  width: 46,
  height: 46,
  borderRadius: 23,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const RAIL = { width: 3, flex: 1 };

const FOOT = { paddingVertical: 20, paddingHorizontal: 22, borderRadius: 18 };
