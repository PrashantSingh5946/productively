/**
 * Storage keys shared by the React store and the code that reads the same data
 * from outside React — the backup engine and the background task, which run
 * with no provider mounted and must talk to AsyncStorage directly.
 */

/** The whole app state, written by StoreProvider on every change. */
export const STATE_KEY = 'productively/state/v1';

/** Backup bookkeeping: when we last ran, how big it was, which account. */
export const BACKUP_META_KEY = 'productively/backup/meta/v1';

/** Google OAuth tokens. Lives in SecureStore, never AsyncStorage. */
export const DRIVE_TOKEN_KEY = 'productively.drive.tokens.v1';
