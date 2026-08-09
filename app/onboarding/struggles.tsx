/**
 * 1.6 Struggles. Drawn on the board in its empty state, so Next stays disabled
 * until something is picked.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Spacer, T, Tap } from '../../src/ui';
import { StepHeader } from '../../src/components/OnboardingChrome';
import { C, G } from '../../src/theme';
import { STRUGGLES } from '../../src/data';
import { useStore } from '../../src/store';

export default function Struggles() {
  const insets = useSafeAreaInsets();
  const { set } = useStore();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const go = () => {
    set((d) => {
      d.profile.struggles = picked;
    });
    router.push('/onboarding/wake');
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 22,
        paddingHorizontal: 22,
        backgroundColor: C.white,
      }}
    >
      <StepHeader progress={0.48} />

      <T d size={30} weight={800} lh={37} center style={{ marginTop: 26 }}>
        What do you struggle with?
      </T>
      <T size={15} lh={21} center color={C.muted} style={{ marginTop: 12 }}>
        We'll suggest routines for your struggles.
      </T>

      <View style={{ gap: 12, marginTop: 26 }}>
        {STRUGGLES.map((s) => {
          const on = picked.includes(s);
          return (
            <Tap key={s} onPress={() => toggle(s)}>
              <Grad colors={on ? G.accent : G.card} diag={on} style={{ borderRadius: 16 }}>
                <T
                  size={15.5}
                  weight={600}
                  lh={21}
                  color={on ? C.ink : C.textMid}
                  style={{ paddingVertical: 19, paddingHorizontal: 22 }}
                >
                  {s}
                </T>
              </Grad>
            </Tap>
          );
        })}
      </View>

      <Spacer />

      <Tap onPress={go}>
        <T
          size={14.5}
          weight={500}
          center
          color={C.textMid}
          style={{ paddingVertical: 16, textDecorationLine: 'underline' }}
        >
          Skip
        </T>
      </Tap>
      <Button label="Next" onPress={go} disabled={picked.length === 0} />
    </View>
  );
}
