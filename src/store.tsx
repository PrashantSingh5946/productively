/**
 * Single app store — React context over AsyncStorage. Seeded on first launch
 * with the sample account the board describes, then mutated by the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHapticsEnabled } from './haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CHECKLISTS,
  ChecklistGroup,
  NOTES,
  NoteEntry,
  ROUTINES,
  Routine,
  Session,
  Task,
  Template,
  totalMinutes,
} from './data';

const KEY = 'productively/state/v1';

export type Settings = {
  language: string;
  theme: 'Light' | 'Dark' | 'System';
  appIcon: string;
  timeFormat12: boolean;
  weekStart: 'Sun' | 'Mon';
  endDayAt: number;
  haptics: boolean;
  statusBarTimer: boolean;
  homeView: 'list' | 'timeline';
  homeList: { startTime: boolean; repeatDays: boolean; progress: boolean; taskIcons: boolean };
  homeTimeline: { showTasks: boolean };
  timer: {
    display: 'clock' | 'target' | 'alarm';
    remainingTime: boolean;
    taskDuration: boolean;
    nextTask: boolean;
    keepScreenOn: boolean;
    landscape: boolean;
    sticky: boolean;
    summary: boolean;
    moodReview: boolean;
  };
  backupOn: boolean;
};

export type Profile = {
  name: string;
  intro: string;
  gender: string;
  age: string;
  intents: string[];
  struggles: string[];
  wake: number;
  sleep: number;
};

export type State = {
  onboarded: boolean;
  profile: Profile;
  routines: Routine[];
  checklists: ChecklistGroup[];
  notes: NoteEntry[];
  sessions: Session[];
  savedTemplates: string[];
  nudged: string[];
  settings: Settings;
};

const initial: State = {
  onboarded: false,
  profile: {
    name: 'Prashant',
    intro: 'Building slowly. 13 days into the morning routine.',
    gender: 'Prefer not to say',
    age: '30–34',
    intents: ['doing', 'schedule', 'track', 'energy'],
    struggles: [],
    wake: 8 * 60,
    sleep: 22 * 60,
  },
  routines: ROUTINES,
  checklists: CHECKLISTS,
  notes: NOTES,
  sessions: [],
  savedTemplates: [],
  nudged: [],
  settings: {
    language: 'English',
    theme: 'Light',
    appIcon: 'default',
    timeFormat12: true,
    weekStart: 'Sun',
    endDayAt: 3 * 60,
    haptics: true,
    statusBarTimer: false,
    homeView: 'list',
    homeList: { startTime: true, repeatDays: true, progress: true, taskIcons: false },
    homeTimeline: { showTasks: true },
    timer: {
      display: 'clock',
      remainingTime: true,
      taskDuration: false,
      nextTask: true,
      keepScreenOn: true,
      landscape: false,
      sticky: true,
      summary: true,
      moodReview: true,
    },
    backupOn: true,
  },
};

type Ctx = {
  state: State;
  ready: boolean;
  /** Base streak (12) plus today's morning run, matching the board's 13. */
  streakFor: (routineId: string) => number;
  routine: (id: string) => Routine | undefined;
  completedToday: (routineId: string) => Session | undefined;
  set: (fn: (draft: State) => void) => void;
  finishRun: (s: Omit<Session, 'id' | 'day'>) => void;
  toggleChecklistItem: (groupId: string, itemId: string) => void;
  addChecklistItem: (groupId: string, title: string) => void;
  addRoutineFromTemplate: (tpl: Template) => string;
  addTasksToRoutine: (routineId: string, tasks: Task[]) => void;
  removeTask: (routineId: string, taskId: string) => void;
  moveTask: (routineId: string, taskId: string, dir: -1 | 1) => void;
  addNote: (routineId: string, body: string) => void;
  toggleSaved: (templateId: string) => void;
  nudge: (friendId: string) => void;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<State>;
          setState((s) => ({
            ...s,
            ...saved,
            settings: { ...s.settings, ...(saved.settings ?? {}) },
            profile: { ...s.profile, ...(saved.profile ?? {}) },
          }));
        }
      } catch {
        // A corrupt cache should never block the app — fall back to the seed.
      } finally {
        hydrated.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  useEffect(() => {
    setHapticsEnabled(state.settings.haptics);
  }, [state.settings.haptics]);

  const set = useCallback((fn: (draft: State) => void) => {
    setState((prev) => {
      const next: State = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const routine = (id: string) => state.routines.find((r) => r.id === id);
    const completedToday = (routineId: string) =>
      state.sessions.find((s) => s.routineId === routineId && s.day === today());

    return {
      state,
      ready,
      routine,
      completedToday,
      set,
      streakFor: (routineId) => {
        const base = routine(routineId)?.streak ?? 0;
        return completedToday(routineId) ? base + 1 : base;
      },
      finishRun: (s) =>
        set((d) => {
          const day = today();
          const idx = d.sessions.findIndex(
            (x) => x.routineId === s.routineId && x.day === day
          );
          const entry: Session = { ...s, id: `${s.routineId}-${day}`, day };
          if (idx >= 0) d.sessions[idx] = entry;
          else d.sessions.push(entry);
        }),
      toggleChecklistItem: (groupId, itemId) =>
        set((d) => {
          const g = d.checklists.find((x) => x.id === groupId);
          const it = g?.items.find((x) => x.id === itemId);
          if (it) it.done = !it.done;
        }),
      addChecklistItem: (groupId, title) =>
        set((d) => {
          const g = d.checklists.find((x) => x.id === groupId);
          g?.items.push({ id: `c${Date.now()}`, title, done: false });
        }),
      addRoutineFromTemplate: (tpl) => {
        const id = `${tpl.id}-${Date.now().toString(36)}`;
        set((d) => {
          d.routines.push({
            id,
            name: tpl.name,
            start: 7 * 60,
            days: [1, 2, 3, 4, 5],
            tasks: tpl.tasks.map((t, i) => ({ ...t, id: `${id}-${i}` })),
            streak: 0,
            rate: 0,
          });
        });
        return id;
      },
      addTasksToRoutine: (routineId, tasks) =>
        set((d) => {
          const r = d.routines.find((x) => x.id === routineId);
          if (!r) return;
          tasks.forEach((t, i) =>
            r.tasks.push({ ...t, id: `${routineId}-add-${Date.now()}-${i}` })
          );
        }),
      removeTask: (routineId, taskId) =>
        set((d) => {
          const r = d.routines.find((x) => x.id === routineId);
          if (r) r.tasks = r.tasks.filter((t) => t.id !== taskId);
        }),
      moveTask: (routineId, taskId, dir) =>
        set((d) => {
          const r = d.routines.find((x) => x.id === routineId);
          if (!r) return;
          const i = r.tasks.findIndex((t) => t.id === taskId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= r.tasks.length) return;
          [r.tasks[i], r.tasks[j]] = [r.tasks[j], r.tasks[i]];
        }),
      addNote: (routineId, body) =>
        set((d) => {
          const s = d.sessions.find((x) => x.routineId === routineId && x.day === today());
          const r = d.routines.find((x) => x.id === routineId);
          const total = r ? r.tasks.length : 0;
          d.notes.unshift({
            id: `n${Date.now()}`,
            routineId,
            day: new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            durationMin: s?.durationMin ?? (r ? totalMinutes(r.tasks) : 0),
            done: s?.done ?? total,
            total: s?.total ?? total,
            ring: (s?.done ?? total) === (s?.total ?? total) ? 0 : 1,
            body,
          });
          if (s) s.note = body;
        }),
      toggleSaved: (templateId) =>
        set((d) => {
          d.savedTemplates = d.savedTemplates.includes(templateId)
            ? d.savedTemplates.filter((x) => x !== templateId)
            : [...d.savedTemplates, templateId];
        }),
      nudge: (friendId) =>
        set((d) => {
          if (!d.nudged.includes(friendId)) d.nudged.push(friendId);
        }),
      reset: () => setState(initial),
    };
  }, [state, ready, set]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

/** Convenience for the many screens that only read settings. */
export function useSettings() {
  return useStore().state.settings;
}
