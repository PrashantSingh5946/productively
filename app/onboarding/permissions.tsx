/**
 * 1.9 Permissions + consent sheet. The dimmed alarm-permission screen sits
 * behind a sheet whose "over 16" line is required before Continue lights up.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Row, T, Tap } from '../../src/ui';
import { StepHeader } from '../../src/components/OnboardingChrome';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';

export default function Permissions() {
  const insets = useSafeAreaInsets();
  const [age, setAge] = useState(false);
  const [news, setNews] = useState(false);
  const all = age && news;

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top }}>
      {/* Backdrop: the alarm-permission step, dimmed under the sheet. */}
      <View style={{ flex: 1, paddingHorizontal: 22, opacity: 0.62 }} pointerEvents="none">
        <StepHeader progress={1} />
        <T d size={30} weight={800} lh={37} center style={{ marginTop: 30 }}>
          We'll help you remember your routine
        </T>
        <Grad
          colors={G.card}
          style={{ marginTop: 30, borderRadius: 20, padding: 24, alignItems: 'center' }}
        >
          <T d size={17} weight={700}>
            Alarm permission
          </T>
          <Grad
            colors={G.inkDeep}
            diag
            style={{ marginTop: 14, height: 56, borderRadius: 999, alignSelf: 'stretch' }}
          />
        </Grad>
      </View>

      <View style={[SHEET, { paddingBottom: insets.bottom + 24 }]}>
        <View style={GRABBER} />
        <T size={16} weight={700}>
          Before we start
        </T>

        <Tap
          onPress={() => {
            const v = !all;
            setAge(v);
            setNews(v);
          }}
        >
          <Grad colors={G.card} style={AGREE}>
            <T d size={17} weight={700} style={{ flex: 1 }}>
              Agree to all
            </T>
            <Icon name="check" size={24} color={all ? C.ink : C.ring} />
          </Grad>
        </Tap>

        <Tap onPress={() => setAge((v) => !v)}>
          <Row gap={14} style={{ paddingTop: 18, paddingHorizontal: 6 }}>
            <Icon name="check" size={20} color={age ? C.textMid : C.ring} />
            <T size={15} lh={20} color={C.text} style={{ flex: 1 }}>
              I am over 16 years old <T size={15} color={C.muted}>(required)</T>
            </T>
          </Row>
        </Tap>

        <Row gap={14} style={{ paddingTop: 16, paddingHorizontal: 6 }}>
          <Tap onPress={() => setNews((v) => !v)} hitSlop={10}>
            <Icon name="check" size={20} color={news ? C.textMid : C.ring} />
          </Tap>
          <T size={15} lh={20} color={C.text} style={{ flex: 1 }}>
            Product news and tips <T size={15} color={C.muted}>(optional)</T>
          </T>
          <T size={13} weight={500} color={C.muted} style={{ textDecorationLine: 'underline' }}>
            View
          </T>
        </Row>

        <Button
          label="Continue"
          height={58}
          disabled={!age}
          onPress={() => router.push('/onboarding/streak')}
          style={{ marginTop: 22 }}
        />
      </View>
    </View>
  );
}

const SHEET = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: C.white,
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
  paddingHorizontal: 22,
  paddingTop: 14,
  shadowColor: '#000',
  shadowOpacity: 0.16,
  shadowRadius: 40,
  shadowOffset: { width: 0, height: -12 },
  elevation: 24,
};

const GRABBER = {
  width: 56,
  height: 5,
  borderRadius: 3,
  backgroundColor: C.borderStrong,
  alignSelf: 'center' as const,
  marginBottom: 18,
};

const AGREE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  marginTop: 16,
  padding: 20,
  borderRadius: 16,
};
