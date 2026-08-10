/**
 * Export to, and import from, a file the user owns.
 *
 * This is the escape hatch that does not depend on any account: a plain JSON
 * file handed to the system share sheet, and the same file read back later.
 * It also works when Drive is unconfigured, which is why the Drive screens
 * always keep a link to it.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { Archive, ParseResult, archiveFileName, parseArchive, serializeArchive } from './archive';

/** Exports are staged here so repeat exports do not pile up in documents. */
const EXPORT_DIR = 'exports';

function exportDir(): Directory {
  const dir = new Directory(Paths.cache, EXPORT_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export type WrittenFile = { uri: string; name: string; size: number };

/** Write an archive to disk and return where it landed. */
export function writeArchiveFile(archive: Archive): WrittenFile {
  const name = archiveFileName(new Date(archive.createdAt));
  const file = new File(exportDir(), name);
  if (file.exists) file.delete();
  file.create();
  file.write(serializeArchive(archive));
  return { uri: file.uri, name, size: file.size ?? 0 };
}

/**
 * Hand the file to the OS share sheet — Files, AirDrop, Drive, mail, whatever
 * the user has. Returns false when the platform has no share sheet at all.
 */
export async function shareArchiveFile(file: WrittenFile, title = 'Productively backup') {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: title,
  });
  return true;
}

export type PickResult = ParseResult | { ok: false; reason: null };

/**
 * Let the user choose a backup file and parse it.
 *
 * A cancelled picker comes back as `{ ok: false, reason: null }` — a null
 * reason means "nothing went wrong, the user just changed their mind", so the
 * caller can tell that apart from a genuine bad-file error.
 */
export async function pickArchiveFile(): Promise<PickResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    // Some providers hand back JSON as octet-stream, so the filter stays wide
    // and `parseArchive` does the real gatekeeping.
    type: ['application/json', 'text/plain', 'public.json', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (picked.canceled || !picked.assets?.length) return { ok: false, reason: null };

  const asset = picked.assets[0];
  let text: string;
  try {
    text = await new File(asset.uri).text();
  } catch {
    return { ok: false, reason: 'That file could not be read.' };
  }
  return parseArchive(text);
}

/** Drop staged exports. Called after sharing so the cache does not grow. */
export function clearExports() {
  try {
    const dir = new Directory(Paths.cache, EXPORT_DIR);
    if (dir.exists) dir.delete();
  } catch {
    // Cache cleanup is never worth surfacing to the user.
  }
}
