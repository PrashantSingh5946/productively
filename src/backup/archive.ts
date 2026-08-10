/**
 * The backup file format — the half that needs the platform.
 *
 * One archive is a self-describing JSON envelope: a header saying what wrote
 * it, a checksum over the payload, a summary the UI can show before the user
 * commits to a restore, and the state itself. Everything that reads a backup —
 * local import, Google Drive restore — goes through `parseArchive`, so there is
 * exactly one place that decides whether a file is trustworthy.
 *
 * The shape and the folds over it live in ./fold, which stays importable
 * outside a device so the risky logic can be tested.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import type { State } from '../store';
import {
  ARCHIVE_FORMAT,
  ARCHIVE_VERSION,
  Archive,
  OmittedPart,
  canonical,
  looksLikeState,
  summarize,
} from './fold';

export {
  ARCHIVE_FORMAT,
  ARCHIVE_VERSION,
  applyArchive,
  archiveFileName,
  summarize,
} from './fold';
export type { Archive, ArchiveSummary, OmittedPart } from './fold';

export type ParseResult =
  | { ok: true; archive: Archive; tampered: boolean }
  | { ok: false; reason: string };

export async function checksumOf(data: unknown): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical(data), {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

/* ── building ─────────────────────────────────────────────────────── */

export async function buildArchive(
  state: State,
  opts: { omit?: OmittedPart[] } = {}
): Promise<Archive> {
  const omitted = opts.omit ?? [];
  const data: State = omitted.includes('notes') ? { ...state, notes: [] } : state;

  return {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    createdAt: new Date().toISOString(),
    app: {
      name: 'Productively',
      version: Constants.expoConfig?.version ?? '0.0.0',
      platform: Platform.OS,
    },
    device: Constants.deviceName ?? null,
    omitted,
    checksum: await checksumOf(data),
    summary: summarize(data),
    data,
  };
}

/** Pretty-printed so a curious user opening the file can actually read it. */
export function serializeArchive(a: Archive): string {
  return JSON.stringify(a, null, 2);
}

/* ── reading ──────────────────────────────────────────────────────── */

/** Version upgrades, applied in order. Each takes the previous `data` shape. */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  // Nothing yet — v1 is the first envelope. Pre-format exports are handled by
  // the `legacy` path below rather than by a numbered migration.
};

/**
 * Turn arbitrary file text into a trusted archive, or a reason it is not one.
 *
 * A checksum mismatch is reported rather than fatal: a hand-edited backup is
 * still restorable, but the caller should warn before overwriting anything.
 */
export async function parseArchive(text: string): Promise<ParseResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That file is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'That file does not contain a backup.' };
  }

  const env = raw as Partial<Archive> & Record<string, unknown>;

  // A legacy export: no envelope, just the state fields at the top level.
  if (env.format !== ARCHIVE_FORMAT) {
    if (looksLikeState(raw)) return legacy(raw);
    return { ok: false, reason: 'That file was not written by Productively.' };
  }

  const version = typeof env.version === 'number' ? env.version : 0;
  if (version > ARCHIVE_VERSION) {
    return {
      ok: false,
      reason: 'That backup was made by a newer version of Productively. Update the app first.',
    };
  }

  let data = env.data as Record<string, unknown> | undefined;
  if (!looksLikeState(data)) return { ok: false, reason: 'That backup is missing its data.' };

  for (let v = version; v < ARCHIVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (step) data = step(data as unknown as Record<string, unknown>) as unknown as State;
  }

  const state = data as State;
  const tampered = env.checksum ? (await checksumOf(state)) !== env.checksum : true;

  return {
    ok: true,
    tampered,
    archive: {
      format: ARCHIVE_FORMAT,
      version: ARCHIVE_VERSION,
      createdAt: typeof env.createdAt === 'string' ? env.createdAt : new Date().toISOString(),
      app: (env.app as Archive['app']) ?? { name: 'Productively', version: '?', platform: '?' },
      device: (env.device as string | null) ?? null,
      omitted: Array.isArray(env.omitted) ? (env.omitted as OmittedPart[]) : [],
      checksum: (env.checksum as string) ?? '',
      summary: summarize(state),
      data: state,
    },
  };
}

/** Wrap a pre-format export so the rest of the app sees one shape. */
function legacy(state: State): ParseResult {
  return {
    ok: true,
    tampered: false,
    archive: {
      format: ARCHIVE_FORMAT,
      version: ARCHIVE_VERSION,
      createdAt: new Date().toISOString(),
      app: { name: 'Productively', version: 'legacy', platform: '?' },
      device: null,
      omitted: [],
      checksum: '',
      summary: summarize(state),
      data: state,
    },
  };
}
