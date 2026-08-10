/**
 * A very small Google Drive client — only the calls a backup needs.
 *
 * Everything lands in `appDataFolder`, Drive's per-app hidden space. The user
 * cannot see these files in their Drive, no other app can read them, and the
 * scope we hold gives us no access to anything else they own.
 */
import { accessToken } from './auth';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export type DriveFile = {
  id: string;
  name: string;
  size: number;
  modifiedAt: number;
  /** Small strings we tuck alongside the file so the list can be described. */
  props: Record<string, string>;
};

export type DriveQuota = { limit: number | null; usage: number | null };

async function authed(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await driveError(res);
  return res;
}

async function driveError(res: Response): Promise<Error> {
  let detail = '';
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    detail = j.error?.message ?? '';
  } catch {
    // A non-JSON body (a proxy page, an HTML error) tells us nothing useful.
  }
  if (res.status === 401 || res.status === 403) {
    return new Error(detail || 'Google refused the request. Reconnect the account.');
  }
  if (res.status === 507 || /quota/i.test(detail)) {
    return new Error('Your Google Drive is full.');
  }
  return new Error(detail || `Google Drive error ${res.status}.`);
}

function toFile(f: Record<string, unknown>): DriveFile {
  return {
    id: String(f.id),
    name: String(f.name ?? ''),
    size: Number(f.size ?? 0),
    modifiedAt: Date.parse(String(f.modifiedTime ?? '')) || 0,
    props: (f.appProperties as Record<string, string>) ?? {},
  };
}

const FIELDS = 'files(id,name,size,modifiedTime,appProperties)';

/** Newest first — the order the restore list wants to show them in. */
export async function listBackups(): Promise<DriveFile[]> {
  const url =
    `${API}/files?spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=25` +
    `&fields=${encodeURIComponent(FIELDS)}`;
  const res = await authed(url);
  const j = (await res.json()) as { files?: Record<string, unknown>[] };
  return (j.files ?? []).map(toFile);
}

/**
 * Multipart upload: one request carrying the metadata and the body together.
 * Backups are tens of kilobytes of JSON, so a resumable upload would be all
 * ceremony and no benefit.
 */
export async function uploadBackup(
  name: string,
  contents: string,
  props: Record<string, string> = {}
): Promise<DriveFile> {
  const boundary = `productively-${Math.random().toString(36).slice(2)}`;
  const metadata = {
    name,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
    appProperties: props,
  };

  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${contents}\r\n` +
    `--${boundary}--`;

  const res = await authed(
    `${UPLOAD}/files?uploadType=multipart&fields=${encodeURIComponent(
      'id,name,size,modifiedTime,appProperties'
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  return toFile((await res.json()) as Record<string, unknown>);
}

export async function downloadBackup(fileId: string): Promise<string> {
  const res = await authed(`${API}/files/${encodeURIComponent(fileId)}?alt=media`);
  return res.text();
}

export async function deleteBackup(fileId: string): Promise<void> {
  await authed(`${API}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
}

/**
 * Keep the newest `keep` backups and drop the rest. A rolling window means a
 * bad state that got backed up is not the only copy the user has left.
 */
export async function pruneBackups(keep: number): Promise<number> {
  const files = await listBackups();
  const stale = files.slice(keep);
  for (const f of stale) await deleteBackup(f.id).catch(() => {});
  return stale.length;
}

export async function quota(): Promise<DriveQuota> {
  const res = await authed(`${API}/about?fields=storageQuota`);
  const j = (await res.json()) as { storageQuota?: { limit?: string; usage?: string } };
  const q = j.storageQuota ?? {};
  return {
    limit: q.limit ? Number(q.limit) : null,
    usage: q.usage ? Number(q.usage) : null,
  };
}
