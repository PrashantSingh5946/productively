/** 1.10 Streak started. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Spacer, T } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';

import { useT } from '../../src/theming';
export default function StreakStarted() {
  useT();
  const insets = useSafeAreaInsets();

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
        onPress={() => router.push('/onboarding/first-routine')}
        style={{ alignSelf: 'stretch' }}
      />
    </Grad>
  );
}
