/**
 * Pieces of the Home screen: routine cards, the timeline column and the
 * floating add button.
 */
import React from 'react';
import { View } from 'react-native';
import { Card, Grad, Row, T, Tap, rowSkin } from '../ui';
import { Icon, IconName } from '../icons';
import { C, G, RADIUS, SHADOW, TASK_TONES } from '../theme';
import { useT } from '../theming';
import { Routine, Session, daysLabel, fmtClock, totalMinutes } from '../data';
import { useNow } from '../useNow';


/* ── routine card ─────────────────────────────────────────────────── */

export function RoutineCard({
  routine,
  next,
  countdown,
  session,
  rate,
  showIcons,
  showStart,
  showDays,
  showProgress,
  onOpen,
  onRun,
}: {
  routine: Routine;
  /** Highlighted as the next thing due. */
  next?: boolean;
  countdown?: string;
  session?: Session;
  /** Recent completion, 0–1. Null until the routine has been scheduled and run. */
  rate?: number | null;
  showIcons?: boolean;
  showStart?: boolean;
  showDays?: boolean;
  showProgress?: boolean;
  onOpen: () => void;
  onRun: () => void;
}) {
  const t = useT();
  const metaColor = next ? t.accentText : t.muted;
  const done = !!session;

  return (
    <Card tinted={next} onPress={onOpen} style={CARD}>
        <Row gap={14}>
          {showStart !== false ? (
            <Row gap={6}>
              <Icon name="alarm" size={14} color={metaColor} />
              <T size={12.5} weight={500} color={metaColor}>
                {fmtClock(routine.start)}
              </T>
            </Row>
          ) : null}
          {showDays !== false ? (
            <Row gap={6}>
              <Icon name="cal" size={14} color={metaColor} />
              <T size={12.5} weight={500} color={metaColor}>
                {daysLabel(routine.days)}
              </T>
            </Row>
          ) : null}
          <View style={{ flex: 1 }} />
          {done ? (
            <T size={13} weight={700} color={C.good}>
              Done today
            </T>
          ) : next && countdown ? (
            <T size={13} weight={700}>
              {countdown}
            </T>
          ) : showProgress !== false && rate !== null && rate !== undefined ? (
            <T size={13} weight={700} color={C.good}>
              {Math.round(rate * 100)}%
            </T>
          ) : null}
        </Row>

        <Row gap={14} style={{ marginTop: 12 }}>
          <T d size={20} weight={800} lh={24} style={{ flex: 1 }}>
            {routine.name}
          </T>
          <Tap onPress={onRun}>
            {next ? (
              <Grad colors={G.accent} diag style={[PLAY, { boxShadow: SHADOW.icon }]}>
                <Icon name="play" size={20} color={t.accentOn} />
              </Grad>
            ) : (
              <View style={[PLAY, rowSkin()]}>
                <Icon name="play" size={20} color={t.ink} />
              </View>
            )}
          </Tap>
        </Row>

        {showIcons ? (
          <Row gap={7} style={{ marginTop: 14 }}>
            {routine.tasks.slice(0, 4).map((task) => (
              <View key={task.id} style={[CHIP(), { backgroundColor: TASK_TONES[task.tone].bg }]}>
                <Icon name={task.icon} size={17} color={TASK_TONES[task.tone].fg} />
              </View>
            ))}
            {routine.tasks.length > 4 ? (
              <View style={[CHIP(), { backgroundColor: t.stone }]}>
                <T size={11} weight={600} color={t.muted}>
                  +{routine.tasks.length - 4}
                </T>
              </View>
            ) : null}
          </Row>
        ) : null}
    </Card>
  );
}

const CARD = { paddingVertical: 18, paddingHorizontal: 20, marginTop: 12 };
const PLAY = {
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const CHIP = () => ({
  width: 30,
  height: 30,
  borderRadius: RADIUS.coin,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

/* ── timeline ─────────────────────────────────────────────────────── */

export function Timeline({
  routines,
  sessions,
  nowMinutes,
  showTasks,
  onOpen,
}: {
  routines: Routine[];
  sessions: Session[];
  nowMinutes: number;
  showTasks: boolean;
  onOpen: (id: string) => void;
}) {
  const t = useT();
  const scheduled = routines
    .slice()
    .sort((a, b) => a.start - b.start);

  const firstHour = Math.min(...scheduled.map((r) => Math.floor(r.start / 60)), 8);
  // Clamped to 23: a routine that starts at 23:00 and runs 90 minutes used to
  // push this to 24 and draw a literal "24:00" row, and a past-midnight one
  // reached "25:00".
  const lastHour = Math.min(
    23,
    Math.max(
      ...scheduled.map((r) => Math.floor((r.start + totalMinutes(r.tasks)) / 60)),
      Math.floor(nowMinutes / 60) + 1
    )
  );
  const hours: number[] = [];
  for (let h = firstHour; h <= lastHour; h++) hours.push(h);

  // With nothing scheduled the ladder was drawn anyway, so a rest day rendered
  // as a stack of empty hour rules whose height depended on the time of day.
  if (scheduled.length === 0) {
    return (
      <View style={{ marginTop: 28 }}>
        <T d size={19} weight={700} color={t.textMid}>
          Nothing on the clock today.
        </T>
        <T size={14.5} lh={22} color={t.muted} style={{ marginTop: 8 }}>
          The timeline shows routines scheduled for today. Nothing is due, so
          there is nothing to lay out.
        </T>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 20 }}>
      {hours.map((h) => {
        const here = scheduled.filter((r) => Math.floor(r.start / 60) === h);
        const nowHere = Math.floor(nowMinutes / 60) === h;
        return (
          <View key={h}>
            <Row gap={12} style={{ marginTop: 8 }}>
              <T size={12.5} weight={500} color={t.muted} style={{ width: 44 }}>
                {String(h).padStart(2, '0')}:00
              </T>
              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: t.hairline }} />
            </Row>

            {here.map((r) => {
              const done = sessions.some((s) => s.routineId === r.id);
              return (
                <Row gap={12} center={false} key={r.id} style={{ marginTop: 8 }}>
                  <View style={{ width: 44 }} />
                  <Tap onPress={() => onOpen(r.id)} style={{ flex: 1 }}>
                    <Grad
                      colors={G.accentTint}
                      diag
                      style={[BLOCK_HEAD, { borderColor: t.accentTintBorder, borderWidth: 1 }]}
                    >
                      <T size={13.5} weight={700} color={t.accentText} style={{ flex: 1 }}>
                        {r.name}
                      </T>
                      {done ? (
                        <View style={TICK()}>
                          <Icon name="check" size={12} color={C.onInk} />
                        </View>
                      ) : (
                        <T size={11.5} weight={500} color={t.accentText}>
                          {totalMinutes(r.tasks)}m
                        </T>
                      )}
                    </Grad>
                    {/*
                      The block lists three tasks and used to stop there in
                      silence — a five-task routine drew three rows and nothing
                      said so, while the list card next to it counted all five.
                      The rest are named in a trailing row rather than dropped.
                    */}
                    {showTasks
                      ? (() => {
                          const shown = r.tasks.slice(0, 3);
                          const hidden = r.tasks.length - shown.length;
                          return (
                            <>
                              {shown.map((task, i) => (
                                <View
                                  key={task.id}
                                  style={[
                                    BLOCK_ROW,
                                    rowSkin(),
                                    i === shown.length - 1 &&
                                      hidden === 0 && {
                                        borderBottomLeftRadius: 10,
                                        borderBottomRightRadius: 10,
                                      },
                                  ]}
                                >
                                  <T size={13} weight={600} color={t.textMid}>
                                    {task.title}
                                  </T>
                                </View>
                              ))}
                              {hidden > 0 ? (
                                <View
                                  style={[
                                    BLOCK_ROW,
                                    rowSkin(),
                                    {
                                      borderBottomLeftRadius: 10,
                                      borderBottomRightRadius: 10,
                                    },
                                  ]}
                                >
                                  <T size={13} weight={600} color={t.muted}>
                                    {`+${hidden} more task${hidden === 1 ? '' : 's'}`}
                                  </T>
                                </View>
                              ) : null}
                            </>
                          );
                        })()
                      : null}
                  </Tap>
                </Row>
              );
            })}

            {nowHere ? (
              <Row gap={12} style={{ marginTop: 8 }}>
                <View style={{ width: 44, alignItems: 'flex-end' }}>
                  <Grad colors={G.inkDeep} diag style={NOW_CHIP}>
                    <T size={10.5} weight={700} color={C.onInk}>
                      {fmtClock(nowMinutes, true)}
                    </T>
                  </Grad>
                </View>
                <View style={{ flex: 1, borderTopWidth: 2, borderTopColor: t.ink }} />
              </Row>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const BLOCK_HEAD = {
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  borderBottomLeftRadius: 4,
  borderBottomRightRadius: 4,
  paddingVertical: 8,
  paddingHorizontal: 12,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const BLOCK_ROW = {
  marginTop: 3,
  borderRadius: 6,
  paddingVertical: 9,
  paddingHorizontal: 12,
};

const TICK = () => ({
  width: 19,
  height: 19,
  borderRadius: 10,
  backgroundColor: C.good,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

const NOW_CHIP = { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 5 };

/* ── floating action button ───────────────────────────────────────── */

/**
 * One accent coin, bottom right.
 *
 * v2 stacked a live countdown dial above it, ticking every second on the one
 * screen the user leaves open. v3 cuts it: the same countdown already sits on
 * the upcoming routine's card as "in 18m", where it is next to the thing it
 * counts down to, and it does not cost a re-render per second to say so.
 */
export function Fab({
  icon = 'plus',
  onPress,
  bottom,
}: {
  icon?: IconName;
  onPress: () => void;
  bottom: number;
}) {
  useT();
  return (
    <View style={{ position: 'absolute', right: 20, bottom, alignItems: 'center' }}>
      <Tap onPress={onPress}>
        <Grad colors={G.accent} diag style={FAB()}>
          <Icon name={icon} size={26} color={C.accentOn} />
        </Grad>
      </Tap>
    </View>
  );
}

const FAB = () => ({
  width: 62,
  height: 62,
  borderRadius: 31,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  // Accent glow shadows stay warm-neutral: they read correctly under any
  // preset, so the FAB's drop never needs recolouring.
  boxShadow: SHADOW.fab,
});
