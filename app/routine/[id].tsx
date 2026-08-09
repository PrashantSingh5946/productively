/** 3.1 Routine detail — the full task list with the run CTA. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Pill, Row, T, Tap, TopBar } from '../../src/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { daysLabel, fmtClock, totalMinutes } from '../../src/data';
import { useStore } from '../../src/store';

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { routine, streakFor, moveTask, removeTask, addTasksToRoutine } = useStore();
  const [sel, setSel] = useState<string | null>(null);

  const r = routine(String(id));
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
        <TopBar onBack={() => router.back()} />
        <T size={16} color={C.muted} style={{ marginTop: 24 }}>
          That routine is no longer here.
        </T>
      </View>
    );
  }

  const total = totalMinutes(r.tasks);
  const end = r.start + total;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.white,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 20,
      }}
    >
      <TopBar onBack={() => router.back()} dots />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <T d size={30} weight={800} lh={35} style={{ marginTop: 18 }}>
          {r.name}
        </T>
        <T size={15} weight={500} color={C.muted} style={{ marginTop: 8 }}>
          {fmtClock(r.start)} – {fmtClock(end)} ({total}m) · {r.tasks.length} tasks
        </T>

        <Row gap={8} style={{ marginTop: 16 }}>
          <Pill label={`${streakFor(r.id)}-day streak`} tone="tint" size={12.5} />
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
              onMove={(d) => moveTask(r.id, t.id, d)}
              onRemove={() => {
                removeTask(r.id, t.id);
                setSel(null);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <Row gap={14}>
        <Tap onPress={() => router.push(`/run/${r.id}`)} style={{ flex: 1 }}>
          <Grad colors={G.accent} diag style={CTA}>
            <Icon name="play" size={18} color={C.ink} />
            <T d size={17} weight={700}>
              Done at {fmtClock(end)}
            </T>
          </Grad>
        </Tap>
        <Tap
          onPress={() =>
            router.push({ pathname: '/task-picker', params: { routineId: r.id } })
          }
        >
          <Grad colors={G.ink} diag style={FAB}>
            <Icon name="plus" size={24} color={C.white} />
          </Grad>
        </Tap>
      </Row>
    </View>
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
