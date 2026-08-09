/** 1.2 Welcome / sign in. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Spacer, T, Tap } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const go = () => router.push('/onboarding/carousel');

  return (
    <Grad
      colors={G.welcome}
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Lifestyle hero placeholder — the board leaves the photo slot drawn. */}
      <View style={{ ...StyleAbsolute, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Icon name="img" size={46} color={C.faint} />
        <T size={12} weight={500} color={C.faint}>
          Lifestyle hero photo
        </T>
      </View>

      <T
        d
        size={40}
        weight={800}
        lh={46}
        center
        ls={-0.4}
        style={{ marginTop: 64, marginHorizontal: 34 }}
      >
        {'Switch on\nyour day'}
      </T>

      <Spacer />

      <View style={{ paddingHorizontal: 22, paddingBottom: 26, gap: 12 }}>
        <View
          style={{
            alignSelf: 'center',
            marginBottom: -24,
            zIndex: 1,
            paddingVertical: 9,
            paddingHorizontal: 18,
            borderRadius: 999,
            backgroundColor: '#FFFAF6',
            borderWidth: 1.5,
            borderColor: '#FFB894',
            shadowColor: C.ink,
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <T size={13} weight={700} color={C.accentInk}>
            Keeps your data safe
          </T>
        </View>

        <Button label="Sign up in 10 seconds" kind="accent" onPress={go} />
        <Button label="Start without an account" kind="ghost" onPress={go} />

        <Tap onPress={go}>
          <T size={14} center color={C.textSoft} style={{ paddingTop: 6 }}>
            Already with us? <T size={14} weight={700} color={C.ink}>Sign in</T>
          </T>
        </Tap>
      </View>
    </Grad>
  );
}

const StyleAbsolute = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.5,
};
