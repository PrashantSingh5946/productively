/**
 * Runtime theming. Swaps the token set at the root — no per-screen work, no
 * restart. Accent applies instantly; "System" follows the OS toggle.
 *
 * Screens and primitives subscribe with `useT()`, which returns the same live
 * `C` object and re-renders the caller whenever the palette is rebuilt.
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { C, applyPalette } from './theme';
import type { AccentKey, Mode } from './tokens';

type ThemeInfo = { key: string; mode: Mode; accent: AccentKey };

const ThemeCtx = createContext<ThemeInfo>({ key: 'ember:light', mode: 'light', accent: 'ember' });

export type ThemePref = 'Light' | 'Dark' | 'System';

export function resolveMode(pref: ThemePref, system: string | null | undefined): Mode {
  if (pref === 'System') return system === 'dark' ? 'dark' : 'light';
  return pref === 'Dark' ? 'dark' : 'light';
}

export function ThemeProvider({
  accent,
  pref,
  children,
}: {
  accent: AccentKey;
  pref: ThemePref;
  children: React.ReactNode;
}) {
  const system = useColorScheme();
  const mode = resolveMode(pref, system);

  // Rebuilt during render, before children read the tokens. `applyPalette` is
  // idempotent, so running it here rather than in an effect is safe and keeps
  // the first painted frame on the correct palette.
  const value = useMemo<ThemeInfo>(() => {
    applyPalette(accent, mode);
    return { key: `${accent}:${mode}`, mode, accent };
  }, [accent, mode]);

  // Keep the window behind the React tree on paper too, so overscroll and the
  // Android navigation bar don't flash white in dark mode.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.paper).catch(() => {});
  }, [value.key]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/**
 * Subscribe to the palette. Returns the live token object — call it once at the
 * top of any component that reads `C`, `G`, `SHADOW` or `TASK_TONES`.
 */
export function useT() {
  useContext(ThemeCtx);
  return C;
}

/** Current resolved mode and accent, for code that needs to branch on them. */
export function useThemeInfo() {
  return useContext(ThemeCtx);
}
