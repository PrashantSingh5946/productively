/**
 * 1.10 Streak started — the last screen of onboarding.
 *
 * The board follows this with 1.11 "first routine prepared", whose CTA is
 * "Start — done by 8:07am": a launch pad, not a setup step. Renamed to "Done
 * at …" it read as a second confirmation arriving *after* a screen that already
 * said "You're all set to flow", so the flow ends here instead and Get started
 * goes to Home. 1.11 stays in the tree; it is simply no longer in the way.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Spacer, T } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function StreakStarted() {
  useT();
  const insets = useSafeAreaInsets();
  const { finishOnboarding } = useStore();

  return (
    <Grad
      colors={G.sunrise}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 22,
      }}
    >
      <T d size={32} weight={800} lh={40} center style={{ marginTop: 56 }}>
        You're all set to flow
      </T>

      <View style={{ marginTop: 52 }}>
        <Icon name="starF" size={150} color={C.accent} />
      </View>

      <T d size={26} weight={800} color={C.accentDeep} style={{ marginTop: 46 }}>
        1 day streak
      </T>
      <T size={16} lh={25} center color={C.muted} style={{ marginTop: 18, marginHorizontal: 26 }}>
        Your first routine is ready and waiting for tomorrow morning.
      </T>

      <Spacer />
      <Button
        label="Get started"
        onPress={() => {
          // Marks onboarding done, moves the morning routine to the wake time
          // picked on 1.7, and creates that routine if nothing is seeded.
          finishOnboarding();
          router.replace('/(tabs)/home');
        }}
        style={{ alignSelf: 'stretch' }}
      />
    </Grad>
  );
}
