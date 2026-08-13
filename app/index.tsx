/**
 * Entry. v3 opens straight into Today.
 *
 * v2 spent 1.3 seconds here animating a determinate bar over a fake load, then
 * branched to onboarding or the tabs. There is nothing to load — the store is
 * one AsyncStorage read — so the bar was measuring its own animation, and the
 * onboarding branch no longer exists. All that is left is the wait for the
 * store, which is why this still renders paper rather than redirecting on the
 * first frame: navigating before `ready` would land on a Today built from the
 * default state and then reshuffle under the user.
 */
import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { C } from '../src/theme';
import { useStore } from '../src/store';

import { useT } from '../src/theming';
export default function Index() {
  useT();
  const { ready } = useStore();

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  return <Redirect href="/(tabs)/home" />;
}
