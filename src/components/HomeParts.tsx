/**
 * Pieces of the Home screen: the streak rail, routine cards, the timeline
 * column and the floating timer/add stack.
 */
import React from 'react';
import { View } from 'react-native';
import { Card, Grad, Row, T, Tap, rowSkin } from '../ui';
import { Icon } from '../icons';
import { C, G, RADIUS, SHADOW, TASK_TONES } from '../theme';
import { useT } from '../theming';
import { Routine, Session, daysLabel, fmtClock, tierFor, totalMinutes } from '../data';
import { useNow } from '../useNow';

/* ── streak rail ──────────────────────────────────────────────────── */

export function StreakRail({ streak, onPress }: { streak: number; onPress?: () => void }) {
  const t = useT();
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
      <View style={[RAIL, rowSkin()]}>
        {slots.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={{ flex: 1, height: 2, backgroundColor: C.stoneLine }} /> : null}
            {s.kind === 'trophy' ? (
              <View style={[NODE, { backgroundColor: t.stone }]}>
                <Icon name="trophy" size={17} color={t.muted} />
              </View>
            ) : s.kind === 'done' ? (
              <Grad colors={G.accent} diag style={NODE}>
                <T size={14} weight={700} color={t.accentOn}>
                  {s.day}
                </T>
              </Grad>
            ) : s.kind === 'next' ? (
              <Grad
                colors={G.accentTint}
                diag
                style={[NODE, { borderWidth: 1.5, borderColor: t.accentTintBorder }]}
              >
                <T size={14} weight={700} color={t.accentText}>
                  {s.day}
                </T>
              </Grad>
            ) : (
              <View style={[NODE, { backgroundColor: t.stone }]}>
                <T size={14} weight={700} color={t.faint}>
                  {s.day}
                </T>
              </View>
            )}
          </React.Fragment>
        ))}
        <Icon name="chevR" size={17} color={t.faint} />
      </View>
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
  borderRadius: RADIUS.row,
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
                    {showTasks
                      ? r.tasks.slice(0, 3).map((task, i, arr) => (
                          <View
                            key={task.id}
                            style={[
                              BLOCK_ROW,
                              rowSkin(),
                              i === arr.length - 1 && {
                                borderBottomLeftRadius: 10,
                                borderBottomRightRadius: 10,
                              },
                            ]}
                          >
                            <T size={13} weight={600} color={t.textMid}>
                              {task.title}
                            </T>
                          </View>
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
          <Grad colors={G.inkDeep} diag style={[FAB(), { gap: 1 }]}>
            <Icon name="alarm" size={19} color={C.onInk} />
            <T size={9} weight={700} color={C.onInk}>
              {untilClock(targetMinutes, now)}
            </T>
          </Grad>
        </Tap>
      ) : null}
      <Tap onPress={onAdd}>
        <Grad colors={G.accent} diag style={FAB()}>
          <Icon name="plus" size={26} color={C.accentOn} />
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
