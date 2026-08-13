/**
 * 1.2 Welcome.
 *
 * The board draws "Sign up in 10 seconds", "Start without an account" and
 * "Already with us? Sign in". There is no account: no backend, no server, and
 * backup is an export file you carry yourself. All three buttons called the
 * same function and went to the same screen — three doors into one room.
 * What is left is the only real choice on this screen: start fresh, or bring a
 * phone's worth of history with you.
 */
import React from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Spacer, T } from '../../src/ui';
import { C, G, SHADOW } from '../../src/theme';

import { useT } from '../../src/theming';
export default function Welcome() {
  useT();
  const insets = useSafeAreaInsets();
  const go = () => router.push('/onboarding/carousel');

  return (
    // The safe-area insets live on the inner view, not here: an absolutely
    // positioned child is laid out inside the padding box, so padding on this
    // container left a bare strip of gradient along the bottom edge under the
    // navigation bar. The photo has to bleed past both insets.
    <Grad colors={G.welcome} style={{ flex: 1 }}>
      {/*
        The hero the board leaves as an empty photo slot. It sits over
        `G.welcome` rather than replacing it, so the warm gradient still tints
        the room and the screen stays on-palette if the asset is ever swapped.
        841×1870 is 1:2.22 — the same shape as the device — so `cover` crops
        nothing that matters.
      */}
      <Image
        source={require('../../assets/main-hero-bg.png')}
        // Width/height are explicit: an `Image` with a `require`d source takes
        // its intrinsic size (841×1870 *dp*) and ignores `right`/`bottom`, so
        // absolute-fill alone rendered the top-left corner at 1:1 and cropped
        // the mug and the bed clean off the screen.
        style={[StyleAbsolute, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />

      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
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
              backgroundColor: C.accentWash,
              borderWidth: 1.5,
              borderColor: C.accentTintBorder,
              boxShadow: SHADOW.row,
            }}
          >
            <T size={13} weight={700} color={C.accentInk}>
              Everything stays on this phone
            </T>
          </View>

          <Button label="Get started" kind="accent" onPress={go} />

          {/* Coming from an old phone: skip the whole setup and pull it back. */}
          <Button
            label="Import a backup"
            kind="ghost"
            onPress={() => router.push('/settings/backup')}
          />
        </View>
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
