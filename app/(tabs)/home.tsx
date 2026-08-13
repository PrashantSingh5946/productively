/**
 * Flow 02 — Home.
 * 2.1 Routines list · 2.2 Checklist · 2.3 Timeline · 2.4 Add sheet.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCoin,
  Grad,
  MenuSheet,
  Overline,
  Prompt,
  Row,
  Segmented,
  Sheet,
  T,
  Tap,
  rowSkin,
} from '../../src/ui';
import { FabStack, RoutineCard, StreakRail, Timeline } from '../../src/components/HomeParts';
import { Icon, IconName } from '../../src/icons';
import { C, DOCK_CLEARANCE, G } from '../../src/theme';
import { fmtClock } from '../../src/data';
import { bestStreak, dayKey, rateFor } from '../../src/analytics';
import { useStore } from '../../src/store';
import { useNow } from '../../src/useNow';

import { useT } from '../../src/theming';
export default function Home() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, toggleChecklistItem } = useStore();
  const now = useNow(30_000);
  const [tab, setTab] = useState<'routine' | 'checklist'>('routine');
  const [addOpen, setAddOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [filterAll, setFilterAll] = useState(true);
  /** A ticket, not a flag: the + sheet asks for a new list and the checklist
   *  tab opens its composer. A boolean would need clearing back down again. */
  const [newListAt, setNewListAt] = useState(0);

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
  // The headline follows whichever routine is running longest, not a fixed id.
  const streak = bestStreak(state.routines, state.sessions, now)?.streak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', paddingTop: 10 }}>
          <Tap onPress={() => setJumpOpen(true)}>
            <Grad colors={G.card} style={[GRID, rowSkin()]}>
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
          <ChecklistView onToggle={toggleChecklistItem} newListAt={newListAt} />
        )}
      </ScrollView>

      <FabStack
        targetMinutes={tab === 'routine' && view === 'list' ? upcoming?.start : undefined}
        onTimer={() => upcoming && router.push(`/routine/${upcoming.id}`)}
        onAdd={() => setAddOpen(true)}
        bottom={insets.bottom + 118}
      />

      <AddSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onNewChecklist={() => {
          setTab('checklist');
          setNewListAt((n) => n + 1);
        }}
      />
      <JumpSheet
        visible={jumpOpen}
        onClose={() => setJumpOpen(false)}
        onChecklist={() => setTab('checklist')}
      />
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
      <Overline style={{ marginTop: 22 }}>
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </Overline>
      <T d size={27} weight={800} lh={35} style={{ marginTop: 6 }}>
        {greeting(now.getHours())}, {state.profile.name}.{'\n'}
        {streakLine(streak)}
      </T>

      <Row style={{ justifyContent: 'space-between', marginTop: 20 }}>
        <Tap onPress={onFilter}>
          <Grad colors={G.card} style={[FILTER, rowSkin()]}>
            <Icon name="filter" size={17} color={C.textSoft} />
            <T size={14} weight={600} color={C.textMid}>
              {filterAll ? 'Filter' : 'Today only'}
            </T>
          </Grad>
        </Tap>

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
            rate={rateFor(r, state.sessions)}
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
      <Row style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <View>
          <Overline>Today</Overline>
          <T d size={24} weight={800} style={{ marginTop: 4 }}>
            {day}
          </T>
        </View>
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

/**
 * Which dialog the checklist tab currently has open, and what it is about.
 *
 * One state rather than six booleans: a rename and an add can never be open at
 * once, and the target ids have to travel with the intent or the callback fires
 * against whichever row was last tapped.
 */
type ListEdit =
  | { kind: 'new-list' }
  | { kind: 'rename-list'; groupId: string; title: string }
  | { kind: 'new-item'; groupId: string }
  | { kind: 'rename-item'; groupId: string; itemId: string; title: string }
  | null;

function ChecklistView({
  onToggle,
  newListAt,
}: {
  onToggle: (groupId: string, itemId: string) => void;
  /** Bumped by the + sheet to open the composer from outside this component. */
  newListAt: number;
}) {
  const {
    state,
    addChecklist,
    renameChecklist,
    removeChecklist,
    resetChecklist,
    addChecklistItem,
    renameChecklistItem,
    removeChecklistItem,
  } = useStore();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [edit, setEdit] = useState<ListEdit>(null);
  const [menu, setMenu] = useState<{ groupId: string; itemId?: string } | null>(null);

  React.useEffect(() => {
    if (newListAt) setEdit({ kind: 'new-list' });
  }, [newListAt]);

  const group = menu ? state.checklists.find((g) => g.id === menu.groupId) : undefined;
  const item = menu?.itemId ? group?.items.find((i) => i.id === menu.itemId) : undefined;

  return (
    <>
      <Overline style={{ marginTop: 22 }}>Checklists</Overline>
      <T d size={27} weight={800} lh={35} style={{ marginTop: 6 }}>
        {'Nothing important\nleft behind.'}
      </T>

      {state.checklists.length === 0 ? (
        <T size={14.5} lh={22} color={C.muted} style={{ marginTop: 16 }}>
          Nothing here yet. A checklist is for the things that have no clock on
          them — what to pack, what to close down on a Friday.
        </T>
      ) : (
        <T size={13} lh={19} color={C.faint} style={{ marginTop: 12 }}>
          Tap to tick. Hold an item to rename or remove it.
        </T>
      )}

      {state.checklists.map((g, gi) => {
        const open = !collapsed.includes(g.id);
        const done = g.items.filter((i) => i.done).length;
        return (
          <View key={g.id}>
            <Row gap={10} style={{ marginTop: gi === 0 ? 20 : 26 }}>
              <Tap
                style={{ flex: 1 }}
                onPress={() =>
                  setCollapsed((c) =>
                    c.includes(g.id) ? c.filter((x) => x !== g.id) : [...c, g.id]
                  )
                }
              >
                <Row gap={10}>
                  <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
                    <Icon name="chevD" size={18} color={C.muted} />
                  </View>
                  <T d size={17} weight={700} style={{ flex: 1 }}>
                    {g.title}
                  </T>
                  <T size={14} weight={600} color={C.muted}>
                    {done}/{g.items.length}
                  </T>
                </Row>
              </Tap>
              <Tap onPress={() => setMenu({ groupId: g.id })} hitSlop={10}>
                <Icon name="dots" size={18} color={C.ghost} />
              </Tap>
            </Row>

            {open ? (
              <View style={{ gap: 10, marginTop: 14 }}>
                {g.items.map((it) => (
                  <Tap
                    key={it.id}
                    onPress={() => onToggle(g.id, it.id)}
                    onLongPress={() => setMenu({ groupId: g.id, itemId: it.id })}
                  >
                    <Grad colors={G.card} style={[CHECK_ROW, rowSkin()]}>
                      <CheckCoin size={24} on={it.done} />
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

                <Tap onPress={() => setEdit({ kind: 'new-item', groupId: g.id })}>
                  <Row gap={10} style={DASHED()}>
                    <Icon name="plus" size={17} color={C.ghost} />
                    <T size={14.5} weight={600} color={C.ghost}>
                      Add an item
                    </T>
                  </Row>
                </Tap>
              </View>
            ) : null}
          </View>
        );
      })}

      <Tap onPress={() => setEdit({ kind: 'new-list' })}>
        <Row gap={10} style={[DASHED(), { marginTop: 22, padding: 18 }]}>
          <Icon name="plus" size={18} color={C.textMid} />
          <T size={15} weight={700} color={C.textMid}>
            New checklist
          </T>
        </Row>
      </Tap>

      <MenuSheet
        visible={!!menu}
        title={item ? item.title : group?.title}
        onClose={() => setMenu(null)}
        actions={
          menu && item
            ? [
                {
                  key: 'rename',
                  label: 'Rename item',
                  icon: 'pencil',
                  onPress: () =>
                    setEdit({
                      kind: 'rename-item',
                      groupId: menu.groupId,
                      itemId: item.id,
                      title: item.title,
                    }),
                },
                {
                  key: 'delete',
                  label: 'Remove item',
                  icon: 'x',
                  danger: true,
                  onPress: () => removeChecklistItem(menu.groupId, item.id),
                },
              ]
            : menu && group
              ? [
                  {
                    key: 'add',
                    label: 'Add an item',
                    icon: 'plus',
                    onPress: () => setEdit({ kind: 'new-item', groupId: menu.groupId }),
                  },
                  {
                    key: 'rename',
                    label: 'Rename list',
                    icon: 'pencil',
                    onPress: () =>
                      setEdit({
                        kind: 'rename-list',
                        groupId: menu.groupId,
                        title: group.title,
                      }),
                  },
                  {
                    key: 'reset',
                    label: 'Untick everything',
                    icon: 'refresh',
                    onPress: () => resetChecklist(menu.groupId),
                  },
                  {
                    key: 'delete',
                    label: 'Delete list',
                    icon: 'trash',
                    danger: true,
                    onPress: () => removeChecklist(menu.groupId),
                  },
                ]
              : []
        }
      />

      <Prompt
        visible={edit?.kind === 'new-list'}
        title="New checklist"
        placeholder="Weekend bag"
        confirm="Create"
        autoClose={false}
        onClose={() => setEdit(null)}
        onSubmit={(v) => {
          // A list you just named is a list you are about to fill, so the
          // composer moves straight on rather than closing onto an empty one.
          setEdit({ kind: 'new-item', groupId: addChecklist(v) });
        }}
      />
      <Prompt
        visible={edit?.kind === 'rename-list'}
        title="Rename checklist"
        initial={edit?.kind === 'rename-list' ? edit.title : ''}
        onClose={() => setEdit(null)}
        onSubmit={(v) => edit?.kind === 'rename-list' && renameChecklist(edit.groupId, v)}
      />
      <Prompt
        visible={edit?.kind === 'new-item'}
        title="Add an item"
        placeholder="Passport"
        confirm="Add"
        // Stays open on the same list: nobody adds exactly one thing to a
        // packing list, and reopening the dialog per item is the entire
        // friction budget for the feature.
        autoClose={false}
        onClose={() => setEdit(null)}
        onSubmit={(v) => edit?.kind === 'new-item' && addChecklistItem(edit.groupId, v)}
      />
      <Prompt
        visible={edit?.kind === 'rename-item'}
        title="Rename item"
        initial={edit?.kind === 'rename-item' ? edit.title : ''}
        onClose={() => setEdit(null)}
        onSubmit={(v) =>
          edit?.kind === 'rename-item' && renameChecklistItem(edit.groupId, edit.itemId, v)
        }
      />
    </>
  );
}

/* ── 2.4 add sheet ────────────────────────────────────────────────── */

const ADD_OPTIONS: {
  key: 'routine' | 'checklist' | 'timer' | 'template';
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
  { key: 'template', icon: 'compass', title: 'Start from a template', sub: 'Browse the library', go: '/(tabs)/explore' },
];

function AddSheet({
  visible,
  onClose,
  onNewChecklist,
}: {
  visible: boolean;
  onClose: () => void;
  onNewChecklist: () => void;
}) {
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
                else onNewChecklist();
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

/** Quick jump behind the grid button — every routine and list in one place. */
function JumpSheet({
  visible,
  onClose,
  onChecklist,
}: {
  visible: boolean;
  onClose: () => void;
  onChecklist: () => void;
}) {
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
            <Grad colors={G.card} style={[JUMP, rowSkin()]}>
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
        {/* These were drawn but not wired — the one row on the "Jump to" sheet
            that did not jump anywhere. There is no per-list screen, so they
            land on the checklist tab. */}
        {state.checklists.map((c) => (
          <Tap
            key={c.id}
            onPress={() => {
              onClose();
              onChecklist();
            }}
          >
            <Grad colors={G.card} style={[JUMP, rowSkin()]}>
              <Icon name="check" size={20} color={C.textMid} />
              <T size={16} weight={700} style={{ flex: 1 }}>
                {c.title}
              </T>
              <T size={13} weight={500} color={C.muted}>
                {c.items.filter((i) => i.done).length}/{c.items.length}
              </T>
            </Grad>
          </Tap>
        ))}
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
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];
const inWords = (n: number) => WORDS[n] ?? String(n);

/** The board's second line, with something to say before there is a streak. */
function streakLine(streak: number) {
  if (streak <= 0) return "Today's a good place to start.";
  if (streak === 1) return 'One day and counting.';
  return `${inWords(streak)} days and counting.`;
}

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

const VIEW_TOGGLE = () => ({
  flexDirection: 'row' as const,
  padding: 4,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: C.border,
});

const VIEW_ITEM = {
  width: 44,
  height: 34,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/** The dashed "add one of these" affordance, shared by items and lists. */
const DASHED = () => ({
  padding: 15,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: C.borderStrong,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
});

const CHECK_ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 16,
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
