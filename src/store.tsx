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
import { Accent, isAccent } from './tokens';
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
  /** A preset key or a mixed `#RRGGBB`. Persisted with the account. */
  accent: Accent;
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

/**
 * A colour the user mixed on the wheel and kept.
 *
 * The mode rides along with the hex because a colour that works on paper can
 * be muddy on ink — picking "Ocean calm" restores the pair it was saved as,
 * which is what the board's "#4EA8A0 · light" subtitle is promising.
 */
export type CustomTheme = {
  id: string;
  name: string;
  hex: string;
  mode: 'Light' | 'Dark';
};

export type State = {
  onboarded: boolean;
  profile: Profile;
  routines: Routine[];
  checklists: ChecklistGroup[];
  notes: NoteEntry[];
  sessions: Session[];
  savedTemplates: string[];
  /** Saved wheel colours, newest first. Empty until the user mixes one. */
  customThemes: CustomTheme[];
  settings: Settings;
};

/** The one routine a brand-new account starts with, at the default wake time. */
const starterRoutine = (start: number): Routine => {
  const id = `first-${Date.now().toString(36)}`;
  return {
    id,
    name: 'Morning routine',
    start,
    days: [1, 2, 3, 4, 5],
    tasks: FIRST_ROUTINE_TASKS.map((t, i) => ({ ...t, id: `${id}-${i}` })),
  };
};

/**
 * A fresh account. The demo history is generated at call time rather than held
 * in a module constant, because "twelve days ending yesterday" has to be
 * relative to the day the app is actually opened.
 */
const freshState = (): State => {
  const demo = buildDemoAccount();
  const wake = 8 * 60;
  return {
    // Nothing left to onboard. Kept on the state because restores from a v2
    // backup carry it and `fold` writes it — dropping the field would make
    // those payloads fail their shape check on the way in.
    onboarded: true,
    profile: {
      // Same rule as `intro` below: the board's persona belongs to the demo,
      // not to a stranger's fresh install. A real account was greeted as
      // "Prashant" on Today and on Profile. v2 at least had an onboarding flow
      // that could have asked; v3 opens straight into Today, so there is no
      // longer any moment where the app could learn a name it was already
      // using. Profile ▸ Edit is the one place it is set, and Profile prompts
      // for it until it is.
      name: DEMO_SEED ? 'Prashant' : '',
      // The board's persona line, and it states a figure: "13 days into the
      // morning routine". True of the sample account, a fabrication on a real
      // install — a fresh account claimed thirteen days it had never run. It
      // belongs to the demo, so it ships with the demo.
      intro: DEMO_SEED ? 'Building slowly. 13 days into the morning routine.' : '',
      gender: 'Prefer not to say',
      // Both of these are answers to questions the app no longer asks, and a
      // fabricated answer is the same bug as a fabricated name.
      age: DEMO_SEED ? '30–34' : '',
      intents: DEMO_SEED ? ['doing', 'schedule', 'track', 'energy'] : [],
      struggles: [],
      wake,
      sleep: 22 * 60,
    },
    // v2 handed the user their first routine at the end of onboarding. With
    // onboarding gone, an unseeded build opened on an empty Today and a + button
    // — the "we've prepared your first routine" promise with nothing behind it.
    // The starter routine is part of a fresh account now, not part of a flow.
    routines: demo.routines.length ? demo.routines : [starterRoutine(wake)],
    checklists: demo.checklists,
    notes: demo.notes,
    sessions: demo.sessions,
    savedTemplates: [],
    customThemes: [],
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
   * Keep a wheel colour and switch to it. Returns its id.
   *
   * Saving and applying are one action because they are one intent — the board
   * calls the button "Save as my theme", and a saved theme you then have to go
   * and select is a second step nobody asked for.
   */
  saveTheme: (name: string, hex: string, mode: 'Light' | 'Dark') => string;
  /** Forget a saved theme. The accent it set survives — see CustomTheme. */
  removeTheme: (id: string) => void;
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
            if (!isAccent(settings.accent)) settings.accent = 'ember';
            // `backupOn` was the pre-Drive boolean; carry it into the object.
            settings.backup = normalizeBackupSettings(raw.backup, raw.backupOn);
            return {
              ...s,
              ...saved,
              settings,
              // Absent on every cache written before the wheel existed, and a
              // non-array here would take out the Customize screen on launch.
              customThemes: Array.isArray(saved.customThemes) ? saved.customThemes : [],
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
          if (!isAccent(settings.accent)) settings.accent = 'ember';
          settings.backup = normalizeBackupSettings(settings.backup);
          return {
            ...s,
            ...next,
            settings,
            customThemes: Array.isArray(next.customThemes) ? next.customThemes : [],
            profile: { ...s.profile, ...(next.profile ?? {}) },
          };
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
      saveTheme: (name, hex, mode) => {
        const id = uid('th');
        set((d) => {
          d.customThemes = [{ id, name, hex, mode }, ...d.customThemes];
          d.settings.accent = hex;
          d.settings.theme = mode;
        });
        return id;
      },
      removeTheme: (id) =>
        set((d) => {
          d.customThemes = d.customThemes.filter((t) => t.id !== id);
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
