/**
 * Acceptance check for the backup logic that nothing else can catch.
 *
 * TypeScript proves the shapes line up; it says nothing about whether a merge
 * loses a routine or a "daily" backup fires twice an hour. These are the folds
 * and gates where a bug costs someone their data, so they live in modules with
 * no React Native or Expo import and get exercised here, in plain Node.
 *
 *   node scripts/check-backup.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = mkdtempSync(join(tmpdir(), 'productively-backup-'));
// Direct, not via `npx` — see the same note in check-contrast.mjs.
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    'src/backup/fold.ts',
    'src/backup/settings.ts',
    'src/backup/format.ts',
    '--ignoreConfig',
    '--outDir',
    out,
    '--module',
    'es2020',
    '--target',
    'es2020',
    '--skipLibCheck',
    // The type-only `import type { State } from '../store'` drags a .tsx into
    // the program. It is erased from the emit, but tsc still has to parse it.
    '--jsx',
    'react-jsx',
    '--strict',
    'false',
  ],
  { stdio: 'inherit' }
);

const load = async (name) =>
  import(pathToFileURL(join(out, 'backup', `${name}.js`)).href);

const fold = await load('fold');
const settings = await load('settings');
const format = await load('format');

let failures = 0;
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`  ✗ ${name}\n      expected ${e}\n      got      ${a}`);
  }
};

/* ── fixtures ─────────────────────────────────────────────────────── */

const routine = (id, tasks = 1) => ({
  id,
  name: id,
  tasks: Array.from({ length: tasks }, (_, i) => ({ id: `${id}-t${i}` })),
});

const device = {
  onboarded: true,
  profile: { name: 'Device' },
  routines: [routine('morning', 3), routine('evening', 2)],
  checklists: [{ id: 'c1', items: [{ id: 'i1' }, { id: 'i2' }] }],
  notes: [{ id: 'n1' }],
  sessions: [{ id: 's1', day: '2026-08-01' }, { id: 's2', day: '2026-08-02' }],
  savedTemplates: ['tpl-a'],
  settings: { accent: 'ember' },
};

const backup = {
  onboarded: true,
  profile: { name: 'Backup' },
  routines: [routine('morning', 9), routine('weekend', 4)],
  checklists: [{ id: 'c2', items: [{ id: 'i3' }] }],
  notes: [{ id: 'n2' }],
  sessions: [{ id: 's2', day: '2026-08-02' }, { id: 's3', day: '2026-08-03' }],
  savedTemplates: ['tpl-a', 'tpl-b'],
  settings: { accent: 'sky' },
};

const archive = (data, omitted = []) => ({
  format: fold.ARCHIVE_FORMAT,
  version: fold.ARCHIVE_VERSION,
  createdAt: '2026-08-10T09:14:00.000Z',
  app: { name: 'Productively', version: '1.4.2', platform: 'ios' },
  device: null,
  omitted,
  checksum: '',
  summary: fold.summarize(data),
  data,
});

/* ── summarize ────────────────────────────────────────────────────── */

console.log('summarize');
check('counts', fold.summarize(device), {
  routines: 2,
  tasks: 5,
  sessions: 2,
  notes: 1,
  checklists: 1,
  checklistItems: 2,
  days: 2,
});
check('distinct days, not sessions', fold.summarize({
  ...device,
  sessions: [{ id: 'a', day: '2026-08-01' }, { id: 'b', day: '2026-08-01' }],
}).days, 1);
check('survives a half-empty state', fold.summarize({ routines: [], profile: {} }).tasks, 0);

/* ── canonical form ───────────────────────────────────────────────── */

console.log('canonical');
check(
  'key order does not change the hash input',
  fold.canonical({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }),
  fold.canonical({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 })
);
check('array order does change it', fold.canonical([1, 2]) === fold.canonical([2, 1]), false);
check('undefined members are dropped', fold.canonical({ a: 1, b: undefined }), '{"a":1}');

/* ── applyArchive ─────────────────────────────────────────────────── */

console.log('applyArchive · replace');
{
  const r = fold.applyArchive(device, archive(backup), 'replace');
  check('backup wins outright', r.routines.map((x) => x.id), ['morning', 'weekend']);
  check('and its version of a shared id', r.routines[0].tasks.length, 9);
  check('profile too', r.profile.name, 'Backup');
  check('settings too', r.settings.accent, 'sky');
  check('notes replaced', r.notes.map((n) => n.id), ['n2']);
}
{
  // The one exception: a backup that skipped notes must not delete them.
  const r = fold.applyArchive(device, archive(backup, ['notes']), 'replace');
  check('omitted notes are kept, not wiped', r.notes.map((n) => n.id), ['n1']);
}

console.log('applyArchive · merge');
{
  const r = fold.applyArchive(device, archive(backup), 'merge');
  check('local wins on a collision', r.routines[0].tasks.length, 3);
  check('new ids are added', r.routines.map((x) => x.id), ['morning', 'evening', 'weekend']);
  check('sessions deduped by id', r.sessions.map((s) => s.id), ['s1', 's2', 's3']);
  check('notes unioned', r.notes.map((n) => n.id), ['n1', 'n2']);
  check('saved templates deduped', r.savedTemplates, ['tpl-a', 'tpl-b']);
  check('local profile untouched', r.profile.name, 'Device');
}
check(
  'a restore always leaves the app onboarded',
  fold.applyArchive({ ...device, onboarded: false }, archive(backup), 'merge').onboarded,
  true
);

/* ── file names ───────────────────────────────────────────────────── */

console.log('archiveFileName');
check(
  'zero-padded and sortable',
  fold.archiveFileName(new Date(2026, 7, 3, 9, 4)),
  'Productively-backup-2026-08-03-0904.json'
);

/* ── schedule gate ────────────────────────────────────────────────── */

console.log('isDue');
const DAY = 86_400_000;
const now = 1_760_000_000_000;
check('never backed up is always due', settings.isDue(null, 'daily', now), true);
check('manual is never due, even so', settings.isDue(null, 'manual', now), false);
check('daily, 23h ago', settings.isDue(now - 23 * 3_600_000, 'daily', now), false);
check('daily, 25h ago', settings.isDue(now - 25 * 3_600_000, 'daily', now), true);
check('weekly, 6 days ago', settings.isDue(now - 6 * DAY, 'weekly', now), false);
check('weekly, 8 days ago', settings.isDue(now - 8 * DAY, 'weekly', now), true);
check('monthly, 31 days ago', settings.isDue(now - 31 * DAY, 'monthly', now), true);
check('a clock that went backwards is not due', settings.isDue(now + DAY, 'daily', now), false);

/* ── settings repair ──────────────────────────────────────────────── */

console.log('normalizeBackupSettings');
check('missing object', settings.normalizeBackupSettings(undefined), {
  enabled: false,
  frequency: 'daily',
  network: 'wifi',
  includeNotes: true,
});
check(
  'the pre-Drive boolean carries forward',
  settings.normalizeBackupSettings(undefined, true).enabled,
  true
);
check(
  'a bad frequency falls back',
  settings.normalizeBackupSettings({ frequency: 'hourly' }).frequency,
  'daily'
);
check(
  'an unknown network is treated as the safe one',
  settings.normalizeBackupSettings({ network: 'satellite' }).network,
  'wifi'
);
check(
  'includeNotes defaults on but honours an explicit false',
  [
    settings.normalizeBackupSettings({}).includeNotes,
    settings.normalizeBackupSettings({ includeNotes: false }).includeNotes,
  ],
  [true, false]
);

/* ── labels ───────────────────────────────────────────────────────── */

console.log('labels');
check('no backup reads as Never', format.agoLabel(null), 'Never');
check('under a minute', format.agoLabel(now - 30_000, now), 'Just now');
check('minutes are singular at one', format.agoLabel(now - 60_000, now), '1 minute ago');
check('minutes', format.agoLabel(now - 14 * 60_000, now), '14 minutes ago');
check('hours', format.agoLabel(now - 5 * 3_600_000, now), '5 hours ago');
check('bytes', format.sizeLabel(0), '—');
check('kilobytes', format.sizeLabel(2048), '2.0 KB');
check('megabytes', format.sizeLabel(2.4 * 1024 * 1024), '2.4 MB');
check('one routine is not "1 routines"', format.contentsLabel(1, 1), '1 routine · 1 day');

console.log(
  failures ? `\n${failures} backup check(s) failed` : '\nbackup: all checks pass'
);
process.exit(failures ? 1 : 0);
