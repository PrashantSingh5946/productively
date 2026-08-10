/** 1.5 Intent — multi-select. Selected rows go persimmon. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, CheckCoin, Grad, Spacer, T, Tap, rowSkin, tintSkin } from '../../src/ui';
import { StepHeader } from '../../src/components/OnboardingChrome';
import { Icon } from '../../src/icons';
import { C, G, RADIUS } from '../../src/theme';
import { INTENTS } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function Intent() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const [picked, setPicked] = useState<string[]>(state.profile.intents);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const next = () => {
    set((d) => {
      d.profile.intents = picked;
    });
    router.push('/onboarding/struggles');
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
      <StepHeader progress={0.62} />

      <T d size={30} weight={800} lh={37} center style={{ marginTop: 26 }}>
        What does your ideal day look like?
      </T>
      <T size={15} lh={21} center color={C.muted} style={{ marginTop: 12 }}>
        We'll suggest a routine just for you.
      </T>

      <View style={{ gap: 12, marginTop: 26 }}>
        {INTENTS.map((o) => {
          const on = picked.includes(o.id);
          // Selected reads as the accent tint, not the accent fill — the fill
          // is rationed to the one decisive action, which here is Next.
          const inner = (
            <View style={ROW}>
              <Icon name={o.icon} size={20} color={on ? C.accentIcon : C.muted} />
              <T
                size={15.5}
                weight={on ? 700 : 600}
                lh={20}
                color={on ? C.accentText : C.textMid}
                style={{ flex: 1 }}
              >
                {o.label}
              </T>
              <CheckCoin size={24} on={on} />
            </View>
          );
          return (
            <Tap key={o.id} onPress={() => toggle(o.id)}>
              {on ? (
                <Grad
                  colors={G.accentTint}
                  diag
                  style={[{ borderRadius: RADIUS.tile }, tintSkin()]}
                >
                  {inner}
                </Grad>
              ) : (
                <View style={[{ borderRadius: RADIUS.tile }, rowSkin()]}>{inner}</View>
              )}
            </Tap>
          );
        })}
      </View>

      <Spacer />

      <Tap onPress={next}>
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
      <Button label="Next" onPress={next} />
    </View>
  );
}

const ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  paddingVertical: 19,
  paddingHorizontal: 22,
};
