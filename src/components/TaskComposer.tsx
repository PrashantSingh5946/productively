/**
 * Write a task, rather than pick one.
 *
 * Everything the app could add to a routine came from a fixed list of six in
 * `PICKER_TASKS`, so "add a custom task" was not a thing the app could do —
 * the picker's own strapline promised tasks "that fit you" and then offered
 * everyone the same six. This is the composer behind the routine detail's +,
 * and it doubles as the editor when a row is tapped.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Button, Grad, Row, Sheet, T, Tap } from '../ui';
import { Icon } from '../icons';
import { C, F, G, RADIUS, TASK_TONES } from '../theme';
import { TASK_PALETTE, Task } from '../data';

/** The lengths a routine step actually is. Free entry lives behind ± anyway. */
const PRESETS = [1, 2, 3, 5, 10, 15, 20, 30, 45];

export type TaskDraft = Omit<Task, 'id'>;

export function TaskComposer({
  visible,
  /** Present when editing; absent when writing a new one. */
  task,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  task?: Task;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => void;
}) {
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [pick, setPick] = useState(0);
  const field = useRef<TextInput>(null);

  // Reset on every open, so a cancelled edit cannot bleed into the next task.
  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setMinutes(task?.minutes ?? 5);
    const i = task
      ? TASK_PALETTE.findIndex((p) => p.icon === task.icon && p.tone === task.tone)
      : 0;
    setPick(i < 0 ? 0 : i);

    // Focus after the sheet has actually slid in. `autoFocus` fires while the
    // Modal window is still animating and Android drops it; editing an
    // existing task skips it, because the keyboard would cover the length and
    // icon controls the user came here for.
    if (task) return;
    const id = setTimeout(() => field.current?.focus(), 320);
    return () => clearTimeout(id);
  }, [visible, task]);

  const art = TASK_PALETTE[pick];
  const clean = title.trim();

  const save = () => {
    if (!clean) return;
    onSubmit({ title: clean, minutes, icon: art.icon, tone: art.tone });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800}>
        {task ? 'Edit task' : 'Write your own'}
      </T>

      <Row gap={13} style={{ marginTop: 18 }}>
        <View style={[SWATCH, { backgroundColor: TASK_TONES[art.tone].bg }]}>
          <Icon name={art.icon} size={26} color={TASK_TONES[art.tone].fg} />
        </View>
        <View style={[FIELD(), { flex: 1 }]}>
          <TextInput
            ref={field}
            value={title}
            onChangeText={setTitle}
            placeholder="Water the plants"
            placeholderTextColor={C.ghost}
            returnKeyType="done"
            onSubmitEditing={save}
            style={INPUT()}
          />
        </View>
      </Row>

      <Row style={{ marginTop: 22, justifyContent: 'space-between' }}>
        <T size={15} weight={700}>
          How long
        </T>
        <Row gap={14}>
          <Tap onPress={() => setMinutes((m) => Math.max(1, m - 1))} hitSlop={8}>
            <View style={STEP()}>
              <View style={MINUS()} />
            </View>
          </Tap>
          <T d size={20} weight={800} style={{ width: 58, textAlign: 'center' }}>
            {minutes}m
          </T>
          <Tap onPress={() => setMinutes((m) => Math.min(240, m + 1))} hitSlop={8}>
            <View style={STEP()}>
              <Icon name="plus" size={17} color={C.textMid} />
            </View>
          </Tap>
        </Row>
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        style={{ marginTop: 14 }}
      >
        {PRESETS.map((p) => {
          const on = p === minutes;
          return (
            <Tap key={p} onPress={() => setMinutes(p)}>
              {on ? (
                <Grad colors={G.ink} diag style={CHIP}>
                  <T size={13.5} weight={700} color={C.onInk}>
                    {p}m
                  </T>
                </Grad>
              ) : (
                <View style={[CHIP, { borderWidth: 1.5, borderColor: C.border }]}>
                  <T size={13.5} weight={600} color={C.muted}>
                    {p}m
                  </T>
                </View>
              )}
            </Tap>
          );
        })}
      </ScrollView>

      <T size={15} weight={700} style={{ marginTop: 22 }}>
        Icon
      </T>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 9, paddingVertical: 4 }}
        style={{ marginTop: 12 }}
      >
        {TASK_PALETTE.map((p, i) => {
          const on = i === pick;
          return (
            <Tap key={`${p.icon}-${p.tone}`} onPress={() => setPick(i)}>
              <View
                style={[
                  SWATCH,
                  {
                    backgroundColor: TASK_TONES[p.tone].bg,
                    borderWidth: on ? 2.5 : 0,
                    borderColor: C.ink,
                  },
                ]}
              >
                <Icon name={p.icon} size={24} color={TASK_TONES[p.tone].fg} />
              </View>
            </Tap>
          );
        })}
      </ScrollView>

      <Button
        label={task ? 'Save changes' : 'Add task'}
        height={58}
        disabled={!clean}
        onPress={save}
        style={{ marginTop: 24 }}
      />
    </Sheet>
  );
}

const SWATCH = {
  width: 52,
  height: 52,
  borderRadius: RADIUS.tile,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const FIELD = () => ({
  borderRadius: RADIUS.tile,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  paddingHorizontal: 16,
  height: 52,
  justifyContent: 'center' as const,
});

const INPUT = () => ({
  fontFamily: F.medium,
  fontSize: 16,
  color: C.ink,
  padding: 0,
});

const STEP = () => ({
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: C.chipFrom,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

/** The minus is a rule, not a glyph — the icon set has no dedicated one. */
const MINUS = () => ({
  width: 15,
  height: 2.2,
  borderRadius: 2,
  backgroundColor: C.textMid,
});

const CHIP = { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999 };
