/** 5.1 Explore — rescue cards, single tasks to bolt on, routine templates. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G, TASK_TONES } from '../../src/theme';
import { RECOMMENDED_TASKS, RESET_CARDS, TEMPLATES, Template } from '../../src/data';
import { useStore } from '../../src/store';

const CATEGORIES: Template['category'][] = ['Morning', 'Evening', 'Focus', 'Rest'];

export default function Explore() {
  const insets = useSafeAreaInsets();
  const { addTasksToRoutine, state } = useStore();
  const [cat, setCat] = useState<Template['category']>('Morning');
  const [chips, setChips] = useState(['Timer guide', 'Routine tips']);
  const [added, setAdded] = useState<string[]>([]);

  const list = TEMPLATES.filter((t) => t.category === cat);

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingLeft: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', paddingTop: 12, paddingRight: 20 }}>
          <T d size={30} weight={800}>
            Explore
          </T>
          <View style={PICKS}>
            <T size={14} weight={700}>
              Picks
            </T>
            <Icon name="spark" size={15} color={C.accentDeep} />
          </View>
        </Row>

        {chips.length ? (
          <Row gap={10} style={{ marginTop: 18, paddingRight: 20 }}>
            {chips.map((label) => (
              <Tap
                key={label}
                onPress={() =>
                  router.push(
                    label === 'Timer guide'
                      ? { pathname: '/guide', params: { tab: 'timer' } }
                      : '/guide'
                  )
                }
              >
                <Row gap={8} style={BLUE_CHIP}>
                  <Icon name={label === 'Timer guide' ? 'clock' : 'bookmark'} size={17} color={C.info} />
                  <T size={14} weight={700} color={C.info}>
                    {label}
                  </T>
                  <Tap onPress={() => setChips((c) => c.filter((x) => x !== label))} hitSlop={10}>
                    <Icon name="x" size={13} color={C.info} opacity={0.7} />
                  </Tap>
                </Row>
              </Tap>
            ))}
          </Row>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 20, marginTop: 18 }}
          style={{ marginTop: 18 }}
        >
          {RESET_CARDS.map((r) => (
            <Tap key={r.id} onPress={() => router.push('/guide')}>
              <View style={[RESET, { backgroundColor: r.bg }]}>
                <View style={{ flex: 1 }}>
                  <View style={[TAG, { backgroundColor: r.tagBg }]}>
                    <T size={11} weight={700} color={C.white}>
                      RESET
                    </T>
                  </View>
                  <T d size={19} weight={800} lh={24} style={{ marginTop: 12 }}>
                    {r.title}
                  </T>
                </View>
                <View style={[RESET_ICON, { backgroundColor: r.iconBg }]}>
                  <Icon name={r.icon} size={28} color={r.iconColor} />
                </View>
              </View>
            </Tap>
          ))}
        </ScrollView>

        <T d size={21} weight={800} style={{ marginTop: 26 }}>
          Recommended for you
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          style={{ marginTop: 14 }}
        >
          {RECOMMENDED_TASKS.map((t) => {
            const on = added.includes(t.id);
            return (
              <Tap
                key={t.id}
                onPress={() => {
                  if (on) return;
                  addTasksToRoutine(state.routines[0].id, [t]);
                  setAdded((a) => [...a, t.id]);
                }}
              >
                <Grad colors={G.card} style={REC}>
                  <View style={REC_ICON}>
                    <Icon name={t.icon} size={20} color={TASK_TONES[t.tone].fg} />
                  </View>
                  <T size={14.5} weight={600} lh={18}>
                    {t.title}
                  </T>
                  <Icon name={on ? 'check' : 'plus'} size={17} color={on ? C.good : C.muted} />
                </Grad>
              </Tap>
            );
          })}
        </ScrollView>

        <T d size={21} weight={800} style={{ marginTop: 26 }}>
          Popular routines
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 9, paddingRight: 20 }}
          style={{ marginTop: 14 }}
        >
          {CATEGORIES.map((c) => {
            const on = c === cat;
            return (
              <Tap key={c} onPress={() => setCat(c)}>
                {on ? (
                  <Grad colors={G.ink} diag style={CAT}>
                    <T size={14} weight={700} color={C.white}>
                      {c}
                    </T>
                  </Grad>
                ) : (
                  <View style={[CAT, { borderWidth: 1.5, borderColor: C.border }]}>
                    <T size={14} weight={600} color={C.textMid}>
                      {c}
                    </T>
                  </View>
                )}
              </Tap>
            );
          })}
        </ScrollView>

        <View style={{ gap: 11, marginTop: 16, paddingRight: 20 }}>
          {list.map((t) => (
            <Tap key={t.id} onPress={() => router.push(`/template/${t.id}`)}>
              <Grad colors={G.card} style={TPL}>
                <View style={TPL_ICON}>
                  <Icon name={t.icon} size={24} color={t.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size={16} weight={700} lh={19}>
                    {t.name}
                  </T>
                  <T size={13} lh={17} color={C.muted} style={{ marginTop: 4 }}>
                    {t.blurb}
                  </T>
                  {t.badge ? (
                    <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                      {t.badge.tone === 'popular' ? (
                        <Grad colors={G.accentTint} diag style={BADGE}>
                          <T size={10.5} weight={700} color={C.accentInkDeep}>
                            {t.badge.label}
                          </T>
                        </Grad>
                      ) : (
                        <View style={[BADGE, { backgroundColor: '#E3F2EA' }]}>
                          <T size={10.5} weight={700} color="#4A8A6C">
                            {t.badge.label}
                          </T>
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
                <Icon name="chevR" size={17} color={C.ghost} />
              </Grad>
            </Tap>
          ))}
        </View>

        <Tap onPress={() => router.push('/task-picker')}>
          <Row gap={10} style={MORE_TASKS}>
            <Icon name="plus" size={18} color={C.textMid} />
            <T size={15} weight={700} color={C.textMid}>
              Find tasks that fit you
            </T>
          </Row>
        </Tap>
      </ScrollView>
    </View>
  );
}

const PICKS = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 7,
  paddingVertical: 10,
  paddingHorizontal: 18,
  borderRadius: 999,
  borderWidth: 1.5,
  borderColor: C.border,
};

const BLUE_CHIP = {
  paddingVertical: 12,
  paddingHorizontal: 18,
  borderRadius: 14,
  backgroundColor: C.infoBg,
};

const RESET = {
  width: 300,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 20,
};

const TAG = { alignSelf: 'flex-start' as const, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 7 };

const RESET_ICON = {
  width: 56,
  height: 56,
  borderRadius: 18,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const REC = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingVertical: 12,
  paddingLeft: 12,
  paddingRight: 16,
  borderRadius: 999,
};

const REC_ICON = {
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const CAT = { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 };

const TPL = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 20,
};

const TPL_ICON = {
  width: 46,
  height: 46,
  borderRadius: 15,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const BADGE = { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 };

const MORE_TASKS = {
  marginTop: 18,
  marginRight: 20,
  padding: 18,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
};
