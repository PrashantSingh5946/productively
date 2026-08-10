/** 9.1 User guide. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap, TopBar, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { ARTICLES } from '../../src/data';

import { useT } from '../../src/theming';
const TIMER_TOPICS = [
  { id: 'consistency', title: 'When consistency beats speed' },
  { id: 'what', title: 'What is a routine?' },
  { id: 'bends', title: 'Designing a routine that bends' },
];

export default function Guide() {
  useT();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'habits' | 'timer'>(tab === 'timer' ? 'timer' : 'habits');

  const list =
    mode === 'habits'
      ? ARTICLES
      : TIMER_TOPICS.map((t) => ARTICLES.find((a) => a.id === t.id)!).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingLeft: 20 }}>
      <View style={{ paddingRight: 20 }}>
        <TopBar onBack={() => router.back()} />
      </View>

      <T d size={30} weight={800} style={{ marginTop: 16 }}>
        User guide
      </T>

      <Row gap={10} style={{ marginTop: 22, paddingRight: 20 }}>
        {(
          [
            { key: 'habits', label: 'Habit articles', icon: 'bookmark' },
            { key: 'timer', label: 'Timer guide', icon: 'clock' },
          ] as const
        ).map((t) => {
          const on = mode === t.key;
          return (
            <Tap key={t.key} onPress={() => setMode(t.key)}>
              {on ? (
                <Grad colors={G.ink} diag style={TAB}>
                  <Icon name={t.icon} size={17} color={C.onInk} />
                  <T size={15} weight={700} color={C.onInk}>
                    {t.label}
                  </T>
                </Grad>
              ) : (
                <View style={[TAB, { borderWidth: 1.5, borderColor: C.border }]}>
                  <Icon name={t.icon} size={17} color={C.text} />
                  <T size={15} weight={600} color={C.text}>
                    {t.label}
                  </T>
                </View>
              )}
            </Tap>
          );
        })}
      </Row>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          paddingTop: 22,
          paddingRight: 20,
          paddingBottom: insets.bottom + 28,
        }}
      >
        {list.map((a, i) => (
          <Tap key={a.id} onPress={() => router.push(`/guide/${a.id}`)}>
            <Grad colors={G.card} style={[CARD, cardSkin()]}>
              <Grad colors={G.accent} diag style={ART_ICON}>
                <Icon name={a.icon} size={32} color={C.accentOn} />
              </Grad>
              <View style={{ flex: 1 }}>
                <T size={12.5} weight={500} color={C.faint}>
                  {mode === 'habits' ? a.vol : `topic ${String(i + 1).padStart(2, '0')}`}
                </T>
                <T d size={17} weight={800} lh={21} style={{ marginTop: 5 }}>
                  {a.title}
                </T>
                {a.blurb ? (
                  <T size={13.5} lh={19} color={C.muted} style={{ marginTop: 5 }}>
                    {a.blurb}
                  </T>
                ) : null}
              </View>
            </Grad>
          </Tap>
        ))}
      </ScrollView>
    </View>
  );
}

const TAB = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 9,
  paddingVertical: 13,
  paddingHorizontal: 22,
  borderRadius: 999,
};

const CARD = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 16,
  padding: 16,
  borderRadius: 20,
};

const ART_ICON = {
  width: 66,
  height: 66,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
