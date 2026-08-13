/**
 * A reset card's own content — the paced exercise behind "when you feel
 * anxious" and "when breathing feels hard".
 *
 * Both cards on Explore used to push `/guide`, the article index, which is
 * where every other card on that screen already went. A rescue card is tapped
 * mid-episode; five volumes on habit design is the wrong thing to hand someone
 * at that moment.
 *
 * The pacing is a plain interval rather than Reanimated: it drives one number
 * a second, and it has to keep time honestly even when the ring is idle.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Ring, Row, T, Tap, TopBar, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G, RADIUS } from '../../src/theme';
import { RESET_GUIDES } from '../../src/data';
import { useKeepAwake } from 'expo-keep-awake';
import { useT } from '../../src/theming';

export default function Reset() {
  useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const guide = RESET_GUIDES.find((g) => g.id === String(id));

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(guide?.steps[0].seconds ?? 0);
  const [rounds, setRounds] = useState(0);
  const [done, setDone] = useState(false);

  // Nobody wants the screen to sleep halfway through a breathing exercise.
  useKeepAwake();

  // A ref, because the tick closes over the step index and would otherwise
  // read whichever one was current when the interval was created.
  const at = useRef(0);
  at.current = step;

  useEffect(() => {
    if (!running || !guide) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        const next = at.current + 1;
        if (next < guide.steps.length) {
          setStep(next);
          return guide.steps[next].seconds;
        }
        if (guide.loop) {
          setRounds((r) => r + 1);
          setStep(0);
          return guide.steps[0].seconds;
        }
        setRunning(false);
        setDone(true);
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, guide]);

  if (!guide) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
        <TopBar onBack={() => router.back()} />
        <T size={16} color={C.muted} style={{ marginTop: 24 }}>
          That reset is no longer here.
        </T>
      </View>
    );
  }

  const current = guide.steps[step];
  const progress = current.seconds ? 1 - left / current.seconds : 0;

  const reset = () => {
    setRunning(false);
    setDone(false);
    setStep(0);
    setRounds(0);
    setLeft(guide.steps[0].seconds);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <T d size={29} weight={800} lh={35} style={{ marginTop: 14 }}>
          {guide.title}
        </T>
        <T size={15} lh={23} color={C.textMid} style={{ marginTop: 12 }}>
          {guide.lede}
        </T>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Ring size={228} progress={progress}>
            <T d size={22} weight={800} center style={{ paddingHorizontal: 24 }}>
              {done ? 'Finished' : current.label}
            </T>
            <T size={36} weight={800} color={C.accentInk}>
              {done ? '' : left}
            </T>
            {current.note && !done ? (
              <T size={12.5} lh={17} center color={C.muted} style={{ paddingHorizontal: 30 }}>
                {current.note}
              </T>
            ) : null}
          </Ring>

          <Row gap={12} style={{ marginTop: 24 }}>
            <Tap onPress={() => (done ? reset() : setRunning((v) => !v))}>
              <Grad colors={G.accent} diag style={CTA}>
                <Icon name={done ? 'refresh' : running ? 'pause' : 'play'} size={18} color={C.accentOn} />
                <T d size={16} weight={700}>
                  {done ? 'Again' : running ? 'Pause' : rounds || step || left < current.seconds ? 'Resume' : 'Start'}
                </T>
              </Grad>
            </Tap>
            {running || step || rounds ? (
              <Tap onPress={reset}>
                <View style={[QUIET(), { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <Icon name="refresh" size={17} color={C.textMid} />
                  <T d size={16} weight={700} color={C.textMid}>
                    Restart
                  </T>
                </View>
              </Tap>
            ) : null}
          </Row>

          {guide.loop && rounds ? (
            <T size={13.5} weight={600} color={C.muted} style={{ marginTop: 14 }}>
              {rounds} {rounds === 1 ? 'round' : 'rounds'}
            </T>
          ) : null}
        </View>

        <View style={{ gap: 10, marginTop: 28 }}>
          {guide.steps.map((s, i) => {
            const on = i === step && !done;
            return (
              <Grad
                key={s.label}
                colors={on ? G.accentWash : G.card}
                diag={on}
                style={[
                  STEP,
                  cardSkin(),
                  on && { borderWidth: 1.5, borderColor: C.accentWashBorder },
                ]}
              >
                <T size={13} weight={700} color={on ? C.accentInk : C.ghost} style={{ width: 22 }}>
                  {i + 1}
                </T>
                <View style={{ flex: 1 }}>
                  <T size={15} weight={700}>
                    {s.label}
                  </T>
                  {s.note ? (
                    <T size={13} lh={18} color={C.muted} style={{ marginTop: 3 }}>
                      {s.note}
                    </T>
                  ) : null}
                </View>
                <T size={13} weight={600} color={C.muted}>
                  {s.seconds}s
                </T>
              </Grad>
            );
          })}
        </View>

        <T size={13.5} lh={21} color={C.muted} style={{ marginTop: 20 }}>
          {guide.after}
        </T>
      </ScrollView>
    </View>
  );
}

const CTA = {
  height: 54,
  paddingHorizontal: 30,
  borderRadius: 999,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 10,
};

const QUIET = () => ({
  height: 54,
  paddingHorizontal: 24,
  borderRadius: 999,
  borderWidth: 1.5,
  borderColor: C.border,
  justifyContent: 'center' as const,
});

const STEP = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  padding: 16,
  borderRadius: RADIUS.tile,
};
