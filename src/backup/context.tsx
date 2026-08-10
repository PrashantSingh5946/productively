/**
 * The React face of the backup engine.
 *
 * Holds the bits a screen needs to render — who is connected, when we last
 * ran, whether something is in flight — and owns the one piece of scheduling
 * that only the app can do: catching up on a due backup when it comes to the
 * foreground, which is what makes the feature work even on a device that never
 * grants us a background wake-up.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Archive, applyArchive, buildArchive } from './archive';
import { NeedsSignIn, fetchAccount, isSignedIn, signIn, signOut } from './auth';
import { isDriveConfigured } from './config';
import { DriveFile, deleteBackup } from './drive';
import { BackupReason, SKIP_TEXT, availableBackups, fetchBackup, runBackup } from './engine';
import { WrittenFile, clearExports, pickArchiveFile, shareArchiveFile, writeArchiveFile } from './files';
import { BackupSettings } from './settings';
import { syncBackgroundTask } from './task';
import {
  BackupAccount,
  BackupMeta,
  EMPTY_META,
  clearMeta,
  readMeta,
  writeMeta,
} from './storage';
import { useStore } from '../store';
import type { State } from '../store';

export type BackupPhase = 'idle' | 'working' | 'ok' | 'error';

export type ImportOutcome =
  | { ok: true; archive: Archive; tampered: boolean }
  | { ok: false; reason: string | null };

type Ctx = {
  /** False when this build ships without Google client ids. */
  configured: boolean;
  signedIn: boolean;
  account: BackupAccount | null;
  meta: BackupMeta;
  settings: BackupSettings;
  phase: BackupPhase;
  message: string | null;
  /** A Drive call is in flight. */
  busy: boolean;
  /** A local export is being written — a separate light, so the spinner can
   *  say what is actually happening rather than blaming Google. */
  exporting: boolean;

  update: (patch: Partial<BackupSettings>) => void;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  backupNow: () => Promise<boolean>;
  refresh: () => Promise<void>;

  list: () => Promise<DriveFile[]>;
  remove: (fileId: string) => Promise<void>;
  fetchOne: (fileId: string) => Promise<ImportOutcome>;

  exportToFile: () => Promise<WrittenFile | null>;
  importFromFile: () => Promise<ImportOutcome>;
  apply: (archive: Archive, mode: 'replace' | 'merge') => void;
};

const BackupCtx = createContext<Ctx | null>(null);

export function BackupProvider({ children }: { children: React.ReactNode }) {
  const { state, ready, set, replaceState } = useStore();
  const settings = state.settings.backup;

  const [meta, setMeta] = useState<BackupMeta>(EMPTY_META);
  const [signedIn, setSignedIn] = useState(false);
  const [phase, setPhase] = useState<BackupPhase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const busy = phase === 'working';
  const running = useRef(false);

  const refresh = useCallback(async () => {
    const next = await readMeta();
    setMeta(next);
    setSignedIn(await isSignedIn());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep the OS-level schedule in step with the switches on the settings
  // screen, including turning it off when the user disconnects.
  // Depends on the two fields that matter, not the object — `settings` is
  // rebuilt on every store write and would re-run this on every keystroke.
  useEffect(() => {
    syncBackgroundTask({ ...settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.enabled, settings.frequency]);

  // The engine reads preferences through a ref, not a closure: `settings` is a
  // fresh object after every store write, and capturing it would give `run` a
  // new identity on every keystroke — which would re-fire the effect below.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /** One place that runs the engine, so two callers can never overlap. */
  const run = useCallback(
    async (reason: BackupReason): Promise<boolean> => {
      if (running.current) return false;
      running.current = true;
      const settings = settingsRef.current;
      if (reason === 'manual') {
        setPhase('working');
        setMessage(null);
      }
      try {
        const out = await runBackup(settings, reason);
        const fresh = await readMeta();
        setMeta(fresh);

        if (!out.ok) {
          if (out.needsSignIn) setSignedIn(false);
          if (reason === 'manual') {
            setPhase('error');
            setMessage(out.error);
          }
          return false;
        }
        if (out.skipped) {
          if (reason === 'manual') {
            setPhase(out.why === 'not-due' ? 'ok' : 'error');
            setMessage(SKIP_TEXT[out.why]);
          }
          return false;
        }
        if (reason === 'manual') {
          setPhase('ok');
          setMessage(null);
        }
        return true;
      } finally {
        running.current = false;
      }
    },
    []
  );

  // The foreground catch-up. Runs once on launch and on every return from the
  // background; the engine's own gates decide whether it does anything.
  useEffect(() => {
    if (!ready || !settings.enabled) return;

    const attempt = () => {
      run('auto');
    };
    attempt();

    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') attempt();
    });
    return () => sub.remove();
  }, [ready, settings.enabled, run]);

  const value = useMemo<Ctx>(
    () => ({
      configured: isDriveConfigured(),
      signedIn,
      account: meta.account,
      meta,
      settings,
      phase,
      message,
      busy,
      exporting,

      update: (patch) =>
        set((d) => {
          d.settings.backup = { ...d.settings.backup, ...patch };
        }),

      connect: async () => {
        setPhase('working');
        setMessage(null);
        try {
          const account = await signIn();
          if (!account) {
            setPhase('idle');
            return false;
          }
          setMeta(await writeMeta({ account, lastError: null }));
          setSignedIn(true);
          set((d) => {
            d.settings.backup.enabled = true;
          });
          setPhase('ok');
          return true;
        } catch (e) {
          setPhase('error');
          setMessage(e instanceof Error ? e.message : 'Could not connect to Google.');
          return false;
        }
      },

      disconnect: async () => {
        await signOut();
        await clearMeta();
        setMeta(EMPTY_META);
        setSignedIn(false);
        setPhase('idle');
        setMessage(null);
        set((d) => {
          d.settings.backup.enabled = false;
        });
      },

      backupNow: () => run('manual'),
      refresh,

      list: availableBackups,

      remove: async (fileId) => {
        await deleteBackup(fileId);
        if (meta.lastFileId === fileId) setMeta(await writeMeta({ lastFileId: null }));
      },

      fetchOne: async (fileId) => {
        const r = await fetchBackup(fileId);
        return r.ok
          ? { ok: true, archive: r.archive, tampered: r.tampered }
          : { ok: false, reason: r.error };
      },

      exportToFile: async () => {
        setExporting(true);
        setMessage(null);
        try {
          const archive = await buildArchive(state, {
            omit: settings.includeNotes ? [] : ['notes'],
          });
          const file = writeArchiveFile(archive);
          await shareArchiveFile(file);
          return file;
        } catch (e) {
          setPhase('error');
          setMessage(e instanceof Error ? e.message : 'Could not write the export.');
          return null;
        } finally {
          setExporting(false);
          // The share sheet has already copied whatever it needed by now.
          clearExports();
        }
      },

      importFromFile: async () => {
        const r = await pickArchiveFile();
        if (!r.ok) return { ok: false, reason: r.reason };
        return { ok: true, archive: r.archive, tampered: r.tampered };
      },

      apply: (archive, mode) => {
        const next: State = applyArchive(state, archive, mode);
        replaceState(next);
      },
    }),
    [signedIn, meta, settings, phase, message, busy, exporting, set, run, refresh, state, replaceState]
  );

  return <BackupCtx.Provider value={value}>{children}</BackupCtx.Provider>;
}

export function useBackup(): Ctx {
  const v = useContext(BackupCtx);
  if (!v) throw new Error('useBackup must be used inside BackupProvider');
  return v;
}

/** Re-exported so screens do not need to reach into the engine directly. */
export { NeedsSignIn, fetchAccount };
