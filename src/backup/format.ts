/** Small labels the backup screens share, kept out of the components. */

export function sizeLabel(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1000) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** "Just now" / "14 minutes ago" / "Yesterday" / "3 Aug". */
export function agoLabel(at: number | null | undefined, now = Date.now()): string {
  if (!at) return 'Never';
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const then = new Date(at);
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  if (at >= midnight.getTime() - 86_400_000) return 'Yesterday';

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** "10 Aug, 9:14 am" — the exact stamp on a restore list row. */
export function stampLabel(at: number | null | undefined): string {
  if (!at) return '—';
  const d = new Date(at);
  return `${d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

/** "13 routines · 146 days" for a one-line description of an archive. */
export function contentsLabel(routines: number, days: number): string {
  const r = `${routines} routine${routines === 1 ? '' : 's'}`;
  const d = `${days} day${days === 1 ? '' : 's'}`;
  return `${r} · ${d}`;
}
