/**
 * The unattended half of "backs up by itself".
 *
 * iOS and Android both decide for themselves when a background task actually
 * runs — the interval below is a hint, not a promise. That is fine, because
 * the engine's own `isDue` check is the real schedule: a wake-up that arrives
 * early does nothing, and the app-foreground catch-up in `context.tsx` covers
 * the case where the OS never wakes us at all.
 *
 * `defineTask` must run at module scope, before the task can fire, so this
 * module is imported for its side effect from the root layout.
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runBackup } from './engine';
import { BackupSettings, normalizeBackupSettings } from './settings';
import { readState } from './storage';

export const BACKUP_TASK = 'productively.backup.drive';

/** Twice a day. Anything finer is wasted on a daily-at-most backup. */
const INTERVAL_MINUTES = 12 * 60;

TaskManager.defineTask(BACKUP_TASK, async () => {
  try {
    const state = await readState();
    if (!state) return BackgroundTask.BackgroundTaskResult.Success;

    const settings = normalizeBackupSettings(state.settings?.backup);
    const result = await runBackup(settings, 'background');

    // A skip is a success: the gates did their job and we used no budget.
    return result.ok
      ? BackgroundTask.BackgroundTaskResult.Success
      : BackgroundTask.BackgroundTaskResult.Failed;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Register or drop the task to match the current preferences. Safe to call on
 * every settings change — it compares against what is already registered.
 */
export async function syncBackgroundTask(settings: BackupSettings): Promise<void> {
  const wanted = settings.enabled && settings.frequency !== 'manual';

  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKUP_TASK);
    if (wanted === registered) return;

    if (wanted) {
      const status = await BackgroundTask.getStatusAsync();
      // Low Power Mode or a parental restriction; the foreground catch-up
      // still runs, so this is not worth telling the user about.
      if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
      await BackgroundTask.registerTaskAsync(BACKUP_TASK, {
        minimumInterval: INTERVAL_MINUTES,
      });
    } else {
      await BackgroundTask.unregisterTaskAsync(BACKUP_TASK);
    }
  } catch {
    // Background scheduling is a bonus, never a precondition.
  }
}
