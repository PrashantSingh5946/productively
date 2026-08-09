/**
 * Flow 02 — Home.
 * 2.1 Routines list · 2.2 Checklist · 2.3 Timeline · 2.4 Add sheet.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Grad,
  Row,
  Segmented,
  Sheet,
  T,
  Tap,
} from '../../src/ui';
import { FabStack, RoutineCard, StreakRail, Timeline } from '../../src/components/HomeParts';
import { Icon, IconName } from '../../src/icons';
import { C, G } from '../../src/theme';
import { fmtClock } from '../../src/data';
import { useStore } from '../../src/store';
import { useNow } from '../../src/useNow';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { state, set, streakFor, toggleChecklistItem } = useStore();
  const now = useNow(30_000);
  const [tab, setTab] = useState<'routine' | 'checklist'>('routine');
  const [addOpen, setAddOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [filterAll, setFilterAll] = useState(true);

  const view = state.settings.homeView;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekday = now.getDay();

  const todays = useMemo(
    () => state.routines.filter((r) => (filterAll ? true : r.days.includes(weekday))),
    [state.routines, filterAll, weekday]
  );

  /** The next routine still due today, used for the highlight card + countdown. */
  const upcoming = useMemo(() => {
    const pending = todays
      .filter((r) => !state.sessions.some((s) => s.routineId === r.id && s.day === iso(now)))
      .sort((a, b) => a.start - b.start);
    return pending.find((r) => r.start >= nowMin) ?? pending[0];
  }, [todays, state.sessions, nowMin, now]);

  const untilNext = upcoming ? diffLabel(upcoming.start, nowMin) : undefined;
  const streak = streakFor('morning');

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', paddingTop: 10 }}>
          <Tap onPress={() => setJumpOpen(true)}>
            <Grad colors={G.card} style={GRID}>
              <Icon name="grid" size={21} color={C.text} />
            </Grad>
          </Tap>
          <Segmented
            options={[
              { key: 'routine', label: 'Routine' },
              { key: 'checklist', label: 'Checklist' },
            ]}
            value={tab}
            onChange={(k) => setTab(k as 'routine' | 'checklist')}
          />
        </Row>

        {tab === 'routine' ? (
          view === 'list' ? (
            <ListView
              streak={streak}
              upcomingId={upcoming?.id}
              untilNext={untilNext}
              filterAll={filterAll}
              onFilter={() => setFilterAll((v) => !v)}
            />
          ) : (
            <TimelineView nowMin={nowMin} />
          )
        ) : (
          <ChecklistView onToggle={toggleChecklistItem} />
        )}
      </ScrollView>

      <FabStack
        targetMinutes={tab === 'routine' && view === 'list' ? upcoming?.start : undefined}
        onTimer={() => upcoming && router.push(`/routine/${upcoming.id}`)}
        onAdd={() => setAddOpen(true)}
        bottom={14}
      />

      <AddSheet visible={addOpen} onClose={() => setAddOpen(false)} />
      <JumpSheet visible={jumpOpen} onClose={() => setJumpOpen(false)} />
    </View>
  );
}

/* ── 2.1 list view ────────────────────────────────────────────────── */

function ListView({
  streak,
  upcomingId,
  untilNext,
  filterAll,
  onFilter,
}: {
  streak: number;
  upcomingId?: string;
  untilNext?: string;
  filterAll: boolean;
  onFilter: () => void;
}) {
  const { state, set, completedToday } = useStore();
  const now = useNow(60_000);
  const cfg = state.settings.homeList;

  return (
    <>
      <T d size={27} weight={800} lh={35} style={{ marginTop: 20 }}>
        {greeting(now.getHours())}, {state.profile.name}.{'\n'}
        {inWords(streak)} days and counting.
      </T>

      <Row style={{ justifyContent: 'space-between', marginTop: 20 }}>
        <Tap onPress={onFilter}>
          <Grad colors={G.card} style={FILTER}>
            <Icon name="filter" size={17} color={C.textSoft} />
            <T size={14} weight={600} color={C.textMid}>
              {filterAll ? 'Filter' : 'Today only'}
            </T>
          </Grad>
        </Tap>

        <View style={VIEW_TOGGLE}>
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
                  <Grad colors={G.chip} style={VIEW_ITEM}>
                    <Icon name={k as IconName} size={19} color={C.text} />
                  </Grad>
                ) : (
                  <View style={VIEW_ITEM}>
                    <Icon name={k as IconName} size={19} color={C.ghost} />
                  </View>
                )}
              </Tap>
            );
          })}
        </View>
      </Row>

      <StreakRail streak={streak} onPress={() => router.push('/(tabs)/analysis')} />

      {state.routines
        .filter((r) => (filterAll ? true : r.days.includes(now.getDay())))
        .map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            next={r.id === upcomingId}
            countdown={untilNext}
            session={completedToday(r.id)}
            showIcons={cfg.taskIcons || r.id === upcomingId}
            showStart={cfg.startTime}
            showDays={cfg.repeatDays}
            showProgress={cfg.progress}
            onOpen={() => router.push(`/routine/${r.id}`)}
            onRun={() => router.push(`/run/${r.id}`)}
          />
        ))}
    </>
  );
}

/* ── 2.3 timeline view ────────────────────────────────────────────── */

function TimelineView({ nowMin }: { nowMin: number }) {
  const { state, set } = useStore();
  const now = useNow(60_000);
  const day = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <Row style={{ justifyContent: 'space-between', marginTop: 20 }}>
        <T d size={24} weight={800}>
          {day}
        </T>
        <View style={VIEW_TOGGLE}>
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
                  <Grad colors={G.chip} style={VIEW_ITEM}>
                    <Icon name={k as IconName} size={19} color={C.text} />
                  </Grad>
                ) : (
                  <View style={VIEW_ITEM}>
                    <Icon name={k as IconName} size={19} color={C.ghost} />
                  </View>
                )}
              </Tap>
            );
          })}
        </View>
      </Row>

      <Timeline
        routines={state.routines.filter((r) => r.days.includes(now.getDay()))}
        sessions={state.sessions.filter((s) => s.day === iso(now))}
        nowMinutes={nowMin}
        showTasks={state.settings.homeTimeline.showTasks}
        onOpen={(id) => router.push(`/routine/${id}`)}
      />
    </>
  );
}

/* ── 2.2 checklist ────────────────────────────────────────────────── */

function ChecklistView({
  onToggle,
}: {
  onToggle: (groupId: string, itemId: string) => void;
}) {
  const { state } = useStore();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  return (
    <>
      <T d size={27} weight={800} lh={35} style={{ marginTop: 20 }}>
        {'Nothing important\nleft behind.'}
      </T>

      {state.checklists.map((g, gi) => {
        const open = !collapsed.includes(g.id);
        const done = g.items.filter((i) => i.done).length;
        return (
          <View key={g.id}>
            <Tap
              onPress={() =>
                setCollapsed((c) =>
                  c.includes(g.id) ? c.filter((x) => x !== g.id) : [...c, g.id]
                )
              }
            >
              <Row gap={10} style={{ marginTop: gi === 0 ? 22 : 26 }}>
                <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
                  <Icon name="chevD" size={18} color={C.muted} />
                </View>
                <T d size={17} weight={700} style={{ flex: 1 }}>
                  {g.title}
                </T>
                <T size={14} weight={600} color={C.muted}>
                  {done}/{g.items.length}
                </T>
                <Icon name="chevR" size={17} color={C.ghost} />
              </Row>
            </Tap>

            {open ? (
              <View style={{ gap: 10, marginTop: 14 }}>
                {g.items.map((it) => (
                  <Tap key={it.id} onPress={() => onToggle(g.id, it.id)}>
                    <Grad colors={G.card} style={CHECK_ROW}>
                      {it.done ? (
                        <Grad colors={G.accent} diag style={BOX}>
                          <Icon name="check" size={15} color={C.ink} />
                        </Grad>
                      ) : (
                        <View style={[BOX, { borderWidth: 2, borderColor: C.ring }]} />
                      )}
                      <T
                        size={15.5}
                        weight={it.done ? 500 : 600}
                        color={it.done ? C.faint : C.ink}
                        style={{
                          flex: 1,
                          textDecorationLine: it.done ? 'line-through' : 'none',
                        }}
                      >
                        {it.title}
                      </T>
                    </Grad>
                  </Tap>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

/* ── 2.4 add sheet ────────────────────────────────────────────────── */

const ADD_OPTIONS: {
  key: string;
  icon: IconName;
  title: string;
  sub: string;
  go?: string;
}[] = [
  { key: 'routine', icon: 'rows', title: 'Routine', sub: 'A timed sequence of tasks', go: '/(tabs)/explore' },
  { key: 'checklist', icon: 'check', title: 'Checklist', sub: 'Untimed things not to forget' },
  { key: 'timer', icon: 'alarm', title: 'Quick timer', sub: 'One task, right now', go: '/run/quick' },
  { key: 'template', icon: 'compass', title: 'Start from a template', sub: 'Browse the library', go: '/(tabs)/explore' },
];

function AddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addChecklistItem } = useStore();

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
                else addChecklistItem('go', 'New checklist item');
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
                <View style={[OPT_ICON, !first && { backgroundColor: C.white }]}>
                  {first ? (
                    <Grad colors={G.accent} diag style={OPT_FILL}>
                      <Icon name={o.icon} size={22} color={C.ink} />
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

/** Quick jump behind the grid button — every routine and list in one place. */
function JumpSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state } = useStore();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800}>
        Jump to
      </T>
      <View style={{ gap: 11, marginTop: 20 }}>
        {state.routines.map((r) => (
          <Tap
            key={r.id}
            onPress={() => {
              onClose();
              router.push(`/routine/${r.id}`);
            }}
          >
            <Grad colors={G.card} style={JUMP}>
              <Icon name="rows" size={20} color={C.textMid} />
              <T size={16} weight={700} style={{ flex: 1 }}>
                {r.name}
              </T>
              <T size={13} weight={500} color={C.muted}>
                {fmtClock(r.start)}
              </T>
            </Grad>
          </Tap>
        ))}
        {state.checklists.map((c) => (
          <Grad key={c.id} colors={G.card} style={JUMP}>
            <Icon name="check" size={20} color={C.textMid} />
            <T size={16} weight={700} style={{ flex: 1 }}>
              {c.title}
            </T>
            <T size={13} weight={500} color={C.muted}>
              {c.items.filter((i) => i.done).length}/{c.items.length}
            </T>
          </Grad>
        ))}
      </View>
    </Sheet>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

const iso = (d: Date) => d.toISOString().slice(0, 10);

function greeting(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];
const inWords = (n: number) => WORDS[n] ?? String(n);

function diffLabel(start: number, now: number) {
  const d = start - now;
  if (d <= 0) return 'now';
  if (d < 60) return `in ${d}m`;
  return `in ${Math.floor(d / 60)}h ${d % 60}m`;
}

/* ── styles ───────────────────────────────────────────────────────── */

const GRID = {
  width: 44,
  height: 44,
  borderRadius: 14,
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

const VIEW_TOGGLE = {
  flexDirection: 'row' as const,
  padding: 4,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: C.border,
};

const VIEW_ITEM = {
  width: 44,
  height: 34,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const CHECK_ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 16,
};

const BOX = {
  width: 23,
  height: 23,
  borderRadius: 7,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const OPTION = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 15,
  padding: 18,
  borderRadius: 18,
};

const OPT_ICON = {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  overflow: 'hidden' as const,
};

const OPT_FILL = {
  width: 44,
  height: 44,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const JUMP = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderRadius: 18,
};
