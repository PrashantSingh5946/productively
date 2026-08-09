/** 5.3 Task picker — a sheet-style page over a dimmed backdrop. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Row, T, Tap } from '../src/ui';
import { Icon } from '../src/icons';
import { C, G, TASK_TONES } from '../src/theme';
import { PICKER_TASKS } from '../src/data';
import { useStore } from '../src/store';

export default function TaskPicker() {
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const insets = useSafeAreaInsets();
  const { state, addTasksToRoutine } = useStore();
  const [picked, setPicked] = useState<string[]>([]);

  const target = routineId ?? state.routines[0]?.id;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const add = () => {
    const tasks = PICKER_TASKS.filter((t) => picked.includes(t.id));
    if (target && tasks.length) addTasksToRoutine(target, tasks);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(20,20,24,0.4)' }}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      <View style={[SHEET, { paddingBottom: insets.bottom + 24 }]}>
        <View style={GRABBER} />

        <T d size={26} weight={800} lh={32} center>
          Find tasks that fit you
        </T>
        <T size={14.5} lh={22} center color={C.muted} style={{ marginTop: 10 }}>
          Pick a few — we'll slot them into the right routine.
        </T>

        <View style={{ marginTop: 22, gap: 11 }}>
          {rows(PICKER_TASKS).map((pair, i) => (
            <Row gap={11} key={i}>
              {pair.map((t) => {
                const on = picked.includes(t.id);
                return (
                  <Tap key={t.id} onPress={() => toggle(t.id)} style={{ flex: 1 }}>
                    <Grad
                      colors={on ? G.accentWash : G.card}
                      diag={on}
                      style={[
                        TILE,
                        on && { borderWidth: 1.5, borderColor: C.accentWashBorder },
                      ]}
                    >
                      <View style={TILE_ICON}>
                        <Icon name={t.icon} size={20} color={TASK_TONES[t.tone].fg} />
                      </View>
                      <T size={13.5} weight={600} lh={17} style={{ flex: 1 }}>
                        {t.title}
                      </T>
                      <Icon name={on ? 'check' : 'plus'} size={15} color={on ? C.ink : C.ghost} />
                    </Grad>
                  </Tap>
                );
              })}
              {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </Row>
          ))}
        </View>

        <Button
          label={picked.length ? `Add ${picked.length} task${picked.length === 1 ? '' : 's'}` : 'Add tasks'}
          height={58}
          disabled={picked.length === 0}
          onPress={add}
          style={{ marginTop: 22 }}
        />
      </View>
    </View>
  );
}

const rows = <T,>(xs: T[]): T[][] =>
  xs.reduce<T[][]>((acc, x, i) => {
    if (i % 2 === 0) acc.push([x]);
    else acc[acc.length - 1].push(x);
    return acc;
  }, []);

const SHEET = {
  backgroundColor: C.white,
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
  paddingHorizontal: 20,
  paddingTop: 14,
};

const GRABBER = {
  width: 56,
  height: 5,
  borderRadius: 3,
  backgroundColor: C.borderStrong,
  alignSelf: 'center' as const,
  marginBottom: 20,
};

const TILE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 11,
  paddingVertical: 13,
  paddingHorizontal: 14,
  borderRadius: 16,
};

const TILE_ICON = {
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
