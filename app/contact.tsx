/** 9.3 Contact us — each topic routes itself to the right mailbox. */
import React from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, RowItem, Spacer, T, Tap, TopBar } from '../src/ui';
import { Icon } from '../src/icons';
import { C, G } from '../src/theme';
import { CONTACT_TOPICS } from '../src/data';

import { useT } from '../src/theming';
const mailto = (subject: string) =>
  `mailto:hello@productively.app?subject=${encodeURIComponent(`[${subject}] Productively 1.4.2`)}`;

export default function Contact() {
  useT();
  const insets = useSafeAreaInsets();

  const open = (subject: string) => Linking.openURL(mailto(subject)).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <T d size={30} weight={800} style={{ marginTop: 16 }}>
        Contact us
      </T>
      <T size={15} lh={23} color={C.muted} style={{ marginTop: 14 }}>
        Pick the closest thing and we'll route it to the right person. Usually a reply within a day.
      </T>

      <Group title="Report a problem" style={{ marginTop: 22 }}>
        {CONTACT_TOPICS.map((t) => (
          <RowItem key={t} label={t} external onPress={() => open(t)} />
        ))}
      </Group>

      <Tap onPress={() => open('Feature request')}>
        <Grad colors={G.accentWash} diag style={SUGGEST()}>
          <Icon name="spark" size={20} color={C.accentInkSoft} />
          <View style={{ flex: 1 }}>
            <T size={15} weight={700} lh={20}>
              Suggest a feature
            </T>
            <T size={13} lh={18} color={C.accentInk} style={{ marginTop: 4 }}>
              The roadmap is mostly built from these
            </T>
          </View>
          <Icon name="chevR" size={17} color={C.accentInkSoft} />
        </Grad>
      </Tap>

      <Spacer />
      <T
        size={12.5}
        weight={500}
        center
        color={C.wisp}
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        Productively 1.4.2 · Android
      </T>
    </View>
  );
}

const SUGGEST = () => ({
  marginTop: 14,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 22,
  borderWidth: 1.5,
  borderColor: C.accentWashBorder,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
});
