/**
 * Google OAuth client configuration.
 *
 * Client IDs are per-project secrets-of-a-sort: they belong to whoever ships
 * the app, not to the source tree. They are read from `expo.extra.googleDrive`
 * in app.json so a fork can drop its own in without touching code, and every
 * Drive entry point checks `isDriveConfigured()` first and degrades to a
 * readable "not set up" state instead of throwing.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type Extra = {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
};

const extra = (Constants.expoConfig?.extra?.googleDrive ?? {}) as Extra;

/** A placeholder left in app.json reads as "not configured", not as an id. */
const real = (v?: string) => (v && !v.startsWith('REPLACE_') ? v : undefined);

export const GOOGLE_CLIENT_ID = Platform.select({
  ios: real(extra.iosClientId),
  android: real(extra.androidClientId),
  default: real(extra.webClientId),
});

export function isDriveConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

/**
 * Google's redirect convention for installed apps: the client id reversed into
 * a custom scheme. `123-abc.apps.googleusercontent.com` becomes
 * `com.googleusercontent.apps.123-abc:/oauth2redirect`.
 *
 * The same reversed string must appear in `expo.scheme` in app.json, or the
 * OS has nothing to hand the callback back to.
 */
export function reversedClientId(clientId: string): string {
  return `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;
}

export const REDIRECT_URI = GOOGLE_CLIENT_ID
  ? `${reversedClientId(GOOGLE_CLIENT_ID)}:/oauth2redirect`
  : '';

/**
 * `drive.appdata` is the narrowest scope that does the job: a private folder
 * only this app can see, invisible in the user's Drive listing, with no access
 * to any of their real files. `userinfo.email` is only there so the settings
 * screen can name the account it is backing up to.
 */
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};
