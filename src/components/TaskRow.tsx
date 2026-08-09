/**
 * The sand task row used by the routine detail, the prepared-routine step and
 * template previews. Tapping a row in editable mode reveals reorder / remove.
 */
import React from 'react';
import { View } from 'react-native';
import { Grad, Row, T, Tap } from '../ui';
import { Icon } from '../icons';
import { C, G, TASK_TONES } from '../theme';
import { Task } from '../data';

export function TaskIcon({ task, size = 32 }: { task: Task; size?: number }) {
  const tone = TASK_TONES[task.tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: tone.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={task.icon} size={size * 0.56} color={tone.fg} />
    </View>
  );
}

export function TaskRow({
  task,
  index,
  showIndex = true,
  trailing,
  selected,
  onPress,
  onMove,
  onRemove,
  compact,
}: {
  task: Task;
  index?: number;
  showIndex?: boolean;
  trailing?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  onMove?: (dir: -1 | 1) => void;
  onRemove?: () => void;
  compact?: boolean;
}) {
  const editing = selected && (onMove || onRemove);

  return (
    <Tap onPress={onPress}>
      <Grad
        colors={selected ? G.accentWash : G.card}
        diag={selected}
        style={{
          borderRadius: 18,
          paddingVertical: compact ? 14 : 15,
          paddingHorizontal: compact ? 16 : 17,
          borderWidth: selected ? 1.5 : 0,
          borderColor: selected ? C.accentWashBorder : 'transparent',
        }}
      >
        <Row gap={13}>
          {showIndex && index !== undefined ? (
            <T size={13} weight={500} color={C.ghost}>
              {index + 1}
            </T>
          ) : null}
          <TaskIcon task={task} />
          <T size={compact ? 15 : 15.5} weight={compact ? 600 : 700} lh={20} style={{ flex: 1 }}>
            {task.title}
          </T>

          {editing ? (
            <Row gap={10}>
              <Tap onPress={() => onMove?.(-1)} hitSlop={8}>
                <View style={[STEP, { transform: [{ rotate: '180deg' }] }]}>
                  <Icon name="chevD" size={16} color={C.textMid} />
                </View>
              </Tap>
              <Tap onPress={() => onMove?.(1)} hitSlop={8}>
                <View style={STEP}>
                  <Icon name="chevD" size={16} color={C.textMid} />
                </View>
              </Tap>
              <Tap onPress={onRemove} hitSlop={8}>
                <View style={[STEP, { backgroundColor: '#FBE6E6' }]}>
                  <Icon name="x" size={15} color={C.danger} />
                </View>
              </Tap>
            </Row>
          ) : (
            <>
              <T size={compact ? 13 : 13.5} weight={500} color={C.muted}>
                {task.minutes}m
              </T>
              {trailing}
            </>
          )}
        </Row>
      </Grad>
    </Tap>
  );
}

const STEP = {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/** The hollow ring that marks an unstarted task. */
export function EmptyCheck() {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: C.ring,
      }}
    />
  );
}
