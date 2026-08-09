/** 1.7 Wake time — three wheels, hour / minute / meridiem. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Row, T } from '../../src/ui';
import { StepHeader, Wheel } from '../../src/components/OnboardingChrome';
import { Icon } from '../../src/icons';
import { C } from '../../src/theme';
import { useStore } from '../../src/store';

export const HOURS = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const MINUTES = ['00', '15', '30', '45'];
export const MERIDIEM = ['AM', 'PM'];

export function to24(hIdx: number, mIdx: number, pmIdx: number) {
  let h = Number(HOURS[hIdx]) % 12;
  if (pmIdx === 1) h += 12;
  return h * 60 + Number(MINUTES[mIdx]);
}

export default function Wake() {
  const insets = useSafeAreaInsets();
  const { set } = useStore();
  const [h, setH] = useState(4); // 8
  const [m, setM] = useState(0);
  const [p, setP] = useState(0);

  const next = () => {
    set((d) => {
      d.profile.wake = to24(h, m, p);
    });
    router.push('/onboarding/sleep');
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
      <StepHeader progress={0.26} />

      <Row gap={10} style={{ marginTop: 26, justifyContent: 'center' }}>
        <T d size={30} weight={800} lh={37} center style={{ flexShrink: 1 }}>
          When does your day begin?
        </T>
        <Icon name="sun" size={28} color="#8A807A" />
      </Row>
      <T size={15} lh={21} center color={C.muted} style={{ marginTop: 12 }}>
        We'll suggest a routine that suits your mornings.
      </T>

      <Row gap={10} style={{ flex: 1, justifyContent: 'center' }}>
        <Wheel values={HOURS} index={h} onChange={setH} />
        <Wheel values={MINUTES} index={m} onChange={setM} />
        <Wheel values={MERIDIEM} index={p} onChange={setP} />
      </Row>

      <Button label="Next" onPress={next} />
    </View>
  );
}
