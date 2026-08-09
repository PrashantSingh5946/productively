/** 1.8 Sleep time. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Row, T } from '../../src/ui';
import { StepHeader, Wheel } from '../../src/components/OnboardingChrome';
import { HOURS, MERIDIEM, MINUTES, to24 } from './wake';
import { Icon } from '../../src/icons';
import { C } from '../../src/theme';
import { useStore } from '../../src/store';

export default function Sleep() {
  const insets = useSafeAreaInsets();
  const { set } = useStore();
  const [h, setH] = useState(6); // 10
  const [m, setM] = useState(0);
  const [p, setP] = useState(1); // PM

  const next = () => {
    set((d) => {
      d.profile.sleep = to24(h, m, p);
    });
    router.push('/onboarding/permissions');
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
      <StepHeader progress={0.36} />

      <Row gap={10} style={{ marginTop: 26, justifyContent: 'center' }}>
        <T d size={30} weight={800} lh={37} center style={{ flexShrink: 1 }}>
          When would you like to fall asleep?
        </T>
        <Icon name="moon" size={26} color="#8A807A" />
      </Row>
      <T size={15} lh={21} center color={C.muted} style={{ marginTop: 12 }}>
        We'll suggest a routine that suits your evenings.
      </T>

      <Row gap={10} style={{ flex: 1, justifyContent: 'center' }}>
        <Wheel values={HOURS} index={h} onChange={setH} width={22} />
        <Wheel values={MINUTES} index={m} onChange={setM} />
        <Wheel values={MERIDIEM} index={p} onChange={setP} />
      </Row>

      <Button label="Next" onPress={next} />
    </View>
  );
}
