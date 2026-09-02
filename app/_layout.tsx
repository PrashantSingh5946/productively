import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Imported per weight rather than from the package root — the root index pulls
// every variant's .ttf into the bundle, italics included.
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { StoreProvider, useStore } from '../src/store';
import { BackupProvider } from '../src/backup/context';
// Side-effect import: TaskManager.defineTask has to run before the OS can hand
// us a background wake-up, and it must happen at module scope.
import '../src/backup/task';
import { syncAlarms, useReminderTaps } from '../src/alarms';
import { C } from '../src/theme';
import { ThemeProvider, useT, useThemeInfo } from '../src/theming';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    Bricolage_600SemiBold: BricolageGrotesque_600SemiBold,
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    Bricolage_800ExtraBold: BricolageGrotesque_800ExtraBold,
    Instrument_400Regular: InstrumentSans_400Regular,
    Instrument_500Medium: InstrumentSans_500Medium,
    Instrument_600SemiBold: InstrumentSans_600SemiBold,
    Instrument_700Bold: InstrumentSans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <BackupProvider>
            <Themed />
          </BackupProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Sits inside the store so the accent and theme preference can drive the tokens. */
function Themed() {
  const { state, ready } = useStore();

  /*
    A tapped reminder starts its routine. Guarded on the routine still existing
    rather than pushing the id straight through: reminders are scheduled a week
    out, so one can outlive the routine it names, and `/run/<deleted id>` is a
    dead screen. Falling back to Today is the honest failure — the thing it was
    reminding you about is gone.
  */
  useReminderTaps((routineId) => {
    const exists = state.routines.some((r) => r.id === routineId);
    router.replace(exists ? `/run/${routineId}` : '/(tabs)/home');
  }, ready);

  /*
    Reminders are rebuilt from the routines rather than kept in step by hand.
    Renaming a routine, moving its start time or dropping a weekday all have to
    reach the OS schedule, and every one of those is a different call site —
    watching the data is the only version that cannot drift.

    Waits for `ready`: before hydration the routines are still the seed, and
    scheduling those would post reminders for routines the user does not have.
  */
  /*
    Keyed on a signature, not on `state.routines`. Every store write clones the
    whole tree, so the array identity changes when a checklist item is ticked —
    depending on it would cancel and re-post the entire OS schedule on each tap.
    Only these five fields can change what a reminder says or when it fires.
  */
  const signature = useMemo(
    () =>
      state.routines
        .map((r) => `${r.id}|${r.name}|${r.start}|${r.days.join('')}|${r.tasks.length}`)
        .join('~'),
    [state.routines]
  );

  useEffect(() => {
    if (!ready) return;
    syncAlarms(state.routines, {
      enabled: state.settings.alarms,
      leadMinutes: state.settings.alarmLead,
      h24: !state.settings.timeFormat12,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    signature,
    state.settings.alarms,
    state.settings.alarmLead,
    state.settings.timeFormat12,
  ]);

  return (
    <ThemeProvider accent={state.settings.accent} pref={state.settings.theme}>
      <Navigation />
    </ThemeProvider>
  );
}

function Navigation() {
  const t = useT();
  const { mode } = useThemeInfo();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.paper },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="run/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="task-picker"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </>
  );
}
