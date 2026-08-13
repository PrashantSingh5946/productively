/** 5.1 Explore — rescue cards, single tasks to bolt on, routine templates. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Overline, Row, Sheet, T, Tap, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, DOCK_CLEARANCE, G, IDENTITY, TASK_TONES } from '../../src/theme';
import { RECOMMENDED_TASKS, RESET_CARDS, TEMPLATES, Task, Template } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
const CATEGORIES: Template['category'][] = ['Morning', 'Evening', 'Focus', 'Rest'];

export default function Explore() {
  useT();
  const insets = useSafeAreaInsets();
  const { addTasksToRoutine, state } = useStore();
  const [cat, setCat] = useState<Template['category']>('Morning');
  const [chips, setChips] = useState(['Timer guide', 'Routine tips']);
  const [added, setAdded] = useState<string[]>([]);
  /** The recommended task waiting for the user to say which routine. */
  const [pending, setPending] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const list = TEMPLATES.filter((t) => t.category === cat);

  // The confirmation clears itself; the alternative is a banner that sits
  // there until the next unrelated tap moves it.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingLeft: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          The board draws a "Picks ✦" pill here — personalised suggestions, the
          one thing on this screen that would need a model behind it. It shipped
          as a control with no handler, which reads as broken rather than
          unfinished, so it is gone until there is something to open. See
          `docs/v2-audit.md` → "AI-assisted picks".
        */}
        <View style={{ paddingTop: 12, paddingRight: 20 }}>
          <Overline>Library</Overline>
          <T d size={30} weight={800} style={{ marginTop: 4 }}>
            Explore
          </T>
        </View>

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
                <Row gap={8} style={BLUE_CHIP()}>
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
            <Tap key={r.id} onPress={() => router.push(`/reset/${r.id}`)}>
              <View style={[RESET, { backgroundColor: C.reset[r.tone].bg }]}>
                <View style={{ flex: 1 }}>
                  <View style={[TAG, { backgroundColor: C.reset[r.tone].tag }]}>
                    <T size={11} weight={700} color={C.reset[r.tone].onTag}>
                      RESET
                    </T>
                  </View>
                  <T d size={19} weight={800} lh={24} style={{ marginTop: 12 }}>
                    {r.title}
                  </T>
                </View>
                <View style={[RESET_ICON, { backgroundColor: C.reset[r.tone].iconBg }]}>
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
                // This used to add straight to `routines[0]` and say nothing —
                // on an account with three routines it silently picked one, and
                // on an account with none it was a no-op. Both read as a dead
                // button. Ask, then confirm.
                onPress={() => setPending(t)}
              >
                <Grad colors={G.card} style={[REC, cardSkin()]}>
                  <View style={REC_ICON()}>
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
                    <T size={14} weight={700} color={C.onInk}>
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
              <Grad colors={G.card} style={[TPL, cardSkin()]}>
                <View style={TPL_ICON()}>
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
                        <View style={[BADGE, { backgroundColor: IDENTITY.badgeMint }]}>
                          <T size={10.5} weight={700} color={C.goodInk}>
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
          <Row gap={10} style={MORE_TASKS()}>
            <Icon name="plus" size={18} color={C.textMid} />
            <T size={15} weight={700} color={C.textMid}>
              Find tasks that fit you
            </T>
          </Row>
        </Tap>
      </ScrollView>

      {toast ? (
        <View style={TOAST_WRAP(insets.bottom)} pointerEvents="none">
          <Grad colors={G.ink} diag style={TOAST}>
            <Icon name="check" size={17} color={C.onInk} />
            <T size={14.5} weight={700} color={C.onInk}>
              {toast}
            </T>
          </Grad>
        </View>
      ) : null}

      <Sheet visible={!!pending} onClose={() => setPending(null)}>
        <T d size={22} weight={800}>
          Add to which routine?
        </T>
        <T size={14} lh={21} color={C.muted} style={{ marginTop: 8 }}>
          {pending ? `${pending.title.replace(/\n/g, ' ')} · ${pending.minutes}m` : ''}
        </T>

        <View style={{ gap: 11, marginTop: 20 }}>
          {state.routines.length === 0 ? (
            <T size={14.5} lh={22} color={C.muted}>
              You have no routines yet. Start one from a template below, and
              this will have somewhere to go.
            </T>
          ) : null}

          {state.routines.map((r) => (
            <Tap
              key={r.id}
              onPress={() => {
                if (!pending) return;
                addTasksToRoutine(r.id, [pending]);
                setAdded((a) => (a.includes(pending.id) ? a : [...a, pending.id]));
                setToast(`Added to ${r.name}`);
                setPending(null);
              }}
            >
              <Grad colors={G.card} style={[ROUTINE_PICK, cardSkin()]}>
                <Icon name="rows" size={20} color={C.textMid} />
                <T size={16} weight={700} style={{ flex: 1 }}>
                  {r.name}
                </T>
                <T size={13} weight={500} color={C.muted}>
                  {r.tasks.length} tasks
                </T>
              </Grad>
            </Tap>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const ROUTINE_PICK = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 17,
  paddingHorizontal: 18,
  borderRadius: 18,
};

/** Above the dock, not over it — the dock is the one thing always on screen. */
const TOAST_WRAP = (bottom: number) => ({
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: bottom + 128,
  alignItems: 'center' as const,
});

const TOAST = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 9,
  paddingVertical: 13,
  paddingHorizontal: 20,
  borderRadius: 999,
};

const BLUE_CHIP = () => ({
  paddingVertical: 12,
  paddingHorizontal: 18,
  borderRadius: 14,
  backgroundColor: C.infoBg,
});

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

const REC_ICON = () => ({
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: C.card,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

const CAT = { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 };

const TPL = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 20,
};

const TPL_ICON = () => ({
  width: 46,
  height: 46,
  borderRadius: 15,
  backgroundColor: C.card,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

const BADGE = { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 };

const MORE_TASKS = () => ({
  marginTop: 18,
  marginRight: 20,
  padding: 18,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
});
