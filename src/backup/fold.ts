/**
 * The backup format's pure half: its shape, and the folds over it.
 *
 * Nothing here imports React Native or an Expo module, which is deliberate —
 * this is the code where a mistake silently loses someone's data, so it has to
 * be runnable outside a device. `scripts/check-backup.mjs` exercises it.
 * The platform-facing half (hashing, device metadata, parsing) is archive.ts.
 */
import type { State } from '../store';

export const ARCHIVE_FORMAT = 'productively.backup';

/**
 * Bump when the shape of `data` changes in a way older readers cannot handle,
 * and add a step to `MIGRATIONS` in archive.ts.
 */
export const ARCHIVE_VERSION = 1;

/** Parts a backup may deliberately leave out, at the user's request. */
export type OmittedPart = 'notes';

export type ArchiveSummary = {
  routines: number;
  tasks: number;
  sessions: number;
  notes: number;
  checklists: number;
  checklistItems: number;
  /** Distinct days with a recorded session — the "history" figure. */
  days: number;
};

export type Archive = {
  format: typeof ARCHIVE_FORMAT;
  version: number;
  createdAt: string;
  app: { name: string; version: string; platform: string };
  device: string | null;
  omitted: OmittedPart[];
  /** SHA-256 over the canonical form of `data`. */
  checksum: string;
  summary: ArchiveSummary;
  data: State;
};

/**
 * JSON with object keys sorted, so two states that differ only in key order
 * hash the same. Without this a checksum would flag harmless re-serialisation.
 */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(',');
  return `{${body}}`;
}

export function summarize(state: State): ArchiveSummary {
  const routines = state.routines ?? [];
  const checklists = state.checklists ?? [];
  const sessions = state.sessions ?? [];
  return {
    routines: routines.length,
    tasks: routines.reduce((n, r) => n + (r.tasks?.length ?? 0), 0),
    sessions: sessions.length,
    notes: (state.notes ?? []).length,
    checklists: checklists.length,
    checklistItems: checklists.reduce((n, g) => n + (g.items?.length ?? 0), 0),
    days: new Set(sessions.map((s) => s.day)).size,
  };
}

/** Does this object plausibly hold an app state? The bar for trusting a file. */
export function looksLikeState(v: unknown): v is State {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<State>;
  return Array.isArray(s.routines) && !!s.profile && typeof s.profile === 'object';
}

/** `Productively-backup-2026-08-10-0914.json` — sorts chronologically by name. */
export function archiveFileName(at: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}-${p(
    at.getHours()
  )}${p(at.getMinutes())}`;
  return `Productively-backup-${stamp}.json`;
}

/**
 * Fold an archive over the state that is already on the device.
 *
 * `replace` is the honest restore: the backup wins outright. `merge` keeps
 * everything local and adds only what the device has never seen — the right
 * choice when importing a friend's routines or a partial export.
 */
export function applyArchive(
  current: State,
  archive: Archive,
  mode: 'replace' | 'merge'
): State {
  const incoming = archive.data;

  if (mode === 'replace') {
    // A backup that deliberately skipped a part must not delete it here.
    const notes = archive.omitted.includes('notes') ? current.notes : incoming.notes;
    return { ...current, ...incoming, notes, onboarded: true };
  }

  const byId = <T extends { id: string }>(a: T[] = [], b: T[] = []) => {
    const seen = new Set(a.map((x) => x.id));
    return [...a, ...b.filter((x) => !seen.has(x.id))];
  };

  return {
    ...current,
    routines: byId(current.routines, incoming.routines),
    checklists: byId(current.checklists, incoming.checklists),
    notes: byId(current.notes, incoming.notes),
    sessions: byId(current.sessions, incoming.sessions),
    savedTemplates: Array.from(
      new Set([...(current.savedTemplates ?? []), ...(incoming.savedTemplates ?? [])])
    ),
    onboarded: true,
  };
}
