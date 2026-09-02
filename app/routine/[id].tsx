/** 3.1 Routine detail — the full task list with the run CTA. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, IconButton, MenuSheet, Pill, Prompt, Row, Sheet, T, Tap, TopBar } from '../../src/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { TaskComposer } from '../../src/components/TaskComposer';
import { WheelSheet } from '../../src/components/WheelSheet';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { DAY_LETTERS, Task, daysLabel, fmtClock, totalMinutes } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';

/** Start times on the quarter hour — 96 rows is a scrollable list, 1440 is not. */
const SLOTS = Array.from({ length: 96 }, (_, i) => i * 15);

export default function RoutineDetail() {
  useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    state,
    routine,
    streakFor,
    moveTask,
    removeTask,
    updateTask,
    addTasksToRoutine,
    updateRoutine,
    removeRoutine,
  } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [rename, setRename] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** `true` composes a new task; a Task edits that one. */
  const [compose, setCompose] = useState<true | Task | null>(null);

  const r = routine(String(id));
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
        <TopBar onBack={() => router.back()} />
        <T size={16} color={C.muted} style={{ marginTop: 24 }}>
          That routine is no longer here.
        </T>
      </View>
    );
  }

  const total = totalMinutes(r.tasks);
  const end = r.start + total;
  const h12 = state.settings.timeFormat12;

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
      {/* The board draws three dots here. They were decoration — a control that
          looks exactly like a menu button and opens nothing. Now it is one. */}
      <TopBar
        onBack={() => router.back()}
        right={<IconButton icon="dots" onPress={() => setMenu(true)} size={40} glyph={20} />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <T d size={30} weight={800} lh={35} style={{ marginTop: 18 }}>
          {r.name}
        </T>
        <T size={15} weight={500} color={C.muted} style={{ marginTop: 8 }}>
          {r.tasks.length
            ? `${fmtClock(r.start, !h12)} – ${fmtClock(end, !h12)} (${total}m) · ${r.tasks.length} tasks`
            : `${fmtClock(r.start, !h12)} · no tasks yet`}
        </T>

        <Row gap={8} style={{ marginTop: 16 }}>
          {/* A zero is not an achievement — the pill only earns its place once
              there is a streak to show. */}
          {streakFor(r.id) > 0 ? (
            <Pill label={`${streakFor(r.id)}-day streak`} tone="tint" size={12.5} />
          ) : null}
          <Pill label={daysLabel(r.days)} tone="sand" size={12.5} />
        </Row>

        <View style={{ gap: 10, marginTop: 20 }}>
          {r.tasks.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              index={i}
              selected={sel === t.id}
              onPress={() => setSel((s) => (s === t.id ? null : t.id))}
              onEdit={() => {
                setCompose(t);
                setSel(null);
              }}
              onMove={(d) => moveTask(r.id, t.id, d)}
              onRemove={() => {
                removeTask(r.id, t.id);
                setSel(null);
              }}
            />
          ))}
        </View>

        {r.tasks.length === 0 ? (
          <T size={14.5} lh={22} color={C.muted} style={{ marginTop: 4 }}>
            No tasks yet. Add the two or three you would still do on a bad
            morning, and leave it there for a week.
          </T>
        ) : null}

        <Tap onPress={() => setCompose(true)}>
          <Row gap={10} style={DASHED()}>
            <Icon name="plus" size={18} color={C.textMid} />
            <T size={15} weight={700} color={C.textMid}>
              Write your own task
            </T>
          </Row>
        </Tap>

        <Tap onPress={() => router.push({ pathname: '/task-picker', params: { routineId: r.id } })}>
          <Row gap={10} style={[DASHED(), { marginTop: 10 }]}>
            <Icon name="compass" size={18} color={C.ghost} />
            <T size={15} weight={600} color={C.ghost}>
              Browse suggested tasks
            </T>
          </Row>
        </Tap>
      </ScrollView>

      <Row gap={14}>
        <Tap
          onPress={() => r.tasks.length && router.push(`/run/${r.id}`)}
          disabled={r.tasks.length === 0}
          style={{ flex: 1 }}
        >
          <Grad colors={r.tasks.length ? G.accent : G.press} diag style={CTA}>
            <Icon name="play" size={18} color={r.tasks.length ? C.accentOn : C.ghost} />
            <T d size={17} weight={700} color={r.tasks.length ? undefined : C.ghost}>
              {r.tasks.length ? `Done at ${fmtClock(end, !h12)}` : 'Nothing to run'}
            </T>
          </Grad>
        </Tap>
        <Tap onPress={() => setCompose(true)}>
          <Grad colors={G.ink} diag style={FAB}>
            <Icon name="plus" size={24} color={C.onInk} />
          </Grad>
        </Tap>
      </Row>

      <TaskComposer
        visible={compose !== null}
        task={compose === true ? undefined : (compose ?? undefined)}
        onClose={() => setCompose(null)}
        onSubmit={(draft) => {
          if (compose === true) addTasksToRoutine(r.id, [{ ...draft, id: 'new' }]);
          else if (compose) updateTask(r.id, compose.id, draft);
        }}
      />

      <MenuSheet
        visible={menu}
        title={r.name}
        onClose={() => setMenu(false)}
        actions={[
          { key: 'rename', label: 'Rename routine', icon: 'pencil', onPress: () => setRename(true) },
          { key: 'time', label: 'Change start time', icon: 'clock', onPress: () => setTimeOpen(true) },
          { key: 'days', label: 'Repeat days', icon: 'cal', onPress: () => setDaysOpen(true) },
          {
            key: 'delete',
            label: 'Delete routine',
            icon: 'trash',
            danger: true,
            onPress: () => setConfirmDelete(true),
          },
        ]}
      />

      <Prompt
        visible={rename}
        title="Rename routine"
        initial={r.name}
        onClose={() => setRename(false)}
        onSubmit={(v) => updateRoutine(r.id, { name: v })}
      />

      <WheelSheet
        visible={timeOpen}
        title="Starts at"
        options={SLOTS.map((m) => fmtClock(m, !h12))}
        value={fmtClock(SLOTS.reduce((a, b) => (Math.abs(b - r.start) < Math.abs(a - r.start) ? b : a)), !h12)}
        onClose={() => setTimeOpen(false)}
        onDone={(label) => {
          const i = SLOTS.findIndex((m) => fmtClock(m, !h12) === label);
          if (i >= 0) updateRoutine(r.id, { start: SLOTS[i] });
          setTimeOpen(false);
        }}
      />

      <DaysSheet
        visible={daysOpen}
        days={r.days}
        onClose={() => setDaysOpen(false)}
        onChange={(days) => updateRoutine(r.id, { days })}
      />

      <MenuSheet
        visible={confirmDelete}
        title={`Delete "${r.name}"?`}
        onClose={() => setConfirmDelete(false)}
        actions={[
          {
            key: 'yes',
            // Said plainly, because it is not just the routine — its runs go
            // too, and with them whatever streak the user is looking at.
            label: 'Delete it and its history',
            icon: 'trash',
            danger: true,
            onPress: () => {
              removeRoutine(r.id);
              router.back();
            },
          },
        ]}
      />
    </View>
  );
}

/** Repeat days, toggled in place — Done is the only way out that commits. */
function DaysSheet({
  visible,
  days,
  onClose,
  onChange,
}: {
  visible: boolean;
  days: number[];
  onClose: () => void;
  onChange: (days: number[]) => void;
}) {
  const [picked, setPicked] = useState<number[]>(days);

  React.useEffect(() => {
    if (visible) setPicked(days);
  }, [visible, days]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800}>
        Repeat on
      </T>
      <Row gap={8} style={{ marginTop: 20, justifyContent: 'space-between' }}>
        {DAY_LETTERS.map((letter, d) => {
          const on = picked.includes(d);
          return (
            <Tap
              key={d}
              onPress={() =>
                setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))
              }
            >
              {on ? (
                <Grad colors={G.ink} diag style={DAY}>
                  <T size={15} weight={700} color={C.onInk}>
                    {letter}
                  </T>
                </Grad>
              ) : (
                <View style={[DAY, { borderWidth: 1.5, borderColor: C.border }]}>
                  <T size={15} weight={600} color={C.muted}>
                    {letter}
                  </T>
                </View>
              )}
            </Tap>
          );
        })}
      </Row>

      {/* A routine scheduled on no days never comes up and never breaks a
          streak — it just quietly stops existing. Say so rather than allow it. */}
      <T size={13.5} lh={20} color={picked.length ? C.muted : C.danger} style={{ marginTop: 16 }}>
        {picked.length
          ? 'A streak counts back over these days only, so a weekday routine survives the weekend.'
          : 'Pick at least one day.'}
      </T>

      <Row gap={12} style={{ marginTop: 22 }}>
        <Tap onPress={onClose} style={{ flex: 1 }}>
          <Grad colors={G.press} style={BTN}>
            <T d size={17} weight={700} color={C.textMid}>
              Cancel
            </T>
          </Grad>
        </Tap>
        <Tap
          disabled={picked.length === 0}
          onPress={() => {
            onChange(picked.slice().sort((a, b) => a - b));
            onClose();
          }}
          style={{ flex: 1 }}
        >
          <Grad colors={picked.length ? G.ink : G.press} diag style={BTN}>
            <T d size={17} weight={700} color={picked.length ? C.onInk : C.ghost}>
              Done
            </T>
          </Grad>
        </Tap>
      </Row>
    </Sheet>
  );
}

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

const DASHED = () => ({
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
});

const DAY = {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const BTN = {
  height: 56,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
