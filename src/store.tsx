/**
 * Single app store — React context over AsyncStorage.
 *
 * On first launch it seeds the sample account from ./demo, but only when the
 * build asks for it; otherwise it starts empty. Nothing in here holds a
 * pre-computed streak or completion rate any more — those are derived from
 * `sessions` in ./analytics, which is the only place history is interpreted.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHapticsEnabled } from './haptics';
import { AccentKey, isAccentKey } from './tokens';
import {
  BackupSettings,
  DEFAULT_BACKUP_SETTINGS,
  normalizeBackupSettings,
} from './backup/settings';
import { STATE_KEY } from './storageKeys';
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
  ChecklistGroup,
  FIRST_ROUTINE_TASKS,
  NoteEntry,
  Routine,
  Session,
  Task,
  Template,
  totalMinutes,
} from './data';
import { dayKey, startOfDay, streakFor as deriveStreak } from './analytics';
import { DEMO_SEED, buildDemoAccount } from './demo';

const KEY = STATE_KEY;

export type Settings = {
  language: string;
  theme: 'Light' | 'Dark' | 'System';
  /** v2 accent preset — one of ACCENT_KEYS. Persisted with the account. */
  accent: AccentKey;
  appIcon: string;
  timeFormat12: boolean;
  weekStart: 'Sun' | 'Mon';
  endDayAt: number;
  haptics: boolean;
  /**
   * Whether to post a reminder before each routine. Off until the user says
   * yes *and* Android grants the permission — see src/alarms.ts, which treats
   * this as the user's intent and the OS grant as the separate veto.
   */
  alarms: boolean;
  /** How many minutes before the start time the reminder fires. */
  alarmLead: number;
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
  /** Google Drive sync preferences. See src/backup/settings.ts. */
  backup: BackupSettings;
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
  settings: Settings;
};

/**
 * A fresh account. The demo history is generated at call time rather than held
 * in a module constant, because "twelve days ending yesterday" has to be
 * relative to the day the app is actually opened.
 */
const freshState = (): State => {
  const demo = buildDemoAccount();
  return {
    onboarded: false,
    profile: {
      name: 'Prashant',
      // The board's persona line, and it states a figure: "13 days into the
      // morning routine". True of the sample account, a fabrication on a real
      // install — a fresh account claimed thirteen days it had never run. It
      // belongs to the demo, so it ships with the demo.
      intro: DEMO_SEED ? 'Building slowly. 13 days into the morning routine.' : '',
      gender: 'Prefer not to say',
      age: '30–34',
      intents: ['doing', 'schedule', 'track', 'energy'],
      struggles: [],
      wake: 8 * 60,
      sleep: 22 * 60,
    },
    routines: demo.routines,
    checklists: demo.checklists,
    notes: demo.notes,
    sessions: demo.sessions,
    savedTemplates: [],
    settings: defaultSettings(),
  };
};

const defaultSettings = (): Settings => ({
  language: 'English',
  theme: 'System',
  accent: 'ember',
  appIcon: 'default',
  timeFormat12: true,
  weekStart: 'Sun',
  endDayAt: 3 * 60,
  haptics: true,
  alarms: false,
  alarmLead: 5,
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
  backup: DEFAULT_BACKUP_SETTINGS,
});

type Ctx = {
  state: State;
  ready: boolean;
  /** Consecutive scheduled days ending today, derived from `sessions`. */
  streakFor: (routineId: string) => number;
  routine: (id: string) => Routine | undefined;
  completedToday: (routineId: string) => Session | undefined;
  set: (fn: (draft: State) => void) => void;
  /** Swap the whole state at once — what a restore does. */
  replaceState: (next: State) => void;
  finishRun: (s: Omit<Session, 'id' | 'day'>) => void;
  toggleChecklistItem: (groupId: string, itemId: string) => void;
  addChecklistItem: (groupId: string, title: string) => void;
  removeChecklistItem: (groupId: string, itemId: string) => void;
  renameChecklistItem: (groupId: string, itemId: string, title: string) => void;
  /** Create an empty list and hand back its id, so the caller can focus it. */
  addChecklist: (title: string) => string;
  renameChecklist: (groupId: string, title: string) => void;
  removeChecklist: (groupId: string) => void;
  /** Untick everything in one list — the point of a reusable packing list. */
  resetChecklist: (groupId: string) => void;
  /** A blank routine at the given time. Returns its id. */
  addRoutine: (name: string, start: number, days: number[]) => string;
  updateRoutine: (routineId: string, patch: Partial<Omit<Routine, 'id' | 'tasks'>>) => void;
  removeRoutine: (routineId: string) => void;
  addRoutineFromTemplate: (tpl: Template) => string;
  addTasksToRoutine: (routineId: string, tasks: Task[]) => void;
  updateTask: (routineId: string, taskId: string, patch: Partial<Omit<Task, 'id'>>) => void;
  removeTask: (routineId: string, taskId: string) => void;
  moveTask: (routineId: string, taskId: string, dir: -1 | 1) => void;
  addNote: (routineId: string, body: string) => void;
  toggleSaved: (templateId: string) => void;
  /**
   * Close onboarding. Pass the reviewed task list if the user was shown one.
   * Lives here rather than in a screen because more than one screen can be the
   * last step, and whichever it is has to leave the user with a routine.
   */
  finishOnboarding: (reviewed?: Task[]) => void;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

/**
 * The device's own calendar day. This was `toISOString().slice(0, 10)` — UTC —
 * which filed a 9:30pm Wind down in the Americas under tomorrow, so the run
 * that extended a streak was the run that broke it.
 */
const today = () => dayKey(startOfDay(new Date()));

/**
 * Ids only have to be unique within one account, and everything the user
 * creates is created one tap at a time — but two items added inside the same
 * millisecond used to collide, which React renders as a duplicate-key warning
 * and a row that ticks its twin. The counter removes that.
 */
let seq = 0;
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(freshState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<State>;
          setState((s) => {
            const raw = (saved.settings ?? {}) as Partial<Settings> & { backupOn?: boolean };
            const settings = { ...s.settings, ...raw };
            // Caches written before the accent existed, or hand-edited ones.
            if (!isAccentKey(settings.accent)) settings.accent = 'ember';
            // `backupOn` was the pre-Drive boolean; carry it into the object.
            settings.backup = normalizeBackupSettings(raw.backup, raw.backupOn);
            return {
              ...s,
              ...saved,
              settings,
              profile: { ...s.profile, ...(saved.profile ?? {}) },
            };
          });
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
      replaceState: (next) =>
        // Restores can arrive from an older build, so the same repairs the
        // hydration path applies have to run here too.
        setState((s) => {
          const settings = { ...s.settings, ...(next.settings ?? {}) };
          if (!isAccentKey(settings.accent)) settings.accent = 'ember';
          settings.backup = normalizeBackupSettings(settings.backup);
          return { ...s, ...next, settings, profile: { ...s.profile, ...(next.profile ?? {}) } };
        }),
      streakFor: (routineId) => deriveStreak(routine(routineId), state.sessions),
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
          g?.items.push({ id: uid('c'), title, done: false });
        }),
      removeChecklistItem: (groupId, itemId) =>
        set((d) => {
          const g = d.checklists.find((x) => x.id === groupId);
          if (g) g.items = g.items.filter((i) => i.id !== itemId);
        }),
      renameChecklistItem: (groupId, itemId, title) =>
        set((d) => {
          const it = d.checklists.find((x) => x.id === groupId)?.items.find((i) => i.id === itemId);
          if (it) it.title = title;
        }),
      addChecklist: (title) => {
        const id = uid('list-');
        set((d) => {
          d.checklists.push({ id, title, items: [] });
        });
        return id;
      },
      renameChecklist: (groupId, title) =>
        set((d) => {
          const g = d.checklists.find((x) => x.id === groupId);
          if (g) g.title = title;
        }),
      removeChecklist: (groupId) =>
        set((d) => {
          d.checklists = d.checklists.filter((x) => x.id !== groupId);
        }),
      resetChecklist: (groupId) =>
        set((d) => {
          d.checklists.find((x) => x.id === groupId)?.items.forEach((i) => {
            i.done = false;
          });
        }),
      addRoutine: (name, start, days) => {
        const id = uid('r-');
        set((d) => {
          d.routines.push({ id, name, start, days, tasks: [] });
        });
        return id;
      },
      updateRoutine: (routineId, patch) =>
        set((d) => {
          const r = d.routines.find((x) => x.id === routineId);
          if (r) Object.assign(r, patch);
        }),
      removeRoutine: (routineId) =>
        set((d) => {
          d.routines = d.routines.filter((r) => r.id !== routineId);
          // Its history would otherwise sit in the analytics forever, counted
          // against a routine the user can no longer see or run.
          d.sessions = d.sessions.filter((s) => s.routineId !== routineId);
          d.notes = d.notes.filter((n) => n.routineId !== routineId);
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
          });
        });
        return id;
      },
      addTasksToRoutine: (routineId, tasks) =>
        set((d) => {
          const r = d.routines.find((x) => x.id === routineId);
          if (!r) return;
          tasks.forEach((t) => r.tasks.push({ ...t, id: uid(`${routineId}-add-`) }));
        }),
      updateTask: (routineId, taskId, patch) =>
        set((d) => {
          const t = d.routines.find((x) => x.id === routineId)?.tasks.find((x) => x.id === taskId);
          if (t) Object.assign(t, patch);
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
      /**
       * Onboarding ends by handing the user a routine, not just a flag.
       *
       * The morning routine is whichever one runs earliest, not a fixed id —
       * the sample account's ids are prefixed and a real one has none of these.
       * When there is no routine at all (a build with `demoSeed` off) the first
       * one is created here; without that, onboarding walked people through
       * "we've prepared your first routine" and left them on an empty Home.
       *
       * `reviewed` is the list from 1.11 when that screen was part of the flow.
       * Omitted, nobody edited anything, so an existing routine keeps its own
       * tasks and the template is only used to create.
       */
      finishOnboarding: (reviewed) =>
        set((d) => {
          d.onboarded = true;
          const start = d.profile.wake;
          const morning = d.routines.slice().sort((a, b) => a.start - b.start)[0];
          if (morning) {
            morning.start = start;
            if (reviewed) morning.tasks = reviewed.map((t) => ({ ...t }));
            return;
          }
          const id = `first-${Date.now().toString(36)}`;
          d.routines.push({
            id,
            name: 'Morning routine',
            start,
            days: [1, 2, 3, 4, 5],
            tasks: (reviewed ?? FIRST_ROUTINE_TASKS).map((t, i) => ({ ...t, id: `${id}-${i}` })),
          });
        }),
      reset: () => setState(freshState()),
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
