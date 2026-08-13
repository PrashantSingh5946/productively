/**
 * Flow 04 — Analysis & streaks.
 * 4.1 Summary · 4.2 Per-routine · 4.3 Momentum rings dialog · 4.4 Notes.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dialog,
  Grad,
  MeterRow,
  Overline,
  Row,
  Segmented,
  Sheet,
  T,
  Tap,
  cardSkin,
  rowSkin,
} from '../../src/ui';
import { Icon, MoodFace } from '../../src/icons';
import { C, DOCK_CLEARANCE, G, RADIUS, TASK_TONES } from '../../src/theme';
import { DAY_LETTERS, MOMENTUM_TIERS, stepColor, tierFor } from '../../src/data';
import {
  avgLabel,
  bestStreak,
  insightFor,
  thirtyDay,
  timeSpent,
  weekGrid,
  weekStartDate,
  weekSummary,
} from '../../src/analytics';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function Analysis() {
  useT();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [tab, setTab] = useState<'analysis' | 'note'>('analysis');
  const [scope, setScope] = useState<string>('summary');
  const [rings, setRings] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const leader = bestStreak(state.routines, state.sessions);
  const streak = leader?.streak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Overline style={{ paddingTop: 14, paddingLeft: 2 }}>Last 30 days</Overline>

        {/* The same pill switch Home uses for Routine / Checklist. These were
            two 21px display words with a white capsule behind the live one —
            a different control for the identical job, on the adjacent tab. */}
        <Row style={{ paddingTop: 10 }}>
          <Segmented
            options={[
              { key: 'analysis', label: 'Analysis' },
              { key: 'note', label: 'Note' },
            ]}
            value={tab}
            onChange={(k) => setTab(k as 'analysis' | 'note')}
          />
        </Row>

        <ScopeBar
          scope={scope}
          onScope={setScope}
          onMore={() => setPickerOpen(true)}
          tab={tab}
        />

        {tab === 'analysis' ? (
          scope === 'summary' ? (
            <Summary streak={streak} onRings={() => setRings(true)} />
          ) : (
            <PerRoutine routineId={scope} />
          )
        ) : state.routines.length ? (
          <Notes routineId={scope === 'summary' ? state.routines[0].id : scope} />
        ) : null}
      </ScrollView>

      <RingsDialog visible={rings} onClose={() => setRings(false)} streak={streak} />

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <T d size={22} weight={800}>
          Show analysis for
        </T>
        <View style={{ gap: 11, marginTop: 20 }}>
          <Tap
            onPress={() => {
              setScope('summary');
              setPickerOpen(false);
            }}
          >
            <Grad colors={G.card} style={[PICK, rowSkin()]}>
              <T size={16} weight={700} style={{ flex: 1 }}>
                Summary
              </T>
              {scope === 'summary' ? <Icon name="check" size={20} color={C.ink} /> : null}
            </Grad>
          </Tap>
          {state.routines.map((r) => (
            <Tap
              key={r.id}
              onPress={() => {
                setScope(r.id);
                setPickerOpen(false);
              }}
            >
              <Grad colors={G.card} style={[PICK, rowSkin()]}>
                <T size={16} weight={700} style={{ flex: 1 }}>
                  {r.name}
                </T>
                {scope === r.id ? <Icon name="check" size={20} color={C.ink} /> : null}
              </Grad>
            </Tap>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

function ScopeBar({
  scope,
  onScope,
  onMore,
  tab,
}: {
  scope: string;
  onScope: (s: string) => void;
  onMore: () => void;
  tab: 'analysis' | 'note';
}) {
  const { state } = useStore();
  const chips =
    tab === 'analysis'
      ? [{ id: 'summary', name: 'Summary' }, ...state.routines.slice(0, 2)]
      : state.routines.slice(0, 2);

  return (
    <Row gap={8} style={{ marginTop: 16 }}>
      {chips.map((c) => {
        const on = scope === c.id || (tab === 'note' && scope === 'summary' && c.id === chips[0].id);
        return (
          <Tap key={c.id} onPress={() => onScope(c.id)}>
            {on ? (
              <Grad colors={G.ink} diag style={SCOPE_ON}>
                <T size={14.5} weight={700} color={C.onInk}>
                  {c.name}
                </T>
              </Grad>
            ) : (
              <View style={SCOPE_OFF}>
                <T size={14.5} weight={600} color={C.muted}>
                  {c.name}
                </T>
              </View>
            )}
          </Tap>
        );
      })}
      <View style={{ flex: 1 }} />
      <Tap onPress={onMore}>
        <Grad colors={G.card} style={[MORE, rowSkin()]}>
          <Icon name="chevD" size={17} color={C.textSoft} />
        </Grad>
      </Tap>
    </Row>
  );
}

/* ── 4.1 summary ──────────────────────────────────────────────────── */

function Summary({ streak, onRings }: { streak: number; onRings: () => void }) {
  const { state } = useStore();
  const tier = tierFor(streak);
  const nextTier = MOMENTUM_TIERS[MOMENTUM_TIERS.indexOf(tier) + 1];
  const withinTier = (streak - tier.from + 1) / (tier.to - tier.from + 1);
  const toNext = Math.max(0, tier.to - streak + 1);

  const best = useMemo(
    () => bestStreak(state.routines, state.sessions)?.routine,
    [state.routines, state.sessions]
  );

  const week = useMemo(
    () => weekSummary(state.routines, state.sessions, state.settings.weekStart),
    [state.routines, state.sessions, state.settings.weekStart]
  );

  const grid = useMemo(
    () => weekGrid(state.routines, state.sessions, state.settings.weekStart),
    [state.routines, state.sessions, state.settings.weekStart]
  );

  return (
    <>
      <Grad colors={G.card} style={[{ marginTop: 18, borderRadius: RADIUS.card, padding: 22 }, cardSkin()]}>
        <Row center={false}>
          <View style={{ flex: 1 }}>
            <T size={17} weight={500} color={C.textMid}>
              Max. streak
            </T>
            <T d size={38} weight={800} lh={42} style={{ marginTop: 6 }}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </T>
            <T size={14} weight={500} color={C.muted} style={{ marginTop: 4 }}>
              {best?.name ?? 'No routines yet'}
            </T>
          </View>
          <Tap onPress={onRings}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Icon name="ring" size={62} color={stepColor(tier.step)} />
              <Row gap={5}>
                <T size={14} weight={700}>
                  Momentum
                </T>
                <Icon name="help" size={15} color={C.ghost} />
              </Row>
            </View>
          </Tap>
        </Row>

        <View style={PROG()}>
          <Grad
            colors={G.accent}
            diag
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.round(withinTier * 100)}%`,
              borderRadius: 999,
            }}
          />
          <T size={12} weight={700} color={C.textMid} style={{ position: 'absolute', right: 14, top: 6 }}>
            {nextTier ? `${toNext} days to ${nextTier.name}` : 'Top tier reached'}
          </T>
        </View>
      </Grad>

      <Row style={{ justifyContent: 'space-between', marginTop: 24 }}>
        <Row gap={8}>
          <T d size={22} weight={800}>
            Weekly
          </T>
          <Icon name="help" size={17} color={C.ghost} />
        </Row>
        <Row gap={10}>
          <Grad colors={G.card} style={[NAV, rowSkin()]}>
            <Icon name="chevL" size={15} color={C.muted} />
          </Grad>
          <T size={14} weight={600} color={C.textMid}>
            {weekLabel(state.settings.weekStart)}
          </T>
          <Grad colors={G.card} style={[NAV, rowSkin()]}>
            <Icon name="chevR" size={15} color={C.muted} />
          </Grad>
        </Row>
      </Row>

      <Grad colors={G.card} style={[WEEK_CARD, cardSkin()]}>
        <View style={{ flex: 1 }}>
          <T d size={30} weight={800}>
            {week.pct === null ? '—' : `${week.pct}%`}
          </T>
          <T size={13} weight={500} lh={18} color={C.muted} style={{ marginTop: 6 }}>
            {weekCaption(week)}
          </T>
        </View>
        <Grad colors={G.accent} diag style={FACE_BADGE}>
          <MoodFace level={3} size={32} color={C.accentOn} />
        </Grad>
      </Grad>

      <Grad colors={G.card} style={[{ marginTop: 12, borderRadius: RADIUS.card, padding: 20 }, cardSkin()]}>
        <Row style={{ justifyContent: 'space-between', paddingLeft: 96 }}>
          {DAY_LETTERS.map((d, i) => (
            <T key={i} size={13} weight={600} color={i === new Date().getDay() ? C.ink : C.muted}>
              {d}
            </T>
          ))}
        </Row>
        {grid.map((row) => (
          <Row key={row.routineId} style={{ marginTop: 14 }}>
            <T size={13.5} weight={500} color={C.textMid} style={{ width: 96 }}>
              {row.label}
            </T>
            <Row style={{ flex: 1, justifyContent: 'space-between' }}>
              {row.days.map((s, i) => (
                <DayDot key={i} state={s} />
              ))}
            </Row>
          </Row>
        ))}
      </Grad>
    </>
  );
}

function DayDot({ state }: { state: 0 | 1 | 2 | 3 }) {
  if (state === 2) return <Grad colors={G.accent} diag style={DOT} />;
  if (state === 1) return <Grad colors={G.accentTint} diag style={DOT} />;
  return (
    <View
      style={[
        DOT,
        {
          borderWidth: 1.6,
          borderColor: C.wisp,
          borderStyle: state === 3 ? 'dashed' : 'solid',
        },
      ]}
    />
  );
}

/**
 * The board's "completed · up 8 points on last week". The delta is only claimed
 * when there is a previous week to compare against — before that the line just
 * says what the number is.
 */
function weekCaption({ pct, deltaPoints }: { pct: number | null; deltaPoints: number | null }) {
  if (pct === null) return 'nothing scheduled\nthis week yet';
  if (deltaPoints === null) return 'completed · first week\non record';
  if (deltaPoints === 0) return 'completed · level\nwith last week';
  const dir = deltaPoints > 0 ? 'up' : 'down';
  const n = Math.abs(deltaPoints);
  return `completed · ${dir} ${n} point${n === 1 ? '' : 's'}\non last week`;
}

function weekLabel(weekStart: 'Sun' | 'Mon' = 'Sun') {
  const start = weekStartDate(new Date(), weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const m = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  return start.getMonth() === end.getMonth()
    ? `${m(start)} ${start.getDate()} – ${end.getDate()}`
    : `${m(start)} ${start.getDate()} – ${m(end)} ${end.getDate()}`;
}

/* ── 4.2 per-routine ──────────────────────────────────────────────── */

function PerRoutine({ routineId }: { routineId: string }) {
  const { routine, state } = useStore();
  const r = routine(routineId);

  const chart = useMemo(
    () => (r ? thirtyDay(r, state.sessions) : null),
    [r, state.sessions]
  );
  const spent = useMemo(() => (r ? timeSpent(r, state.sessions) : []), [r, state.sessions]);
  const insight = useMemo(() => (r ? insightFor(r, state.sessions) : null), [r, state.sessions]);

  if (!r || !chart) return null;

  return (
    <>
      <Grad colors={G.card} style={[{ marginTop: 18, borderRadius: RADIUS.card, padding: 20 }, cardSkin()]}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T size={15} weight={700}>
            Last 30 days
          </T>
          <T size={13} weight={500} color={C.muted}>
            {chart.scheduled === 0
              ? 'Nothing scheduled yet'
              : `${chart.completed} of ${chart.scheduled} completed`}
          </T>
        </Row>

        {chart.bars.length ? (
          <>
            <Row gap={5} center={false} style={{ height: 120, marginTop: 18, alignItems: 'flex-end' }}>
              {chart.bars.map((b) =>
                b.hit ? (
                  <Grad
                    key={b.day}
                    colors={G.accent}
                    diag
                    style={{ flex: 1, height: `${b.h * 100}%`, borderRadius: 5 }}
                  />
                ) : (
                  <View
                    key={b.day}
                    style={{ flex: 1, height: `${b.h * 100}%`, borderRadius: 5, backgroundColor: C.track }}
                  />
                )
              )}
            </Row>

            <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
              {rangeLabels(chart.bars.map((b) => b.day)).map((l, i) => (
                <T key={`${l}-${i}`} size={11.5} weight={500} color={C.ghost}>
                  {l}
                </T>
              ))}
            </Row>
          </>
        ) : (
          <T size={13.5} lh={21} color={C.muted} style={{ marginTop: 14 }}>
            Run this routine once and its history starts here.
          </T>
        )}
      </Grad>

      {spent.length ? (
        <>
          <T d size={19} weight={800} style={{ marginTop: 14 }}>
            Where the time goes
          </T>

          <View style={{ gap: 10, marginTop: 14 }}>
            {spent.map((t) => (
              <Row key={t.taskId} gap={13}>
                <View style={[SMALL_ICON, { backgroundColor: TASK_TONES[t.tone].bg }]}>
                  <Icon name={t.icon} size={17} color={TASK_TONES[t.tone].fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size={14.5} weight={600}>
                    {t.title}
                  </T>
                  <View style={{ marginTop: 7 }}>
                    <MeterRow value={t.pct} over={t.over} />
                  </View>
                </View>
                <T
                  size={13}
                  weight={700}
                  color={t.over ? C.over : C.textSoft}
                  style={{ width: 56, textAlign: 'right' }}
                >
                  {avgLabel(t.avgSeconds)}
                </T>
              </Row>
            ))}
          </View>
        </>
      ) : null}

      {insight ? (
        <Grad colors={G.accentWash} diag style={INSIGHT()}>
          <Icon name="spark" size={20} color={C.accentInkSoft} />
          <T size={13.5} weight={500} lh={20} color={C.accentText} style={{ flex: 1 }}>
            {insight}
          </T>
        </Grad>
      ) : null}
    </>
  );
}

/** First, middle and last day actually plotted — not a fixed 30-day window. */
function rangeLabels(days: string[]) {
  if (!days.length) return [];
  const fmt = (day: string) => {
    const d = new Date(`${day}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? day
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const picks = [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]];
  return Array.from(new Set(picks)).map(fmt);
}

/* ── 4.3 momentum rings ───────────────────────────────────────────── */

function RingsDialog({
  visible,
  onClose,
  streak,
}: {
  visible: boolean;
  onClose: () => void;
  streak: number;
}) {
  const current = tierFor(streak);
  return (
    <Dialog visible={visible} onClose={onClose}>
      <T d size={26} weight={800} center>
        Momentum rings
      </T>
      <T size={14.5} weight={500} center color={C.muted} style={{ marginTop: 8 }}>
        You're {streak} days deep
      </T>

      <View style={{ gap: 16, marginTop: 24 }}>
        {MOMENTUM_TIERS.map((t) => {
          const on = t.name === current.name;
          const row = (
            <Row gap={16} style={{ opacity: on ? 1 : 0.45 }}>
              <Icon name="ring" size={on ? 32 : 30} color={stepColor(t.step)} />
              <View style={{ flex: 1 }}>
                <T size={16} weight={700}>
                  {t.name}
                </T>
                <T size={13} color={on ? C.accentInk : C.muted} style={{ marginTop: 4 }}>
                  {t.range}
                </T>
              </View>
              {on ? (
                <Grad colors={G.accent} diag style={YOU}>
                  <T size={11} weight={700}>
                    You
                  </T>
                </Grad>
              ) : null}
            </Row>
          );
          return on ? (
            <Grad
              key={t.name}
              colors={G.accentWash}
              diag
              style={{ borderRadius: 16, padding: 12, paddingHorizontal: 14, marginHorizontal: -14 }}
            >
              {row}
            </Grad>
          ) : (
            <View key={t.name}>{row}</View>
          );
        })}
      </View>

      <Tap onPress={onClose}>
        <T d size={17} weight={700} center style={{ marginTop: 22, paddingVertical: 12 }}>
          Okay
        </T>
      </Tap>
    </Dialog>
  );
}

/* ── 4.4 notes ────────────────────────────────────────────────────── */

function Notes({ routineId }: { routineId: string }) {
  const { state, addNote } = useStore();
  const [mode, setMode] = useState<'routine' | 'task'>('routine');
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState('');

  const list = state.notes.filter((n) => n.routineId === routineId);

  return (
    <>
      <Row gap={22} style={{ marginTop: 18, paddingLeft: 2 }}>
        {(['routine', 'task'] as const).map((m) => (
          <Tap key={m} onPress={() => setMode(m)}>
            <T
              size={15}
              weight={mode === m ? 700 : 600}
              color={mode === m ? C.ink : C.ghost}
              style={{
                paddingBottom: 7,
                borderBottomWidth: mode === m ? 2 : 0,
                borderBottomColor: C.ink,
              }}
            >
              {m === 'routine' ? 'Routine' : 'Task'}
            </T>
          </Tap>
        ))}
      </Row>

      <View style={{ gap: 12, marginTop: 18 }}>
        {list.length === 0 ? (
          <T size={14.5} lh={22} color={C.muted}>
            No notes on this one yet. They're the fastest way to spot what actually changes a
            morning.
          </T>
        ) : null}

        {list.map((n) => (
          <Grad key={n.id} colors={G.card} style={[{ borderRadius: RADIUS.card, padding: 20, paddingVertical: 18 }, cardSkin()]}>
            <Row gap={10}>
              <T size={13} weight={700}>
                {n.day}
              </T>
              <Grad
                colors={n.ring === 0 ? G.accent : G.accentTint}
                diag
                style={{ width: 20, height: 20, borderRadius: 10 }}
              />
              <View style={{ flex: 1 }} />
              <T size={12.5} weight={500} color={C.muted}>
                {n.durationMin}m · {n.done}/{n.total}
              </T>
            </Row>
            <T size={14.5} lh={23} color={C.textMid} style={{ marginTop: 12 }}>
              {n.body}
            </T>
          </Grad>
        ))}
      </View>

      {writing ? (
        <Grad colors={G.card} style={[{ marginTop: 18, borderRadius: RADIUS.tile, padding: 16 }, rowSkin()]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            autoFocus
            placeholder="What happened today?"
            placeholderTextColor={C.ghost}
            style={NOTE_INPUT()}
          />
          <Row gap={10} style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            <Tap onPress={() => setWriting(false)}>
              <T size={14.5} weight={600} color={C.muted}>
                Cancel
              </T>
            </Tap>
            <Tap
              onPress={() => {
                if (draft.trim()) addNote(routineId, draft.trim());
                setDraft('');
                setWriting(false);
              }}
            >
              <T size={14.5} weight={700} color={C.accentInk}>
                Save
              </T>
            </Tap>
          </Row>
        </Grad>
      ) : (
        <Tap onPress={() => setWriting(true)}>
          <Row gap={10} style={ADD_NOTE()}>
            <Icon name="plus" size={18} color={C.ghost} />
            <T size={14.5} weight={600} color={C.ghost}>
              Write a note for today
            </T>
          </Row>
        </Tap>
      )}
    </>
  );
}

/* ── styles ───────────────────────────────────────────────────────── */

const SCOPE_ON = { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 };
const SCOPE_OFF = { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 };
const MORE = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const PROG = () => ({
  marginTop: 18,
  height: 26,
  borderRadius: 999,
  backgroundColor: C.stoneDeep,
  overflow: 'hidden' as const,
  justifyContent: 'center' as const,
});
const NAV = {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const WEEK_CARD = {
  marginTop: 14,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 22,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 16,
};
const FACE_BADGE = {
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const DOT = { width: 22, height: 22, borderRadius: 11 };
const SMALL_ICON = {
  width: 32,
  height: 32,
  borderRadius: 10,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const INSIGHT = () => ({
  marginTop: 18,
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.accentWashBorder,
  flexDirection: 'row' as const,
  gap: 12,
});
const YOU = { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 };
const PICK = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 18,
};
const ADD_NOTE = () => ({
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
});
const NOTE_INPUT = () => ({
  minHeight: 70,
  fontFamily: 'Instrument_400Regular',
  fontSize: 14.5,
  lineHeight: 22,
  color: C.textMid,
  textAlignVertical: 'top' as const,
});
