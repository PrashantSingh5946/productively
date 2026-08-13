/**
 * Routine reminders.
 *
 * Onboarding drew an "Allow alarms" button inside a `pointerEvents: 'none'`
 * backdrop, asked for consent to something, and then never scheduled anything
 * — the app had no notification dependency at all. This is the other half.
 *
 * What it schedules is a notification a few minutes before a routine's start
 * time, repeating weekly on each day the routine runs. Not an alarm in the
 * clock-app sense: a full-screen, sound-through-silent alarm needs
 * USE_FULL_SCREEN_INTENT and SCHEDULE_EXACT_ALARM, both of which Google
 * reviews case by case and neither of which a routine reminder qualifies for.
 *
 * Two separate facts decide whether anything fires, and they are deliberately
 * not folded together:
 *   · `settings.alarms` — the user's intent, which survives a reinstall of the
 *     permission and rides along in the backup;
 *   · the OS grant, which the user can withdraw in Settings at any time
 *     without telling us.
 * Everything below reads them in that order and degrades quietly. A phone that
 * refuses notifications is not an error state, it is a phone.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Routine, fmtClock } from './data';

/** Android groups notifications by channel; ours is the one the user can mute. */
const CHANNEL = 'routines';

/** Stamped on everything we schedule so we only ever cancel our own. */
const TAG = 'routine-reminder';

// A reminder that arrives while the app is open should still be seen — the
// whole point is that it lands a few minutes before you were going to start.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Routine reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Has the OS already said yes? Never prompts. */
export async function alarmsGranted(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Ask, once. Android only shows the system dialog the first time; after a
 * denial `requestPermissionsAsync` resolves straight back as denied, which is
 * why the caller has to be able to live with `false`.
 */
export async function requestAlarms(): Promise<boolean> {
  try {
    await ensureChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    if (!existing.canAskAgain) return false;
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Send a tapped reminder to the routine it is about.
 *
 * The payload has carried `routineId` since reminders were added and nothing
 * ever read it, so tapping one only reopened wherever you had left the app —
 * the reminder told you to start, then made you go and find the thing.
 *
 * `useLastNotificationResponse` covers both cases that matter: a tap while the
 * app is running, and a cold start where the tap *is* what launched the
 * process. Both arrive here as the same object.
 *
 * @param onOpen  Navigate to a routine. Not called for an id that no longer
 *                exists — a reminder can outlive its routine by up to a week.
 * @param ready   Hold off until the store has hydrated, or the existence check
 *                runs against the seed and drops a legitimate tap.
 */
export function useReminderTaps(onOpen: (routineId: string) => void, ready: boolean) {
  const response = Notifications.useLastNotificationResponse();
  // The hook keeps handing back the same response, so without this a tap would
  // re-navigate on every render for the rest of the session.
  const handled = useRef<string | null>(null);
  const cb = useRef(onOpen);
  cb.current = onOpen;

  useEffect(() => {
    if (!ready || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const req = response.notification.request;
    const data = req.content.data as { tag?: string; routineId?: string } | undefined;
    // Only ours, and only if it names a routine.
    if (data?.tag !== TAG || !data.routineId) return;
    if (handled.current === req.identifier) return;

    handled.current = req.identifier;
    cb.current(data.routineId);
  }, [response, ready]);
}

/**
 * Post one reminder a few seconds out, for the routine given.
 *
 * A weekly reminder is otherwise untestable without waiting up to seven days,
 * which is how the payload's `routineId` went unread for so long. Same tag and
 * same data shape as the real thing, so tapping it exercises the real path
 * rather than a rehearsal of it.
 *
 * Returns false if the OS has not granted notifications.
 */
export async function testReminder(r: Routine, h24?: boolean): Promise<boolean> {
  if (!(await alarmsGranted())) return false;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: r.name,
      body: `Test reminder · starts at ${fmtClock(r.start, h24)}`,
      data: { tag: TAG, routineId: r.id },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL } : null),
    },
  });
  return true;
}

/** Drop every reminder this module scheduled, leaving anything else alone. */
export async function clearAlarms(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.content.data?.tag === TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Nothing scheduled, or the module is unavailable. Either way, nothing to do.
  }
}

/**
 * Make the OS schedule match the routines exactly.
 *
 * Cancel-then-reschedule rather than diffing: the whole set is at most a few
 * dozen entries, and a diff would have to be right about renames, moved start
 * times and dropped days at once to avoid a stale 6am reminder outliving the
 * routine that asked for it.
 *
 * Safe to call on every change and on every launch. Returns how many fired off,
 * so a caller can tell "off" from "on but nothing to remind about".
 */
export async function syncAlarms(
  routines: Routine[],
  opts: { enabled: boolean; leadMinutes: number; h24?: boolean }
): Promise<number> {
  await clearAlarms();
  if (!opts.enabled) return 0;
  if (!(await alarmsGranted())) return 0;

  await ensureChannel();
  let n = 0;

  for (const r of routines) {
    if (!r.tasks.length) continue; // Nothing to remind someone to start.

    for (const day of r.days) {
      // A 5-minute lead on a 2am routine belongs to the day before. Without the
      // wrap it would schedule at -3 minutes, which the OS reads as 23:57 on
      // the *same* weekday — a reminder a full day late.
      const raw = r.start - opts.leadMinutes;
      const wrapped = raw < 0;
      const at = wrapped ? raw + 1440 : raw;
      const weekday = wrapped ? (day + 6) % 7 : day;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: r.name,
            body: `Starts at ${fmtClock(r.start, opts.h24)} · ${r.tasks.length} ${
              r.tasks.length === 1 ? 'task' : 'tasks'
            }`,
            data: { tag: TAG, routineId: r.id },
            ...(Platform.OS === 'android' ? { channelId: CHANNEL } : null),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            // expo-notifications counts weekdays from 1 = Sunday; the app
            // stores them the JavaScript way, from 0 = Sunday.
            weekday: weekday + 1,
            hour: Math.floor(at / 60),
            minute: at % 60,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL } : null),
          },
        });
        n += 1;
      } catch {
        // One bad routine must not take the rest of the schedule with it.
      }
    }
  }

  return n;
}
