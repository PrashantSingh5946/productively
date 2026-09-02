/**
 * 3.1 Profile.
 *
 * v2 stacked four groups here — Your data, Support, Info & more, and a "every
 * feature is free" banner — which put Rate us and FAQs at the same level as
 * the things people actually come to this screen to change. v3 leads with
 * Customize instead and moves the support rows down into Account & data, where
 * a question about the app is next to the app's own record of you.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, IconButton, Row, RowItem, T, Tap, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { ACCENT_KEYS, C, DOCK_CLEARANCE, G, IDENTITY, accentSwatch } from '../../src/theme';
import { bestStreak } from '../../src/analytics';
import { useStore } from '../../src/store';
import { APP_LABEL } from '../../src/release';

import { useT } from '../../src/theming';
export default function Profile() {
  useT();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const leader = bestStreak(state.routines, state.sessions);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', paddingTop: 12 }}>
          <T d size={30} weight={800}>
            Profile
          </T>
          <IconButton icon="gear" onPress={() => router.push('/settings')} size={42} />
        </Row>

        <Tap onPress={() => router.push('/profile/edit')}>
          <Grad colors={G.card} style={[HEADER, cardSkin()]}>
            <View style={AVATAR}>
              <Icon name="user" size={32} color={IDENTITY.avatarSageInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Row gap={8}>
                <T d size={19} weight={800} color={state.profile.name ? undefined : C.faint}>
                  {state.profile.name || 'Add your name'}
                </T>
                <Icon name="chevR" size={15} color={C.muted} />
              </Row>
              {/* Empty until the user writes one — the card is already a tap
                  target for the editor, so the prompt is the whole affordance. */}
              <T
                size={13.5}
                lh={20}
                color={state.profile.intro ? C.muted : C.faint}
                style={{ marginTop: 5 }}
              >
                {state.profile.intro || 'Say something about yourself'}
              </T>
            </View>
          </Grad>
        </Tap>

        <Group title="Customize" style={{ marginTop: 16 }}>
          <RowItem
            icon="moon"
            label="Theme"
            value={state.settings.theme}
            chevron
            onPress={() => router.push('/settings/customize')}
          />
          <RowItem
            icon="drop"
            label="Accent colour"
            chevron
            onPress={() => router.push('/settings/customize')}
            right={<AccentStack />}
          />
        </Group>

        <Group title="Routine" style={{ marginTop: 12 }}>
          <RowItem
            icon="list"
            label="Home screen"
            chevron
            onPress={() => router.push('/settings/home-screen')}
          />
          <RowItem
            icon="clock"
            label="Timer"
            chevron
            onPress={() => router.push('/settings/timer')}
          />
        </Group>

        <Group title="Data" style={{ marginTop: 12 }}>
          <RowItem
            icon="shield"
            label="Backup & export"
            value={state.settings.backup.enabled ? 'Google Drive' : 'On this device'}
            onPress={() => router.push('/settings/backup')}
          />
          <RowItem
            icon="user"
            label="Account & data"
            chevron
            onPress={() => router.push('/account')}
          />
        </Group>

        <T size={12.5} weight={500} center color={C.wisp} style={{ marginTop: 22 }}>
          {/* A routine exists from the moment onboarding ends, so `leader` is
              truthy before anything has been run — the footer read "0 days in".
              The brag only earns its place once there is a streak to brag about. */}
          {leader && leader.streak > 0 ? `${leader.streak} days in · ` : ''}
          {APP_LABEL}
        </T>
      </ScrollView>
    </View>
  );
}

const HEADER = {
  marginTop: 18,
  padding: 18,
  borderRadius: 22,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 16,
};

const AVATAR = {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: IDENTITY.avatarSage,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/**
 * The three overlapping coins on the Accent colour row.
 *
 * The live accent leads, so the row still reports the current choice at a
 * glance; the two behind it are the nearest presets, there to say the row is a
 * picker rather than a swatch. They overlap by a third, which is what stops
 * three circles in a line from reading as a progress indicator.
 */
function AccentStack() {
  const { state } = useStore();
  const others = ACCENT_KEYS.filter((k) => k !== state.settings.accent).slice(0, 2);
  return (
    <Row style={{ marginRight: 10 }}>
      {[state.settings.accent, ...others].map((a, i) => {
        const sw = accentSwatch(a);
        return (
          <Grad
            key={i}
            colors={[sw.from, sw.to]}
            diag
            style={[COIN(), i > 0 && { marginLeft: -6 }]}
          />
        );
      })}
    </Row>
  );
}

const COIN = () => ({
  width: 18,
  height: 18,
  borderRadius: 9,
  borderWidth: 2,
  borderColor: C.card,
});
