/**
 * Labs — reachable from Profile. The board lists the row but not the page, so
 * this holds the experiments the "where I'd go next" note calls out.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, Row, RowItem, T, Toggle, TopBar } from '../src/ui';
import { Icon } from '../src/icons';
import { C, G } from '../src/theme';
import { useStore } from '../src/store';
import { testReminder } from '../src/alarms';

import { useT } from '../src/theming';
const EXPERIMENTS = [
  { key: 'statusBarTimer', label: 'Status bar timer', body: 'Keep the countdown visible outside the app.' },
  { key: 'landscape', label: 'Landscape timer', body: 'Rotate the dial for a desk-side run.' },
] as const;

export default function Labs() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const [sent, setSent] = useState<string | undefined>();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <T d size={30} weight={800} style={{ marginTop: 16 }}>
        Labs
      </T>
      <T size={15} lh={23} color={C.muted} style={{ marginTop: 14 }}>
        Half-finished ideas. They're free too — they just might move or disappear.
      </T>

      <Group title="Experiments" style={{ marginTop: 22 }}>
        {EXPERIMENTS.map((e) => (
          <Row key={e.key} gap={14} style={{ paddingVertical: 15 }}>
            <View style={{ flex: 1 }}>
              <T size={16} weight={700}>
                {e.label}
              </T>
              <T size={13} lh={19} color={C.muted} style={{ marginTop: 4 }}>
                {e.body}
              </T>
            </View>
            <Toggle
              on={
                e.key === 'statusBarTimer'
                  ? state.settings.statusBarTimer
                  : state.settings.timer.landscape
              }
              onChange={(v) =>
                set((d) => {
                  if (e.key === 'statusBarTimer') d.settings.statusBarTimer = v;
                  else d.settings.timer.landscape = v;
                })
              }
            />
          </Row>
        ))}
      </Group>

      <Group title="Reminders" style={{ marginTop: 12 }}>
        <RowItem
          label="Send a test reminder"
          value={sent}
          chevron={!sent}
          onPress={async () => {
            const r = state.routines[0];
            if (!r) return setSent('No routines');
            const ok = await testReminder(r, !state.settings.timeFormat12);
            // Says which of the two gates stopped it, rather than failing mute:
            // the switch in Settings is the app's intent, the grant is Android's.
            setSent(ok ? 'In 5 seconds…' : 'Notifications blocked');
          }}
        />
      </Group>

      <Grad colors={G.accentWash} diag style={NOTE()}>
        <Icon name="flask" size={20} color={C.accentInkSoft} />
        <T size={13.5} lh={20} color={C.accentText} style={{ flex: 1 }}>
          Next up: the routine editor, a dark pass across every screen, and home-screen widgets.
        </T>
      </Grad>
    </View>
  );
}

const NOTE = () => ({
  marginTop: 18,
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderRadius: 18,
  borderWidth: 1.5,
  borderColor: C.accentWashBorder,
  flexDirection: 'row' as const,
  gap: 12,
});
