/**
 * 1.6 Struggles. Drawn on the board in its empty state, so Next stays disabled
 * until something is picked.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, CheckCoin, Row, Spacer, T, Tap, rowSkin, tintSkin } from '../../src/ui';
import { StepHeader } from '../../src/components/OnboardingChrome';
import { C, RADIUS } from '../../src/theme';
import { STRUGGLES } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function Struggles() {
  useT();
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
        backgroundColor: C.paper,
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
              <Row
                gap={12}
                style={[
                  { borderRadius: RADIUS.tile, paddingVertical: 16, paddingHorizontal: 20 },
                  on ? tintSkin() : rowSkin(),
                  on && { backgroundColor: C.accentTintFrom },
                ]}
              >
                <T
                  size={15.5}
                  weight={on ? 700 : 600}
                  lh={21}
                  color={on ? C.accentText : C.textMid}
                  style={{ flex: 1 }}
                >
                  {s}
                </T>
                <CheckCoin size={24} on={on} />
              </Row>
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
