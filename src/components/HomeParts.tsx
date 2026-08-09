/**
 * Pieces of the Home screen: the streak rail, routine cards, the timeline
 * column and the floating timer/add stack.
 */
import React from 'react';
import { View } from 'react-native';
import { Grad, Row, T, Tap } from '../ui';
import { Icon } from '../icons';
import { C, G, TASK_TONES } from '../theme';
import { Routine, Session, daysLabel, fmtClock, tierFor, totalMinutes } from '../data';
import { useNow } from '../useNow';

/* ── streak rail ──────────────────────────────────────────────────── */

export function StreakRail({ streak, onPress }: { streak: number; onPress?: () => void }) {
  const tier = tierFor(streak);
  // Today, tomorrow, the tier's trophy day, then two beyond.
  const slots: ({ kind: 'done' | 'next' | 'far'; day: number } | { kind: 'trophy' })[] = [
    { kind: 'done', day: streak },
    { kind: 'next', day: streak + 1 },
    { kind: 'trophy' },
    { kind: 'far', day: tier.to + 1 },
    { kind: 'far', day: tier.to + 2 },
  ];

  return (
    <Tap onPress={onPress}>
      <Grad colors={G.card} style={RAIL}>
        {slots.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={{ flex: 1, height: 2, backgroundColor: '#E6DFD8' }} /> : null}
            {s.kind === 'trophy' ? (
              <Grad colors={G.well} style={NODE}>
                <Icon name="trophy" size={17} color={C.faint} />
              </Grad>
            ) : s.kind === 'done' ? (
              <Grad colors={G.accent} diag style={NODE}>
                <T size={14} weight={700} color={C.ink}>
                  {s.day}
                </T>
              </Grad>
            ) : s.kind === 'next' ? (
              <Grad colors={G.accentTint} diag style={NODE}>
                <T size={14} weight={700} color={C.accentInk}>
                  {s.day}
                </T>
              </Grad>
            ) : (
              <Grad colors={G.well} style={NODE}>
                <T size={14} weight={700} color={C.faint}>
                  {s.day}
                </T>
              </Grad>
            )}
          </React.Fragment>
        ))}
        <Icon name="chevR" size={17} color={C.ghost} />
      </Grad>
    </Tap>
  );
}

const RAIL = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  marginTop: 16,
  paddingVertical: 13,
  paddingHorizontal: 14,
  borderRadius: 18,
};

const NODE = {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/* ── routine card ─────────────────────────────────────────────────── */

export function RoutineCard({
  routine,
  next,
  countdown,
  session,
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
  showIcons?: boolean;
  showStart?: boolean;
  showDays?: boolean;
  showProgress?: boolean;
  onOpen: () => void;
  onRun: () => void;
}) {
  const metaColor = next ? C.accentInk : C.muted;
  const done = !!session;

  return (
    <Tap onPress={onOpen}>
      <Grad
        colors={next ? G.accentWash : G.card}
        diag={next}
        style={[
          CARD,
          next && { borderWidth: 1.5, borderColor: C.accentWashBorder },
        ]}
      >
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
          ) : showProgress !== false ? (
            <T size={13} weight={700} color={C.good}>
              {Math.round(routine.rate * 100)}%
            </T>
          ) : null}
        </Row>

        <Row gap={14} style={{ marginTop: 12 }}>
          <T d size={20} weight={800} lh={24} style={{ flex: 1 }}>
            {routine.name}
          </T>
          <Tap onPress={onRun}>
            {next ? (
              <Grad colors={G.accent} diag style={PLAY}>
                <Icon name="play" size={20} color={C.ink} />
              </Grad>
            ) : (
              <View style={[PLAY, { backgroundColor: C.border }]}>
                <Icon name="play" size={20} color={C.text} />
              </View>
            )}
          </Tap>
        </Row>

        {showIcons ? (
          <Row gap={7} style={{ marginTop: 14 }}>
            {routine.tasks.slice(0, 4).map((t) => (
              <View key={t.id} style={CHIP}>
                <Icon name={t.icon} size={17} color={TASK_TONES[t.tone].fg} />
              </View>
            ))}
            {routine.tasks.length > 4 ? (
              <View style={CHIP}>
                <T size={11} weight={600} color={C.muted}>
                  +{routine.tasks.length - 4}
                </T>
              </View>
            ) : null}
          </Row>
        ) : null}
      </Grad>
    </Tap>
  );
}

const CARD = { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, marginTop: 12 };
const PLAY = {
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const CHIP = {
  width: 30,
  height: 30,
  borderRadius: 10,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

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
  const scheduled = routines
    .slice()
    .sort((a, b) => a.start - b.start);

  const firstHour = Math.min(...scheduled.map((r) => Math.floor(r.start / 60)), 8);
  const lastHour = Math.max(
    ...scheduled.map((r) => Math.floor((r.start + totalMinutes(r.tasks)) / 60)),
    Math.floor(nowMinutes / 60) + 1
  );
  const hours: number[] = [];
  for (let h = firstHour; h <= lastHour; h++) hours.push(h);

  return (
    <View style={{ marginTop: 20 }}>
      {hours.map((h) => {
        const here = scheduled.filter((r) => Math.floor(r.start / 60) === h);
        const nowHere = Math.floor(nowMinutes / 60) === h;
        return (
          <View key={h}>
            <Row gap={12} style={{ marginTop: 8 }}>
              <T size={12.5} weight={500} color={C.ghost} style={{ width: 44 }}>
                {String(h).padStart(2, '0')}:00
              </T>
              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: C.hairline }} />
            </Row>

            {here.map((r) => {
              const done = sessions.some((s) => s.routineId === r.id);
              return (
                <Row gap={12} center={false} key={r.id} style={{ marginTop: 8 }}>
                  <View style={{ width: 44 }} />
                  <Tap onPress={() => onOpen(r.id)} style={{ flex: 1 }}>
                    <Grad colors={G.well} style={BLOCK_HEAD}>
                      <T size={13.5} weight={700} style={{ flex: 1 }}>
                        {r.name}
                      </T>
                      {done ? (
                        <View style={TICK}>
                          <Icon name="check" size={12} color={C.white} />
                        </View>
                      ) : (
                        <T size={11.5} weight={500} color={C.muted}>
                          {totalMinutes(r.tasks)}m
                        </T>
                      )}
                    </Grad>
                    {showTasks
                      ? r.tasks.slice(0, 3).map((t, i, arr) => (
                          <Grad
                            key={t.id}
                            colors={G.card}
                            style={[
                              BLOCK_ROW,
                              i === arr.length - 1 && {
                                borderBottomLeftRadius: 10,
                                borderBottomRightRadius: 10,
                              },
                            ]}
                          >
                            <T size={13} weight={600} color={C.textSoft}>
                              {t.title}
                            </T>
                          </Grad>
                        ))
                      : null}
                  </Tap>
                </Row>
              );
            })}

            {nowHere ? (
              <Row gap={12} style={{ marginTop: 8 }}>
                <View style={{ width: 44, alignItems: 'flex-end' }}>
                  <Grad colors={G.inkDeep} diag style={NOW_CHIP}>
                    <T size={10.5} weight={700} color={C.white}>
                      {fmtClock(nowMinutes, true)}
                    </T>
                  </Grad>
                </View>
                <View style={{ flex: 1, borderTopWidth: 2, borderTopColor: C.ink }} />
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
  borderRadius: 4,
  paddingVertical: 9,
  paddingHorizontal: 12,
};

const TICK = {
  width: 19,
  height: 19,
  borderRadius: 10,
  backgroundColor: C.good,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const NOW_CHIP = { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 5 };

/* ── floating stack ───────────────────────────────────────────────── */

export function FabStack({
  /** Minutes past midnight of the next routine, or undefined for no dial. */
  targetMinutes,
  onTimer,
  onAdd,
  bottom,
}: {
  targetMinutes?: number;
  onTimer?: () => void;
  onAdd: () => void;
  bottom: number;
}) {
  // Its own one-second clock, so the rest of Home is not re-rendered to tick it.
  const now = useNow(targetMinutes === undefined ? 60_000 : 1000);

  return (
    <View style={{ position: 'absolute', right: 20, bottom, gap: 14, alignItems: 'center' }}>
      {targetMinutes !== undefined ? (
        <Tap onPress={onTimer}>
          <Grad colors={['#4A423B', '#2B2521']} diag style={[FAB, { gap: 1 }]}>
            <Icon name="alarm" size={19} color={C.white} />
            <T size={9} weight={700} color={C.white}>
              {untilClock(targetMinutes, now)}
            </T>
          </Grad>
        </Tap>
      ) : null}
      <Tap onPress={onAdd}>
        <Grad colors={G.accent} diag style={[FAB, ACCENT_SHADOW]}>
          <Icon name="plus" size={26} color={C.ink} />
        </Grad>
      </Tap>
    </View>
  );
}

/** Whole seconds until `targetMinutes`, wrapping past midnight. */
function untilClock(targetMinutes: number, now: Date) {
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const left = (targetMinutes * 60 - nowSec + 86400) % 86400;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const FAB = {
  width: 62,
  height: 62,
  borderRadius: 31,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: C.ink,
  shadowOpacity: 0.26,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

const ACCENT_SHADOW = {
  shadowColor: C.accent,
  shadowOpacity: 0.38,
};
