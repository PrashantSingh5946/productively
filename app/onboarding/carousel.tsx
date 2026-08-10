/** 1.3 + 1.4 Value carousel — two panels behind one Next button. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Dial, Grad, Row, Spacer, T, rowSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G, TASK_TONES } from '../../src/theme';

import { useT } from '../../src/theming';
const preview = () => [
  { title: 'Deep breathing', icon: 'leaf', color: C.accent, len: '1 min' },
  { title: 'Make the bed', icon: 'bed', color: C.textSoft, len: '1 min' },
  { title: 'Drink water', icon: 'bottle', color: TASK_TONES.water.fg, len: '1 min' },
  { title: 'Morning pages', icon: 'pencil', color: C.textSoft, len: '10 min' },
] as const;

export default function Carousel() {
  useT();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  const next = () => (page === 0 ? setPage(1) : router.push('/onboarding/intent'));

  return (
    <Grad
      colors={G.dawn}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 22,
      }}
    >
      <Row gap={8} style={{ paddingTop: 16, paddingHorizontal: 40 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i === page ? C.card : C.stoneDeep,
            }}
          />
        ))}
      </Row>

      {page === 0 ? <PanelOne /> : <PanelTwo />}

      <Spacer />
      <Button label="Next" onPress={next} />
    </Grad>
  );
}

function PanelOne() {
  return (
    <>
      <T d size={33} weight={800} lh={40} center style={{ marginTop: 34, marginHorizontal: 8 }}>
        {'Turn your tasks\ninto a flow'}
      </T>

      <Grad
        colors={G.tintSoft}
        diag
        style={{ marginTop: 34, borderRadius: 22, padding: 26, paddingVertical: 26 }}
      >
        <View
          style={{
            borderRadius: 18,
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.hairline,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 18,
          }}
        >
          <T d size={19} weight={700}>
            Morning Routine
          </T>
          <T size={12.5} weight={500} color={C.muted} style={{ marginTop: 6 }}>
            07:00am – 07:30am
          </T>

          <View style={{ gap: 9, marginTop: 16 }}>
            {preview().map((p) => (
              <Grad key={p.title} colors={G.card} style={[LINE, rowSkin()]}>
                <Icon name={p.icon} size={19} color={p.color} />
                <T size={14} weight={600} color={C.textMid} style={{ flex: 1 }}>
                  {p.title}
                </T>
                <T size={12} weight={500} color={C.muted}>
                  {p.len}
                </T>
              </Grad>
            ))}
          </View>

          <Grad
            colors={G.ink}
            diag
            style={{
              marginTop: 18,
              height: 48,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="play" size={20} color={C.onInk} />
          </Grad>
        </View>
      </Grad>
    </>
  );
}

function PanelTwo() {
  return (
    <>
      <T d size={33} weight={800} lh={40} center style={{ marginTop: 34, marginHorizontal: 8 }}>
        {'Just move when\nthe timer says so'}
      </T>

      <Grad
        colors={G.tintSoft}
        diag
        style={{ marginTop: 30, borderRadius: 22, padding: 22, paddingBottom: 26 }}
      >
        <Grad colors={G.accentTint} diag style={NOTIF}>
          <Grad
            colors={G.accent}
            diag
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="logo" size={22} color={C.ink} />
          </Grad>
          <View style={{ flex: 1 }}>
            <T size={13.5} weight={700} lh={18}>
              Time's up for this task
            </T>
            <T size={12.5} color={C.textMid} lh={16}>
              Move on to the next one.
            </T>
          </View>
        </Grad>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <T d size={17} weight={700}>
            Drink water
          </T>
          <View style={{ marginTop: 16 }}>
            <Dial size={196} thickness={15} progress={0.78} inner={C.accentWash}>
              <Icon name="bottle" size={34} color={TASK_TONES.water.fg} />
              <T d size={32} weight={800}>
                00:12
              </T>
              <T size={12} weight={500} color={C.muted}>
                1 min
              </T>
            </Dial>
          </View>
          <Row gap={34} style={{ marginTop: 20 }}>
            <Icon name="pause" size={22} color={C.muted} />
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 1.8,
                borderColor: C.ring,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={24} color={C.ink} />
            </View>
            <Icon name="skip" size={22} color={C.muted} />
          </Row>
        </View>
      </Grad>
    </>
  );
}

const LINE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 13,
};

const NOTIF = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 14,
};
