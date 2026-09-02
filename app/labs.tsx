/**
 * Labs — reachable from Profile. The board lists the row but not the page, so
 * this holds the experiments the "where I'd go next" note calls out.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, RowItem, T, TopBar } from '../src/ui';
import { Icon } from '../src/icons';
import { C, G } from '../src/theme';
import { useStore } from '../src/store';
import { testReminder } from '../src/alarms';

import { useT } from '../src/theming';
export default function Labs() {
  useT();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [sent, setSent] = useState<string | undefined>();

  /**
   * Clear the row's status again once the reminder has had time to arrive.
   * Without this it sat on "In 5 seconds…" for the rest of the session, and
   * `chevron={!sent}` stripped the chevron too, so the row read as spent.
   */
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(undefined), 8000);
    return () => clearTimeout(t);
  }, [sent]);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <T d size={30} weight={800} style={{ marginTop: 16 }}>
        Labs
      </T>
      <T size={15} lh={23} color={C.muted} style={{ marginTop: 14 }}>
        Half-finished ideas. They might move, change shape, or disappear.
      </T>

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
          Next up: home-screen widgets, and a Live Activity for a running routine.
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
