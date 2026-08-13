/**
 * 1.9 Permissions — consent, then the alarm ask.
 *
 * The board draws this as one picture: the alarm-permission step dimmed behind
 * a consent sheet. Copied literally that is a screen with a large dark button
 * on it that cannot be pressed — the backdrop carries `pointerEvents: 'none'`,
 * and nothing in the app requested a permission or scheduled anything anyway.
 *
 * So the picture is the first of two phases rather than the whole screen. The
 * consent sheet closes onto the same layout, undimmed and live, and "Allow
 * alarms" asks Android for real.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Row, T, Tap, cardSkin, rowSkin } from '../../src/ui';
import { StepHeader } from '../../src/components/OnboardingChrome';
import { Icon } from '../../src/icons';
import { C, G, RADIUS, SHADOW } from '../../src/theme';
import { requestAlarms } from '../../src/alarms';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function Permissions() {
  useT();
  const insets = useSafeAreaInsets();
  const { set } = useStore();
  const [age, setAge] = useState(false);
  const [news, setNews] = useState(false);
  const [consented, setConsented] = useState(false);
  const [asking, setAsking] = useState(false);
  /** null = not asked yet. */
  const [granted, setGranted] = useState<boolean | null>(null);
  const all = age && news;

  const next = () => router.push('/onboarding/streak');

  const ask = async () => {
    setAsking(true);
    const ok = await requestAlarms();
    setGranted(ok);
    // The switch records what the user asked for. Android can revoke the grant
    // later without telling us; `syncAlarms` re-checks it every time it runs,
    // so storing the intent here cannot leave a lie behind.
    set((d) => {
      d.settings.alarms = ok;
    });
    setAsking(false);
    if (ok) next();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 22,
          opacity: consented ? 1 : 0.62,
          pointerEvents: consented ? 'auto' : 'none',
        }}
      >
        <StepHeader progress={1} />
        <T d size={30} weight={800} lh={37} center style={{ marginTop: 30 }}>
          We'll help you remember your routine
        </T>

        <Grad
          colors={G.card}
          style={[{ marginTop: 30, borderRadius: RADIUS.card, padding: 24, alignItems: 'center' }, cardSkin()]}
        >
          <T d size={17} weight={700}>
            Alarm permission
          </T>
          <T size={13.5} lh={20} center color={C.muted} style={{ marginTop: 8 }}>
            {granted === false
              ? 'Android said no. You can turn notifications on for Productively in system settings, and reminders will start on their own.'
              : 'A notification a few minutes before each routine starts, on the days it runs. Nothing else.'}
          </T>

          <Tap onPress={ask} disabled={asking || granted === true} style={{ alignSelf: 'stretch' }}>
            <Grad
              colors={granted === true ? G.press : G.inkDeep}
              diag
              style={{
                marginTop: 16,
                height: 56,
                borderRadius: 999,
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
              }}
            >
              {granted === true ? <Icon name="check" size={19} color={C.textMid} /> : null}
              <T d size={16} weight={700} color={granted === true ? C.textMid : C.onInk}>
                {granted === true ? 'Reminders on' : asking ? 'Asking…' : 'Allow alarms'}
              </T>
            </Grad>
          </Tap>
        </Grad>

        {consented ? (
          <Tap onPress={next}>
            <T size={15} weight={600} center color={C.muted} style={{ marginTop: 22, padding: 12 }}>
              {granted === null ? 'Not now' : 'Continue'}
            </T>
          </Tap>
        ) : null}
      </View>

      {consented ? null : (
        <View style={[SHEET(), { paddingBottom: insets.bottom + 24 }]}>
          <View style={GRABBER()} />
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
            <Grad colors={G.card} style={[AGREE, rowSkin()]}>
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
            onPress={() => setConsented(true)}
            style={{ marginTop: 22 }}
          />
        </View>
      )}
    </View>
  );
}

const SHEET = () => ({
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: C.card,
  borderTopLeftRadius: RADIUS.sheet,
  borderTopRightRadius: RADIUS.sheet,
  borderTopWidth: 1,
  borderColor: C.hairline,
  paddingHorizontal: 22,
  paddingTop: 14,
  boxShadow: SHADOW.sheet,
});

const GRABBER = () => ({
  width: 44,
  height: 5,
  borderRadius: 3,
  backgroundColor: C.ring,
  alignSelf: 'center' as const,
  marginBottom: 18,
});

const AGREE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  marginTop: 16,
  padding: 20,
  borderRadius: 16,
};
