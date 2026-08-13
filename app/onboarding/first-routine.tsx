/**
 * 1.11 First routine prepared. Tasks are editable here — the coach mark says
 * "reorder or remove anything that doesn't fit", so they actually do.
 *
 * No longer part of the onboarding flow: 1.10 finishes and goes straight to
 * Home (see the note there). Kept because it is a board screen and still works
 * end to end, so reinstating it is a one-line change to `streak.tsx`.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, Spacer, T, Tap, TopBar } from '../../src/ui';
import { EmptyCheck, TaskRow } from '../../src/components/TaskRow';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { FIRST_ROUTINE_TASKS, Task, fmtClock, totalMinutes } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function FirstRoutine() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, finishOnboarding } = useStore();

  /**
   * The routine this screen is actually editing: whichever one will run
   * earliest once onboarding finishes. With the sample account seeded that is a
   * real routine, so the rows you reorder are the rows you will wake up to. On
   * a clean build there is nothing yet and the board's template stands in — and
   * `finish` creates it for real.
   */
  const existing = useMemo(
    () => state.routines.slice().sort((a, b) => a.start - b.start)[0],
    [state.routines]
  );
  const [tasks, setTasks] = useState<Task[]>(existing?.tasks ?? FIRST_ROUTINE_TASKS);
  const [sel, setSel] = useState<string | null>(null);
  const [tip, setTip] = useState(true);

  const start = state.profile.wake;
  const end = useMemo(() => start + totalMinutes(tasks), [start, tasks]);

  const move = (id: string, dir: -1 | 1) =>
    setTasks((t) => {
      const i = t.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= t.length) return t;
      const next = t.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // Passing `tasks` is what makes the coach mark's "reorder or remove anything
  // that doesn't fit" true — the edits used to live in local state and be
  // thrown away on Done.
  const finish = () => {
    finishOnboarding(tasks);
    router.replace('/(tabs)/home');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.paper,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 20,
      }}
    >
      <TopBar onBack={() => router.back()} dots />

      <T d size={30} weight={800} lh={35} style={{ marginTop: 22 }}>
        Morning routine
      </T>
      <T size={15} weight={500} color={C.muted} style={{ marginTop: 8 }}>
        {fmtClock(start)} – {fmtClock(end)} ({totalMinutes(tasks)}m)
      </T>

      <View style={{ gap: 11, marginTop: 22 }}>
        {tasks.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            index={i}
            selected={sel === t.id}
            onPress={() => setSel((s) => (s === t.id ? null : t.id))}
            onMove={(d) => move(t.id, d)}
            onRemove={() => {
              setTasks((list) => list.filter((x) => x.id !== t.id));
              setSel(null);
            }}
            trailing={<EmptyCheck />}
          />
        ))}
      </View>

      {tip ? (
        <Grad colors={G.ink} diag style={TIP}>
          <View style={ARROW()} />
          <T size={14} lh={20} color={C.onInk} style={{ paddingRight: 24 }}>
            We've prepared your first routine. Reorder or remove anything that doesn't fit.
          </T>
          <Tap onPress={() => setTip(false)} hitSlop={10} style={CLOSE}>
            <Icon name="x" size={16} color="rgba(255,255,255,0.7)" />
          </Tap>
        </Grad>
      ) : null}

      <Spacer />

      <Row gap={14}>
        <Tap onPress={finish} style={{ flex: 1 }}>
          <Grad colors={G.accent} diag style={CTA}>
            <Icon name="play" size={18} color={C.accentOn} />
            <T d size={17} weight={700}>
              Done at {fmtClock(end)}
            </T>
          </Grad>
        </Tap>
        <Tap onPress={() => setTasks((t) => [...t, EXTRA])}>
          <Grad colors={G.ink} diag style={FAB}>
            <Icon name="plus" size={24} color={C.onInk} />
          </Grad>
        </Tap>
      </Row>
    </View>
  );
}

const EXTRA: Task = {
  id: 'f4',
  title: 'Deep breathing',
  icon: 'leaf',
  tone: 'leaf',
  minutes: 3,
};

const TIP = {
  position: 'relative' as const,
  marginTop: 12,
  marginHorizontal: 14,
  paddingVertical: 16,
  paddingLeft: 18,
  paddingRight: 16,
  borderRadius: 16,
};

const ARROW = () => ({
  position: 'absolute' as const,
  top: -7,
  right: 44,
  width: 14,
  height: 14,
  backgroundColor: C.inkFrom,
  transform: [{ rotate: '45deg' }],
  borderRadius: 3,
});

const CLOSE = { position: 'absolute' as const, top: 16, right: 16 };

const CTA = {
  height: 60,
  borderRadius: 999,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 10,
};

const FAB = {
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
