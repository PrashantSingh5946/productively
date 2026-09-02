/**
 * Flow 01 — Today.
 * 1.1 tools hidden · 1.2 tools revealed · 1.3 timeline · add sheet.
 *
 * The app opens straight here. v2 spent the top of this screen on a Routine /
 * Checklist segmented control, a five-node streak rail and a permanent filter
 * bar — three rows of chrome above the first routine. v3 puts the filter and
 * the view toggle behind the tune button and lets the routines start at the
 * fold; Checklist took its own dock slot. The rail is gone rather than moved:
 * it drew the next five days as trophies for a streak the headline already
 * states in words, and Stats covers the same ground with real history.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Overline, Row, Sheet, T, Tap, rowSkin } from '../../src/ui';
import { Fab, RoutineCard, Timeline } from '../../src/components/HomeParts';
import { Icon, IconName } from '../../src/icons';
import { C, DOCK_CLEARANCE, G } from '../../src/theme';
import { bestStreak, dayKey, rateFor } from '../../src/analytics';
import { useStore } from '../../src/store';
import { useNow } from '../../src/useNow';

import { useT } from '../../src/theming';
export default function Home() {
  useT();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const now = useNow(30_000);
  const [addOpen, setAddOpen] = useState(false);
  const [filterAll, setFilterAll] = useState(true);
  /**
   * Whether the filter pill and view toggle are on screen. Deliberately not
   * persisted: revealing them is a thing you do for the next few seconds, and
   * a tool bar that came back three days later would just be chrome again.
   */
  const [tools, setTools] = useState(false);

  const view = state.settings.homeView;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekday = now.getDay();

  const todays = useMemo(
    () => state.routines.filter((r) => (filterAll ? true : r.days.includes(weekday))),
    [state.routines, filterAll, weekday]
  );

  /**
   * The next routine still due today, used for the highlight card + countdown.
   *
   * Drawn from the routines actually scheduled today, never from `todays` —
   * that list defaults to showing every routine, so counting down from it
   * promised "in 4h 20m" on a Saturday for a routine that only runs Mon–Fri.
   */
  const upcoming = useMemo(() => {
    const pending = state.routines
      .filter((r) => r.days.includes(weekday))
      .filter((r) => !state.sessions.some((s) => s.routineId === r.id && s.day === iso(now)))
      .sort((a, b) => a.start - b.start);
    return pending.find((r) => r.start >= nowMin) ?? pending[0];
  }, [state.routines, state.sessions, weekday, nowMin, now]);

  const untilNext = upcoming ? diffLabel(upcoming.start, nowMin) : undefined;
  // The headline follows whichever routine is running longest, not a fixed id.
  const streak = bestStreak(state.routines, state.sessions, now)?.streak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14 }}>
          <Overline>
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Overline>
          <Tap onPress={() => setTools((v) => !v)} hitSlop={8}>
            {tools ? (
              <Grad colors={G.ink} diag style={TUNE}>
                <Icon name="filter" size={19} color={C.onInk} />
              </Grad>
            ) : (
              <Grad colors={G.card} style={[TUNE, rowSkin()]}>
                <Icon name="filter" size={19} color={C.textSoft} />
              </Grad>
            )}
          </Tap>
        </Row>

        <T d size={27} weight={800} lh={34} style={{ marginTop: 6 }}>
          {view === 'list'
            ? `${greeting(now.getHours())}${state.profile.name ? `, ${state.profile.name}` : ''}.\n${streakLine(streak)}`
            : 'The day, on rails.'}
        </T>

        {tools ? (
          <Row style={{ justifyContent: 'space-between', marginTop: 16 }}>
            {/* The timeline is today's clock by definition, so an
                all-routines filter has nothing to mean there — showing the
                pill in both views made the two disagree about the day. */}
            {view === 'list' ? (
              <Tap onPress={() => setFilterAll((v) => !v)}>
                <Grad colors={G.card} style={[FILTER, rowSkin()]}>
                  <Icon name="filter" size={17} color={C.textSoft} />
                  <T size={14} weight={600} color={C.textMid}>
                    {filterAll ? 'All routines' : 'Today only'}
                  </T>
                </Grad>
              </Tap>
            ) : (
              <View />
            )}
            <ViewToggle />
          </Row>
        ) : null}

        {view === 'list' ? (
          <ListView
            routines={todays}
            upcomingId={upcoming?.id}
            untilNext={untilNext}
            topGap={tools ? 14 : 20}
            filtered={!filterAll && state.routines.length > 0}
          />
        ) : (
          <TimelineView nowMin={nowMin} topGap={tools ? 14 : 18} />
        )}
      </ScrollView>

      <Fab onPress={() => setAddOpen(true)} bottom={insets.bottom + 118} />

      <AddSheet visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

/** List / timeline, the one control that outlives the tune button's session. */
function ViewToggle() {
  const { state, set } = useStore();
  return (
    <View style={VIEW_TOGGLE()}>
      {(['list', 'clock'] as const).map((k) => {
        const on = (k === 'list') === (state.settings.homeView === 'list');
        return (
          <Tap
            key={k}
            onPress={() =>
              set((d) => {
                d.settings.homeView = k === 'list' ? 'list' : 'timeline';
              })
            }
          >
            {on ? (
              <View style={[VIEW_ITEM, rowSkin(), { borderRadius: 999 }]}>
                <Icon name={k as IconName} size={19} color={C.ink} />
              </View>
            ) : (
              <View style={VIEW_ITEM}>
                <Icon name={k as IconName} size={19} color={C.muted} />
              </View>
            )}
          </Tap>
        );
      })}
    </View>
  );
}

/* ── 1.1 list view ────────────────────────────────────────────────── */

function ListView({
  routines,
  upcomingId,
  untilNext,
  topGap,
  filtered,
}: {
  routines: ReturnType<typeof useStore>['state']['routines'];
  upcomingId?: string;
  untilNext?: string;
  topGap: number;
  /** True when routines exist but today's filter hid them all. */
  filtered: boolean;
}) {
  const { state, completedToday } = useStore();
  const cfg = state.settings.homeList;

  // An empty list used to render nothing at all, which left the screen blank
  // below the greeting with no way to tell "rest day" from "broken".
  if (routines.length === 0) {
    return (
      <View style={{ marginTop: topGap + 8 }}>
        <T d size={19} weight={700} color={C.textMid}>
          {filtered ? 'Nothing scheduled today.' : 'No routines yet.'}
        </T>
        <T size={14.5} lh={22} color={C.muted} style={{ marginTop: 8 }}>
          {filtered
            ? 'A rest day is part of the plan. Switch to All routines to see the rest of your week.'
            : 'A routine is a short sequence you run at the same time each day. Tap + to build your first one.'}
        </T>
      </View>
    );
  }

  return (
    <View style={{ marginTop: topGap }}>
      {routines.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          next={r.id === upcomingId}
          countdown={untilNext}
          session={completedToday(r.id)}
          rate={rateFor(r, state.sessions)}
          showIcons={cfg.taskIcons || r.id === upcomingId}
          showStart={cfg.startTime}
          showDays={cfg.repeatDays}
          showProgress={cfg.progress}
          onOpen={() => router.push(`/routine/${r.id}`)}
          onRun={() => router.push(`/run/${r.id}`)}
        />
      ))}
    </View>
  );
}

/* ── 1.3 timeline view ────────────────────────────────────────────── */

function TimelineView({ nowMin, topGap }: { nowMin: number; topGap: number }) {
  const { state } = useStore();
  const now = useNow(60_000);

  return (
    <View style={{ marginTop: topGap }}>
      <Timeline
        routines={state.routines.filter((r) => r.days.includes(now.getDay()))}
        sessions={state.sessions.filter((s) => s.day === iso(now))}
        nowMinutes={nowMin}
        showTasks={state.settings.homeTimeline.showTasks}
        onOpen={(id) => router.push(`/routine/${id}`)}
      />
    </View>
  );
}

/* ── add sheet ────────────────────────────────────────────────────── */

const ADD_OPTIONS: {
  key: 'routine' | 'checklist' | 'timer';
  icon: IconName;
  title: string;
  sub: string;
  go?: string;
}[] = [
  // "Routine" used to open Explore, which is what "Start from a template"
  // does — two of the four rows led to the same screen and there was no way
  // to make an empty routine at all. This one now creates and opens one.
  { key: 'routine', icon: 'rows', title: 'Routine', sub: 'A timed sequence of tasks' },
  { key: 'checklist', icon: 'check', title: 'Checklist', sub: 'Untimed things not to forget' },
  { key: 'timer', icon: 'alarm', title: 'Quick timer', sub: 'One task, right now', go: '/run/quick' },
  // "Start from a template" went with Explore — the library was the browse
  // surface v3 cuts, and a row that opens a screen nobody can get back to is
  // worse than no row.
];

function AddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, addRoutine } = useStore();

  /** A new routine starts where the user wakes up, not at a hardcoded 7am. */
  const create = () => {
    const id = addRoutine('New routine', state.profile.wake, [1, 2, 3, 4, 5]);
    router.push(`/routine/${id}`);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800}>
        Add something new
      </T>
      <View style={{ gap: 11, marginTop: 20 }}>
        {ADD_OPTIONS.map((o, i) => {
          const first = i === 0;
          return (
            <Tap
              key={o.key}
              onPress={() => {
                onClose();
                if (o.go) router.push(o.go as never);
                else if (o.key === 'routine') create();
                // The checklist composer lives on the checklist tab now, so
                // this hands over to the page rather than opening a dialog on
                // top of a screen that no longer owns any lists.
                else router.push('/(tabs)/checklist');
              }}
            >
              <Grad
                colors={first ? G.accentWash : G.card}
                diag={first}
                style={[
                  OPTION,
                  first && { borderWidth: 1.5, borderColor: C.accentWashBorder },
                ]}
              >
                <View style={[OPT_ICON, !first && { backgroundColor: C.card }]}>
                  {first ? (
                    <Grad colors={G.accent} diag style={OPT_FILL}>
                      <Icon name={o.icon} size={22} color={C.accentOn} />
                    </Grad>
                  ) : (
                    <Icon name={o.icon} size={22} color={C.textMid} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <T size={16} weight={700} lh={19}>
                    {o.title}
                  </T>
                  <T size={13} lh={17} color={first ? C.accentInk : C.muted} style={{ marginTop: 3 }}>
                    {o.sub}
                  </T>
                </View>
                <Icon name="chevR" size={18} color={first ? C.accentInkSoft : C.ghost} />
              </Grad>
            </Tap>
          );
        })}
      </View>
    </Sheet>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

/** Local, not UTC — sessions are filed against the device's own calendar day. */
const iso = (d: Date) => dayKey(d);

function greeting(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];

const inWords = (n: number) => WORDS[n] ?? String(n);

/** The board's second line, with something to say before there is a streak. */
function streakLine(streak: number) {
  if (streak <= 0) return 'A good day to start.';
  if (streak === 1) return 'One day in.';
  return `${inWords(streak)} days and counting.`;
}

function diffLabel(start: number, now: number) {
  const d = start - now;
  if (d <= 0) return 'now';
  if (d < 60) return `in ${d}m`;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/* ── styles ───────────────────────────────────────────────────────── */

const TUNE = {
  width: 44,
  height: 44,
  borderRadius: 15,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const FILTER = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 9,
  paddingVertical: 11,
  paddingHorizontal: 18,
  borderRadius: 999,
};

const VIEW_TOGGLE = () => ({
  flexDirection: 'row' as const,
  padding: 4,
  borderRadius: 999,
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.hairline,
});

const VIEW_ITEM = {
  width: 44,
  height: 34,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const OPTION = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  padding: 14,
  borderRadius: 20,
};

const OPT_ICON = {
  width: 46,
  height: 46,
  borderRadius: 15,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const OPT_FILL = {
  width: 46,
  height: 46,
  borderRadius: 15,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
