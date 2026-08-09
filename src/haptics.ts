/**
 * The Settings toggle has to reach `Tap`, which sits below the store in the
 * import graph — so the flag lives here and the provider writes to it.
 */
export const haptics = { enabled: true };

export function setHapticsEnabled(v: boolean) {
  haptics.enabled = v;
}
