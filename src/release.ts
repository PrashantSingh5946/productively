/**
 * What this build calls itself.
 *
 * The version was written out by hand in three screens and a mailto subject, so
 * a release bumped in app.json still shipped screens claiming the old number —
 * and the support mailbox got bug reports stamped with a version that was never
 * installed. It is read from the manifest now, which is the same string Gradle
 * stamps into `versionName`.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** `1.4.2`. Falls back only if the manifest is unreadable, which it never is on device. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

/** `Productively 1.4.2` — the footer every settings screen ends on. */
export const APP_LABEL = `Productively ${APP_VERSION}`;

/** `Productively 1.4.2 · Android` — same, plus the platform, for support. */
export const APP_LABEL_PLATFORM = `${APP_LABEL} · ${Platform.OS === 'ios' ? 'iOS' : 'Android'}`;
