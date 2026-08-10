/**
 * Flow 03 — running a routine.
 * 3.2 settle · 3.3 timer · 3.4 overrun · 3.5 complete.
 * One screen holds all three phases so the run never loses its state.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Button, Dial, Grad, IconButton, Row, Spacer, T, Tap, rowSkin } from '../../src/ui';
import { Icon, MoodFace } from '../../src/icons';
import { C, G, SHADOW, TASK_TONES } from '../../src/theme';
import { Routine, Task, mmss, totalMinutes } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
type Result = { taskId: string; spent: number; skipped: boolean };

const QUICK: Routine = {
  id: 'quick',
  name: 'Quick timer',
  start: 0,
  days: [],
  streak: 0,
  rate: 0,
  tasks: [{ id: 'q1', title: 'One task, right now', icon: 'alarm', tone: 'target', minutes: 5 }],
};

export default function Run() {
  useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { routine, state, finishRun, addNote, streakFor } = useStore();

  const r = String(id) === 'quick' ? QUICK : routine(String(id));
  const cfg = state.settings.timer;

  const [phase, setPhase] = useState<'settle' | 'run' | 'done'>('settle');
  const [idx, setIdx] = useState(0);
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const started = useRef(false);

  const task: Task | undefined = r?.tasks[idx];
  const plannedSec = task ? (task.minutes + (extra[task.id] ?? 0)) * 60 : 0;

  // Seed the countdown whenever the active task changes.
  useEffect(() => {
    if (phase !== 'run' || !task) return;
    setRemaining((task.minutes + (extra[task.id] ?? 0)) * 60);
    // Only re-seed on task change, not on every minute nudge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, task?.id]);

  useEffect(() => {
    if (phase !== 'run' || paused) return;
    const t = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, paused]);

  // A single buzz the moment a task runs over, then it stays quiet.
  const overNotified = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== 'run' || !task || remaining > 0) return;
    if (overNotified.current === task.id) return;
    overNotified.current = task.id;
    if (state.settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [remaining, phase, task, state.settings.haptics]);

  const advance = useCallback(
    (skipped: boolean) => {
      if (!r || !task) return;
      const spent = skipped ? 0 : plannedSec - remaining;
      setResults((rs) => [...rs, { taskId: task.id, spent: Math.max(0, spent), skipped }]);
      const next = r.tasks[idx + 1];
      if (next) {
        // Seed the next countdown here as well as in the effect, so a task that
        // ran over never flashes its overrun state onto the following one.
        setRemaining((next.minutes + (extra[next.id] ?? 0)) * 60);
        setIdx((i) => i + 1);
      } else {
        setPhase('done');
      }
    },
    [r, task, plannedSec, remaining, idx, extra]
  );

  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top + 40, paddingHorizontal: 24 }}>
        <T size={16} color={C.muted}>That routine is no longer here.</T>
        <Button label="Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (phase === 'settle') {
    return (
      <Settle
        firstTask={r.tasks[0]}
        onStart={() => {
          started.current = true;
          setPhase('run');
        }}
      />
    );
  }

  if (phase === 'done') {
    return (
      <Complete
        routine={r}
        results={results}
        streak={streakFor(r.id) + 1}
        moodEnabled={cfg.moodReview}
        onDone={(mood, note) => {
          const spentSec = results.reduce((s, x) => s + x.spent, 0);
          finishRun({
            routineId: r.id,
            durationMin: Math.max(1, Math.round(spentSec / 60)),
            done: results.filter((x) => !x.skipped).length,
            total: r.tasks.length,
            mood,
            note,
          });
          if (note) addNote(r.id, note);
          router.replace('/(tabs)/home');
        }}
      />
    );
  }

  return (
    <Running
      routine={r}
      task={task!}
      idx={idx}
      remaining={remaining}
      plannedSec={plannedSec}
      paused={paused}
      cfg={cfg}
      onPause={() => setPaused((p) => !p)}
      onDone={() => advance(false)}
      onSkip={() => advance(true)}
      onBack={() => router.back()}
      onNudge={(delta) => {
        setExtra((e) => ({ ...e, [task!.id]: (e[task!.id] ?? 0) + delta }));
        setRemaining((s) => s + delta * 60);
      }}
    />
  );
}

/* ── 3.2 settle ───────────────────────────────────────────────────── */

const BREATH: { label: string; secs: number }[] = [
  { label: 'Inhale', secs: 4 },
  { label: 'Hold', secs: 4 },
  { label: 'Exhale', secs: 4 },
];

function Settle({ firstTask, onStart }: { firstTask?: Task; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => s + 1), BREATH[step % 3].secs * 1000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step >= 9) onStart();
  }, [step, onStart]);

  const b = BREATH[step % 3];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.paper,
        alignItems: 'center',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 34,
        paddingHorizontal: 24,
      }}
    >
      <T d size={22} weight={800} style={{ marginTop: 34 }}>
        Settle in
      </T>
      <T size={14} weight={500} color={C.muted} style={{ marginTop: 8 }}>
        Round {Math.floor(step / 3) + 1} of 3
      </T>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Grad
          colors={[C.accentTintBorder, C.accentTintTo, C.accentWash]}
          style={{
            width: 250,
            height: 250,
            borderRadius: 125,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <T d size={30} weight={700}>
            {b.label}
          </T>
          <T size={14} weight={500} color={C.textSoft}>
            {b.secs} seconds
          </T>
        </Grad>
      </View>

      <T size={15} lh={24} center color={C.textSoft} style={{ maxWidth: 280 }}>
        Three slow breaths, then we start with {article(firstTask?.title)}.
      </T>

      <Tap onPress={onStart}>
        <T
          size={15}
          weight={600}
          color={C.textMid}
          style={{ marginTop: 26, textDecorationLine: 'underline' }}
        >
          Skip
        </T>
      </Tap>
    </View>
  );
}

const article = (title?: string) => (title ? title.toLowerCase() : 'the first task');

/* ── 3.3 / 3.4 timer ──────────────────────────────────────────────── */

function Running({
  routine,
  task,
  idx,
  remaining,
  plannedSec,
  paused,
  cfg,
  onPause,
  onDone,
  onSkip,
  onBack,
  onNudge,
}: {
  routine: Routine;
  task: Task;
  idx: number;
  remaining: number;
  plannedSec: number;
  paused: boolean;
  cfg: { remainingTime: boolean; taskDuration: boolean; nextTask: boolean; keepScreenOn: boolean };
  onPause: () => void;
  onDone: () => void;
  onSkip: () => void;
  onBack: () => void;
  onNudge: (delta: number) => void;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!cfg.keepScreenOn) return;
    activateKeepAwakeAsync('routine-run').catch(() => {});
    return () => {
      deactivateKeepAwake('routine-run').catch(() => {});
    };
  }, [cfg.keepScreenOn]);

  const over = remaining <= 0;
  const progress = plannedSec > 0 ? 1 - remaining / plannedSec : 0;
  const tone = TASK_TONES[task.tone];
  const next = routine.tasks[idx + 1];
  const overMin = Math.max(1, Math.round(Math.abs(remaining) / 60));

  const Body = (
    <>
      <Row style={{ justifyContent: 'space-between', paddingTop: 12 }}>
        <IconButton icon="chevL" onPress={onBack} size={40} glyph={20} />
        <T size={13} weight={600} color={C.muted}>
          Task {idx + 1} of {routine.tasks.length}
        </T>
        <Row gap={4}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 4.5,
                height: 4.5,
                borderRadius: 3,
                backgroundColor: over ? C.stoneDeep : C.faint,
              }}
            />
          ))}
        </Row>
      </Row>

      <Row gap={5} style={{ marginTop: 14 }}>
        {routine.tasks.map((t, i) =>
          i <= idx ? (
            <Grad key={t.id} colors={G.accent} diag style={SEG} />
          ) : (
            <Grad key={t.id} colors={over ? [C.stone, C.stone] : G.well} style={SEG} />
          )
        )}
      </Row>

      <T d size={24} weight={800} lh={29} center style={{ marginTop: 40 }}>
        {task.title}
      </T>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Dial
          size={280}
          thickness={15}
          progress={progress}
          over={over}
          inner={over ? C.accentWash : C.card}
        >
          <View style={[BIG_ICON, { backgroundColor: tone.bg }]}>
            <Icon name={task.icon} size={36} color={tone.fg} />
          </View>

          {cfg.remainingTime ? (
            <T d size={48} weight={800} ls={-1} color={over ? C.over : C.ink}>
              {over ? `+${mmss(remaining)}` : mmss(remaining)}
            </T>
          ) : (
            <T d size={40} weight={800} color={over ? C.over : C.ink}>
              {over ? 'Over' : 'Running'}
            </T>
          )}

          {over ? (
            <T size={12.5} weight={600} color={C.textSoft}>
              over by {overMin} minute{overMin === 1 ? '' : 's'}
            </T>
          ) : (
            <Grad colors={G.card} style={[NUDGE, rowSkin()]}>
              <Tap onPress={() => onNudge(-1)} hitSlop={10}>
                <T size={12.5} weight={600} color={C.textSoft}>
                  –
                </T>
              </Tap>
              <T size={12.5} weight={600} color={C.textSoft}>
                {Math.round(plannedSec / 60)}m
              </T>
              <Tap onPress={() => onNudge(1)} hitSlop={10}>
                <T size={12.5} weight={600} color={C.textSoft}>
                  +
                </T>
              </Tap>
            </Grad>
          )}
        </Dial>
      </View>

      <Row gap={42} style={{ justifyContent: 'center', marginBottom: 18 }}>
        <Tap onPress={onPause} hitSlop={14}>
          <Icon name={paused ? 'play' : 'pause'} size={26} color={C.faint} />
        </Tap>
        <Tap onPress={onDone}>
          <Grad colors={G.ink} diag style={MAIN_BTN()}>
            <Icon name="check" size={32} color={C.onInk} />
          </Grad>
        </Tap>
        <Tap onPress={onSkip} hitSlop={14}>
          <Icon name="skip" size={26} color={C.faint} />
        </Tap>
      </Row>

      {cfg.nextTask && next ? (
        <Grad colors={over ? G.tintSoft : G.card} diag={over} style={NEXT}>
          <T size={12} weight={600} color={C.ghost}>
            NEXT
          </T>
          <View
            style={[
              NEXT_ICON,
              { backgroundColor: TASK_TONES[next.tone].bg },
            ]}
          >
            <Icon name={next.icon} size={16} color={TASK_TONES[next.tone].fg} />
          </View>
          <T size={14.5} weight={600} color={C.textMid} style={{ flex: 1 }}>
            {next.title}
          </T>
          <T size={13} weight={500} color={C.muted}>
            {next.minutes}m
          </T>
        </Grad>
      ) : null}
    </>
  );

  const pad = {
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 30,
    paddingHorizontal: 24,
  };

  return over ? (
    <Grad colors={G.dawn} style={pad}>
      {Body}
    </Grad>
  ) : (
    <View style={[pad, { backgroundColor: C.paper }]}>{Body}</View>
  );
}

const SEG = { flex: 1, height: 4, borderRadius: 2 };
const BIG_ICON = {
  width: 64,
  height: 64,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const NUDGE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 999,
};
const MAIN_BTN = () => ({
  width: 74,
  height: 74,
  borderRadius: 37,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  boxShadow: SHADOW.fab,
});
const NEXT = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 18,
};
const NEXT_ICON = {
  width: 28,
  height: 28,
  borderRadius: 9,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/* ── 3.5 complete ─────────────────────────────────────────────────── */

function Complete({
  routine,
  results,
  streak,
  moodEnabled,
  onDone,
}: {
  routine: Routine;
  results: Result[];
  streak: number;
  moodEnabled: boolean;
  onDone: (mood: number | undefined, note: string | undefined) => void;
}) {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [writing, setWriting] = useState(false);

  const spentMin = Math.max(1, Math.round(results.reduce((s, x) => s + x.spent, 0) / 60));
  const planned = totalMinutes(routine.tasks);
  const delta = spentMin - planned;
  const done = results.filter((x) => !x.skipped).length;
  const skipped = results.length - done;

  return (
    <Grad
      colors={G.sunrise}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 26,
        paddingHorizontal: 22,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <T d size={30} weight={800} lh={37} center style={{ marginTop: 40 }}>
          Routine complete
        </T>
        <T size={15} weight={500} center color={C.accentInk} style={{ marginTop: 10 }}>
          {streak}-day streak · your longest yet
        </T>

        <Row gap={12} center={false} style={{ marginTop: 26 }}>
          <Stat
            big={`${spentMin}m`}
            sub={`Time spent\n${delta === 0 ? 'exactly on plan' : delta > 0 ? `${delta}m over plan` : `${-delta}m under plan`}`}
          />
          <Stat
            big={`${done}/${routine.tasks.length}`}
            sub={`Tasks done\n${skipped} skipped`}
          />
          <Stat
            big={`${Math.round(routine.rate * 100)}%`}
            sub={'This week\non average'}
            color={C.good}
          />
        </Row>

        {moodEnabled ? (
          <View style={PANEL()}>
            <T size={16} weight={700}>
              How did that feel?
            </T>
            <Row style={{ justifyContent: 'space-between', marginTop: 18 }}>
              {([0, 1, 2, 3, 4] as const).map((lvl) => {
                const on = mood === lvl;
                return (
                  <Tap key={lvl} onPress={() => setMood(lvl)}>
                    {on ? (
                      <Grad colors={G.accent} diag style={FACE}>
                        <MoodFace level={lvl} size={28} color={C.accentOn} />
                      </Grad>
                    ) : (
                      <View style={[FACE, { backgroundColor: faceBg()[lvl] }]}>
                        <MoodFace level={lvl} size={26} color={faceFg()[lvl]} />
                      </View>
                    )}
                  </Tap>
                );
              })}
            </Row>
          </View>
        ) : null}

        <View style={PANEL()}>
          <Tap onPress={() => setWriting((w) => !w)}>
            <Row gap={10}>
              <Icon name="note" size={18} color={C.muted} />
              <T size={15} weight={700} style={{ flex: 1 }}>
                {note ? 'Your note' : 'Add a note'}
              </T>
              <Icon name="chevR" size={17} color={C.ghost} />
            </Row>
          </Tap>

          {writing ? (
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              autoFocus
              placeholder="What worked, what ran long…"
              placeholderTextColor={C.ghost}
              style={INPUT()}
            />
          ) : (
            <T size={13.5} lh={20} color={note ? C.textMid : C.ghost} style={{ marginTop: 10 }}>
              {note || suggestion(results, routine)}
            </T>
          )}
        </View>
      </ScrollView>

      <Spacer />
      <Button
        label="Done"
        onPress={() => onDone(mood ?? undefined, note.trim() || undefined)}
        style={{ marginTop: 14 }}
      />
    </Grad>
  );
}

function Stat({ big, sub, color }: { big: string; sub: string; color?: string }) {
  return (
    <View style={STAT()}>
      <T d size={24} weight={800} color={color}>
        {big}
      </T>
      <T size={12.5} weight={500} lh={17} color={C.muted} style={{ marginTop: 6 }}>
        {sub}
      </T>
    </View>
  );
}

/** Reads the run and offers the one adjustment worth making tomorrow. */
function suggestion(results: Result[], routine: Routine) {
  const worst = results
    .map((r) => {
      const t = routine.tasks.find((x) => x.id === r.taskId);
      return { r, t, over: t ? r.spent - t.minutes * 60 : 0 };
    })
    .sort((a, b) => b.over - a.over)[0];

  if (worst?.t && worst.over > 60) {
    const cap = Math.round(worst.r.spent / 60);
    return `${worst.t.title} ran long again — try a ${cap}-minute cap tomorrow.`;
  }
  return 'Nothing overran. Worth writing down what made today easy.';
}

const faceBg = () => [C.accentWash, C.accentTintFrom, C.accentTintTo, C.accentTintTo, C.accentTintTo];
const faceFg = () => [C.faint, C.accentIcon, C.accentText, C.accentText, C.accentText];

const STAT = () => ({
  flex: 1,
  padding: 18,
  borderRadius: 20,
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.hairline,
  boxShadow: SHADOW.card,
});

const PANEL = () => ({
  marginTop: 16,
  padding: 20,
  borderRadius: 22,
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.hairline,
  boxShadow: SHADOW.card,
});

const FACE = {
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const INPUT = () => ({
  marginTop: 12,
  minHeight: 72,
  fontFamily: 'Instrument_400Regular',
  fontSize: 14.5,
  lineHeight: 22,
  color: C.textMid,
  textAlignVertical: 'top' as const,
});
