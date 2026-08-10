/**
 * The user's backup preferences — the part that belongs with the account and
 * rides along in the backup itself. Runtime bookkeeping (when we last ran, how
 * big it was) lives in `storage.ts` instead, so a background run can update it
 * without going through React.
 *
 * Kept free of any Drive or network import so the store can read it cheaply.
 */

export type BackupFrequency = 'manual' | 'daily' | 'weekly' | 'monthly';
export type BackupNetwork = 'wifi' | 'any';

export type BackupSettings = {
  /** Master switch for Google Drive sync. Local export works regardless. */
  enabled: boolean;
  frequency: BackupFrequency;
  network: BackupNetwork;
  /** Journal notes are the bulkiest and most personal part; opt out of them. */
  includeNotes: boolean;
};

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: 'daily',
  network: 'wifi',
  includeNotes: true,
};

export const FREQUENCIES: BackupFrequency[] = ['manual', 'daily', 'weekly', 'monthly'];

export const FREQUENCY_LABEL: Record<BackupFrequency, string> = {
  manual: 'Only when I tap',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const DAY = 24 * 60 * 60 * 1000;

/** How stale a backup may get before the engine runs one unprompted. */
export const FREQUENCY_MS: Record<BackupFrequency, number | null> = {
  manual: null,
  daily: DAY,
  weekly: 7 * DAY,
  monthly: 30 * DAY,
};

export const NETWORK_LABEL: Record<BackupNetwork, string> = {
  wifi: 'Wi-Fi only',
  any: 'Wi-Fi or cellular',
};

/**
 * Has enough time passed since the last successful backup?
 *
 * Takes the timestamp rather than the meta record so it stays free of any
 * storage import — this is the one gate that decides whether an unattended
 * run does anything, and it is worth being able to test on its own.
 */
export function isDue(
  lastBackupAt: number | null,
  frequency: BackupFrequency,
  now = Date.now()
): boolean {
  const every = FREQUENCY_MS[frequency];
  if (every === null) return false;
  if (lastBackupAt === null) return true;
  return now - lastBackupAt >= every;
}

const isFreq = (v: unknown): v is BackupFrequency =>
  typeof v === 'string' && (FREQUENCIES as string[]).includes(v);

/**
 * Repair a persisted (or hand-edited, or restored-from-an-older-build) value.
 * `legacyOn` carries the old boolean `backupOn` flag forward the first time a
 * cache written before this screen existed is hydrated.
 */
export function normalizeBackupSettings(raw: unknown, legacyOn?: boolean): BackupSettings {
  const v = (raw ?? {}) as Partial<BackupSettings>;
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : !!legacyOn,
    frequency: isFreq(v.frequency) ? v.frequency : DEFAULT_BACKUP_SETTINGS.frequency,
    network: v.network === 'any' ? 'any' : 'wifi',
    includeNotes: v.includeNotes !== false,
  };
}
