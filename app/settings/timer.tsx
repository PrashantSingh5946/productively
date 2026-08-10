/** 7.7 Timer settings — live miniature of the timer screen over the switches. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dial, Grad, Row, T, Tap, Toggle, TopBar, cardSkin } from '../../src/ui';
import { Icon, IconName } from '../../src/icons';
import { C, G, TASK_TONES } from '../../src/theme';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
const DISPLAYS: { key: 'clock' | 'target' | 'alarm'; icon: IconName }[] = [
  { key: 'clock', icon: 'clock' },
  { key: 'target', icon: 'target' },
  { key: 'alarm', icon: 'alarm' },
];

export default function TimerSettings() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const t = state.settings.timer;

  const flip = <K extends keyof typeof t>(key: K) => (v: (typeof t)[K]) =>
    set((d) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d.settings.timer as any)[key] = v;
    });

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <T d size={30} weight={800} style={{ marginTop: 16 }}>
          Timer
        </T>

        <Grad colors={G.card} style={[PANEL, cardSkin()]}>
          <T size={12.5} weight={600} color={C.faint} style={{ paddingHorizontal: 4, paddingBottom: 12 }}>
            Timer screen
          </T>

          <Grad colors={G.stone} style={STAGE}>
            <View style={MINI()}>
              <T size={13} weight={700}>
                Drink water
              </T>
              <Dial size={106} thickness={9} progress={0.72} trackColor={C.trackRing}>
                <Icon name="bottle" size={20} color={TASK_TONES.water.fg} />
                {t.remainingTime ? (
                  <T d size={18} weight={800}>
                    04:56
                  </T>
                ) : (
                  <T d size={14} weight={800}>
                    Running
                  </T>
                )}
                {t.taskDuration ? (
                  <T size={9} weight={500} color={C.ghost}>
                    – 5m +
                  </T>
                ) : null}
              </Dial>
              <Row gap={16} style={{ marginTop: 2 }}>
                <Icon name="pause" size={14} color={C.ghost} />
                <Grad colors={G.ink} diag style={MINI_BTN}>
                  <Icon name="check" size={15} color={C.onInk} />
                </Grad>
                <Icon name="skip" size={14} color={C.ghost} />
              </Row>
              {t.nextTask ? (
                <Grad colors={G.chip} style={MINI_NEXT}>
                  <T size={9} weight={600} color={C.ghost}>
                    NEXT
                  </T>
                  <T size={10} weight={600} color={C.textSoft}>
                    Make the bed
                  </T>
                </Grad>
              ) : null}
            </View>
          </Grad>

          <Grad colors={G.stone} style={SEGS}>
            {DISPLAYS.map((d) => {
              const on = t.display === d.key;
              return (
                <Tap key={d.key} onPress={() => flip('display')(d.key)} style={{ flex: 1 }}>
                  {on ? (
                    <Grad colors={G.ink} diag style={SEG_ON}>
                      <Icon name={d.icon} size={18} color={C.onInk} />
                    </Grad>
                  ) : (
                    <View style={SEG_OFF}>
                      <Icon name={d.icon} size={18} color={C.muted} />
                    </View>
                  )}
                </Tap>
              );
            })}
          </Grad>

          <SwitchRow label="Remaining time" on={t.remainingTime} onChange={flip('remainingTime')} />
          <SwitchRow label="Task duration" on={t.taskDuration} onChange={flip('taskDuration')} />
          <SwitchRow label="Next task" on={t.nextTask} onChange={flip('nextTask')} last />
        </Grad>

        <Grad colors={G.card} style={[GROUP, cardSkin()]}>
          <T size={12.5} weight={600} color={C.faint} style={{ paddingBottom: 10 }}>
            Focus options
          </T>
          <SwitchRow label="Keep screen on" on={t.keepScreenOn} onChange={flip('keepScreenOn')} pad />
          <SwitchRow label="Landscape mode" on={t.landscape} onChange={flip('landscape')} help pad />
          <SwitchRow label="Sticky notification" on={t.sticky} onChange={flip('sticky')} help pad />
        </Grad>

        <Grad colors={G.card} style={[GROUP, cardSkin()]}>
          <T size={12.5} weight={600} color={C.faint} style={{ paddingBottom: 10 }}>
            Plug-ins
          </T>
          <SwitchRow label="End-of-routine summary" on={t.summary} onChange={flip('summary')} pad />
          <SwitchRow label="Mood review" on={t.moodReview} onChange={flip('moodReview')} pad />
        </Grad>
      </ScrollView>
    </View>
  );
}

function SwitchRow({
  label,
  on,
  onChange,
  last,
  help,
  pad,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  help?: boolean;
  pad?: boolean;
}) {
  return (
    <Row
      gap={8}
      style={
        pad
          ? { paddingVertical: 12 }
          : { paddingTop: 15, paddingHorizontal: 4, paddingBottom: last ? 4 : 0 }
      }
    >
      <T size={15.5} weight={700}>
        {label}
      </T>
      {help ? <Icon name="help" size={14} color={C.ghost} /> : null}
      <View style={{ flex: 1 }} />
      <Toggle small on={on} onChange={onChange} />
    </Row>
  );
}

const PANEL = { marginTop: 20, padding: 16, borderRadius: 22 };
const GROUP = { marginTop: 14, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 22 };
const STAGE = { borderRadius: 18, padding: 18, alignItems: 'center' as const };
const MINI = () => ({
  width: 174,
  borderRadius: 16,
  backgroundColor: C.card,
  paddingVertical: 16,
  paddingHorizontal: 12,
  alignItems: 'center' as const,
  gap: 8,
});
const MINI_BTN = {
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const MINI_NEXT = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingVertical: 5,
  paddingHorizontal: 8,
  borderRadius: 8,
};
const SEGS = { flexDirection: 'row' as const, padding: 5, borderRadius: 999, marginTop: 16 };
const SEG_ON = {
  paddingVertical: 11,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const SEG_OFF = {
  paddingVertical: 11,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
