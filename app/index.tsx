/** 1.1 Splash — logo mark over a determinate loading bar. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { router } from 'expo-router';
import { Grad } from '../src/ui';
import { Icon } from '../src/icons';
import { C, G } from '../src/theme';
import { useStore } from '../src/store';

import { useT } from '../src/theming';
export default function Splash() {
  useT();
  const { state, ready } = useStore();
  const p = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    Animated.timing(p, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => setDone(true));
  }, [p]);

  useEffect(() => {
    if (!done || !ready) return;
    router.replace(state.onboarded ? '/(tabs)/home' : '/onboarding/welcome');
  }, [done, ready, state.onboarded]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.paper,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 34,
      }}
    >
      <Grad
        colors={G.accent}
        diag
        style={{
          width: 78,
          height: 78,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="logo" size={50} color={C.accentOn} />
      </Grad>
      <View
        style={{
          width: 190,
          height: 5,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: C.trackRing,
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: C.accent,
            width: p.interpolate({ inputRange: [0, 1], outputRange: ['4%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}
