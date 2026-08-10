/**
 * Google sign-in for Drive backups.
 *
 * Imperative rather than the `useAuthRequest` hook, because the engine has to
 * be able to get a token from a background wake-up where there is no component
 * to hold the request. PKCE is on — an installed app cannot keep a client
 * secret, so the code verifier is what proves the exchange came from us.
 */
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  DRIVE_SCOPES,
  GOOGLE_CLIENT_ID,
  GOOGLE_DISCOVERY,
  REDIRECT_URI,
  isDriveConfigured,
} from './config';
import { BackupAccount, Tokens, clearTokens, readTokens, writeTokens } from './storage';

// Dismisses the auth popup if the app was reloaded mid-flow. No-op on native.
WebBrowser.maybeCompleteAuthSession();

/** Thrown when the caller must send the user through sign-in again. */
export class NeedsSignIn extends Error {
  constructor(message = 'Sign in to Google to continue.') {
    super(message);
    this.name = 'NeedsSignIn';
  }
}

export class NotConfigured extends Error {
  constructor() {
    super('Google Drive backup is not set up in this build.');
    this.name = 'NotConfigured';
  }
}

/** Refresh a minute early — a token that expires mid-upload is a failed run. */
const SKEW_MS = 60_000;

function toTokens(r: AuthSession.TokenResponse, previous?: Tokens | null): Tokens {
  return {
    accessToken: r.accessToken,
    // Google issues the refresh token once, on the first consent. Later
    // exchanges come back without one, and dropping it would silently break
    // every future unattended backup.
    refreshToken: r.refreshToken ?? previous?.refreshToken ?? null,
    expiresAt: Date.now() + (r.expiresIn ?? 3600) * 1000,
    scope: r.scope ?? null,
  };
}

/**
 * Open the Google consent screen and store the resulting tokens.
 * Returns null if the user backed out.
 */
export async function signIn(): Promise<BackupAccount | null> {
  if (!isDriveConfigured() || !GOOGLE_CLIENT_ID) throw new NotConfigured();

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scopes: DRIVE_SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      // Together these are what make Google hand back a refresh token, which
      // is the whole difference between "backs up by itself" and "backs up
      // while you are looking at the screen".
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    if (result.type === 'error') {
      throw new Error(result.params.error_description ?? 'Google turned down the sign-in.');
    }
    return null;
  }

  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      code: result.params.code,
      redirectUri: REDIRECT_URI,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    GOOGLE_DISCOVERY
  );

  const tokens = toTokens(response);
  await writeTokens(tokens);
  return fetchAccount(tokens.accessToken);
}

/**
 * A usable access token, refreshing first if the stored one is spent.
 * Throws NeedsSignIn when there is nothing left to refresh with.
 */
export async function accessToken(): Promise<string> {
  if (!isDriveConfigured() || !GOOGLE_CLIENT_ID) throw new NotConfigured();

  const stored = await readTokens();
  if (!stored) throw new NeedsSignIn();
  if (stored.expiresAt - SKEW_MS > Date.now()) return stored.accessToken;
  if (!stored.refreshToken) throw new NeedsSignIn('Your Google session expired.');

  let refreshed: AuthSession.TokenResponse;
  try {
    refreshed = await AuthSession.refreshAsync(
      {
        clientId: GOOGLE_CLIENT_ID,
        refreshToken: stored.refreshToken,
        scopes: DRIVE_SCOPES,
      },
      GOOGLE_DISCOVERY
    );
  } catch {
    // A revoked or expired grant is unrecoverable; make the UI say so rather
    // than retrying against a credential Google has already thrown away.
    await clearTokens();
    throw new NeedsSignIn('Google signed this device out. Connect the account again.');
  }

  const next = toTokens(refreshed, stored);
  await writeTokens(next);
  return next.accessToken;
}

export async function isSignedIn(): Promise<boolean> {
  return !!(await readTokens());
}

/** Whose Drive we are writing to — shown on the backup screen. */
export async function fetchAccount(token?: string): Promise<BackupAccount | null> {
  const bearer = token ?? (await accessToken());
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { email?: string; name?: string; picture?: string };
  if (!j.email) return null;
  return { email: j.email, name: j.name ?? null, picture: j.picture ?? null };
}

/**
 * Disconnect. Best-effort revocation at Google, then drop the local copy —
 * the local drop must happen even if the network call fails, or the user
 * stays signed in to an account they just asked to leave.
 */
export async function signOut(): Promise<void> {
  const stored = await readTokens();
  if (stored && GOOGLE_CLIENT_ID) {
    await AuthSession.revokeAsync(
      { token: stored.refreshToken ?? stored.accessToken, clientId: GOOGLE_CLIENT_ID },
      GOOGLE_DISCOVERY
    ).catch(() => {});
  }
  await clearTokens();
}
