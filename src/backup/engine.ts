/**
 * The backup engine.
 *
 * Deliberately storage-first and React-free: every function here reads what it
 * needs from AsyncStorage and SecureStore, so the exact same code path serves
 * a button press, an app-foreground catch-up and an OS background wake-up.
 * The React layer in `context.tsx` is a thin shell over these calls.
 */
import * as Network from 'expo-network';
import { Archive, archiveFileName, buildArchive, parseArchive, serializeArchive } from './archive';
import { NeedsSignIn, NotConfigured, isSignedIn } from './auth';
import { isDriveConfigured } from './config';
import { DriveFile, downloadBackup, listBackups, pruneBackups, uploadBackup } from './drive';
import { BackupSettings, isDue } from './settings';
import { BackupMeta, readMeta, readState, writeMeta } from './storage';

export type BackupReason = 'manual' | 'auto' | 'background';

export type BackupOutcome =
  | { ok: true; skipped: false; meta: BackupMeta; file: DriveFile }
  | { ok: true; skipped: true; why: SkipReason }
  | { ok: false; error: string; needsSignIn: boolean };

export type SkipReason =
  | 'not-configured'
  | 'disabled'
  | 'not-signed-in'
  | 'not-due'
  | 'no-network'
  | 'wifi-only'
  | 'nothing-to-back-up';

export const SKIP_TEXT: Record<SkipReason, string> = {
  'not-configured': 'Google Drive backup is not set up in this build.',
  disabled: 'Back up to Drive is off.',
  'not-signed-in': 'Connect a Google account first.',
  'not-due': 'Already up to date.',
  'no-network': 'No connection right now.',
  'wifi-only': 'Waiting for Wi-Fi.',
  'nothing-to-back-up': 'Nothing to back up yet.',
};

/** How many backups the rolling window keeps in the app folder. */
export const KEEP_BACKUPS = 5;

/**
 * A failed run should not hammer Google on every foreground. Manual taps
 * ignore this — the user asked, so the user gets an attempt and an error.
 */
const RETRY_AFTER_MS = 30 * 60 * 1000;

/* ── gates ────────────────────────────────────────────────────────── */

async function networkGate(settings: BackupSettings): Promise<SkipReason | null> {
  let state: Network.NetworkState;
  try {
    state = await Network.getNetworkStateAsync();
  } catch {
    // If we cannot tell, try anyway — the upload itself will fail honestly.
    return null;
  }
  if (state.isConnected === false) return 'no-network';
  if (settings.network === 'wifi') {
    const wired =
      state.type === Network.NetworkStateType.WIFI ||
      state.type === Network.NetworkStateType.ETHERNET ||
      state.type === Network.NetworkStateType.UNKNOWN;
    if (!wired) return 'wifi-only';
  }
  return null;
}

/* ── running ──────────────────────────────────────────────────────── */

/**
 * Back up once. Unattended callers pass 'auto' or 'background' and get every
 * gate applied; 'manual' skips only the gates the user cannot see past
 * (no account, no data) and reports the rest as errors they can act on.
 */
export async function runBackup(
  settings: BackupSettings,
  reason: BackupReason = 'manual'
): Promise<BackupOutcome> {
  const manual = reason === 'manual';

  if (!isDriveConfigured()) return { ok: true, skipped: true, why: 'not-configured' };
  if (!manual && !settings.enabled) return { ok: true, skipped: true, why: 'disabled' };
  if (!(await isSignedIn())) return { ok: true, skipped: true, why: 'not-signed-in' };

  const meta = await readMeta();
  if (!manual) {
    if (!isDue(meta.lastBackupAt, settings.frequency)) {
      return { ok: true, skipped: true, why: 'not-due' };
    }
    if (meta.lastError && meta.lastAttemptAt && Date.now() - meta.lastAttemptAt < RETRY_AFTER_MS) {
      return { ok: true, skipped: true, why: 'not-due' };
    }
  }

  const blocked = await networkGate(settings);
  if (blocked) {
    if (!manual) return { ok: true, skipped: true, why: blocked };
    return { ok: false, error: SKIP_TEXT[blocked], needsSignIn: false };
  }

  const state = await readState();
  if (!state) return { ok: true, skipped: true, why: 'nothing-to-back-up' };

  await writeMeta({ lastAttemptAt: Date.now() });

  try {
    const archive = await buildArchive(state, {
      omit: settings.includeNotes ? [] : ['notes'],
    });
    const body = serializeArchive(archive);

    const file = await uploadBackup(archiveFileName(new Date(archive.createdAt)), body, {
      createdAt: archive.createdAt,
      appVersion: archive.app.version,
      routines: String(archive.summary.routines),
      sessions: String(archive.summary.sessions),
      days: String(archive.summary.days),
    });

    // Prune after a successful write, never before — losing the old copy to
    // make room for one that then fails would be the worst possible order.
    await pruneBackups(KEEP_BACKUPS).catch(() => {});

    const next = await writeMeta({
      lastBackupAt: Date.now(),
      lastSize: file.size || body.length,
      lastFileId: file.id,
      lastError: null,
    });
    return { ok: true, skipped: false, meta: next, file };
  } catch (e) {
    const needsSignIn = e instanceof NeedsSignIn || e instanceof NotConfigured;
    const error = e instanceof Error ? e.message : 'Backup failed.';
    await writeMeta({ lastError: error });
    return { ok: false, error, needsSignIn };
  }
}

/* ── restoring ────────────────────────────────────────────────────── */

export type RestoreResult =
  | { ok: true; archive: Archive; tampered: boolean }
  | { ok: false; error: string };

/**
 * Fetch and validate a backup. Applying it to the running app is the caller's
 * job — the engine never reaches into React state.
 */
export async function fetchBackup(fileId: string): Promise<RestoreResult> {
  try {
    const text = await downloadBackup(fileId);
    const parsed = await parseArchive(text);
    if (!parsed.ok) return { ok: false, error: parsed.reason };
    return { ok: true, archive: parsed.archive, tampered: parsed.tampered };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not read that backup.' };
  }
}

export async function availableBackups(): Promise<DriveFile[]> {
  if (!isDriveConfigured() || !(await isSignedIn())) return [];
  return listBackups();
}
