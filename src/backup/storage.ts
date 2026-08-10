/**
 * Reading and writing the pieces of the backup system that live outside React.
 *
 * The engine has to work with no provider mounted — a background wake-up has no
 * component tree — so app state, backup bookkeeping and OAuth tokens are all
 * reached through plain async functions here rather than through context.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { BACKUP_META_KEY, DRIVE_TOKEN_KEY, STATE_KEY } from '../storageKeys';
import type { State } from '../store';

/* ── app state ────────────────────────────────────────────────────── */

/**
 * The state as last persisted by the store. Returns null before the first
 * write, which is also the signal that there is nothing worth backing up.
 */
export async function readState(): Promise<State | null> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

/* ── backup bookkeeping ───────────────────────────────────────────── */

export type BackupAccount = {
  email: string;
  name: string | null;
  picture: string | null;
};

export type BackupMeta = {
  /** Last run that actually produced a file, ms since epoch. */
  lastBackupAt: number | null;
  /** Last run of any outcome — stops a failing backup retrying in a loop. */
  lastAttemptAt: number | null;
  lastSize: number | null;
  lastError: string | null;
  /** Drive file id of the most recent backup, for the "last backup" row. */
  lastFileId: string | null;
  account: BackupAccount | null;
};

export const EMPTY_META: BackupMeta = {
  lastBackupAt: null,
  lastAttemptAt: null,
  lastSize: null,
  lastError: null,
  lastFileId: null,
  account: null,
};

export async function readMeta(): Promise<BackupMeta> {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_META_KEY);
    return raw ? { ...EMPTY_META, ...(JSON.parse(raw) as Partial<BackupMeta>) } : { ...EMPTY_META };
  } catch {
    return { ...EMPTY_META };
  }
}

export async function writeMeta(patch: Partial<BackupMeta>): Promise<BackupMeta> {
  const next = { ...(await readMeta()), ...patch };
  await AsyncStorage.setItem(BACKUP_META_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export async function clearMeta(): Promise<void> {
  await AsyncStorage.removeItem(BACKUP_META_KEY).catch(() => {});
}

/* ── OAuth tokens ─────────────────────────────────────────────────── */

export type Tokens = {
  accessToken: string;
  refreshToken: string | null;
  /** Absolute expiry, ms since epoch. */
  expiresAt: number;
  scope: string | null;
};

/**
 * Tokens go to the Keychain / Keystore, never to AsyncStorage — a refresh
 * token is a long-lived credential for the user's Drive. SecureStore rejects
 * oversized values on some iOS releases, so we keep the record to the three
 * fields we actually need and never store the id_token.
 */
export async function readTokens(): Promise<Tokens | null> {
  try {
    const raw = await SecureStore.getItemAsync(DRIVE_TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export async function writeTokens(t: Tokens): Promise<void> {
  await SecureStore.setItemAsync(DRIVE_TOKEN_KEY, JSON.stringify(t), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(DRIVE_TOKEN_KEY).catch(() => {});
}
