/** 7.1 Profile — the hub for account, support and everything else. */
import React from 'react';
import { Linking, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, IconButton, Overline, Row, RowItem, T, Tap, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, DOCK_CLEARANCE, G, IDENTITY } from '../../src/theme';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function Profile() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, streakFor } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Row style={{ justifyContent: 'space-between', paddingTop: 12 }}>
          <View>
            <Overline>Account</Overline>
            <T d size={30} weight={800} style={{ marginTop: 4 }}>
              Profile
            </T>
          </View>
          <IconButton icon="gear" onPress={() => router.push('/settings')} size={42} />
        </Row>

        <Tap onPress={() => router.push('/profile/edit')}>
          <Grad colors={G.card} style={[HEADER, cardSkin()]}>
            <View style={AVATAR}>
              <Icon name="user" size={32} color={IDENTITY.avatarSageInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Row gap={8}>
                <T d size={19} weight={800}>
                  {state.profile.name}
                </T>
                <Icon name="chevR" size={15} color={C.muted} />
              </Row>
              <T size={13.5} lh={20} color={C.muted} style={{ marginTop: 5 }}>
                {state.profile.intro}
              </T>
            </View>
          </Grad>
        </Tap>

        <Tap onPress={() => router.push('/free')}>
          <Grad colors={G.accentWash} diag style={FREE()}>
            <Icon name="spark" size={22} color={C.accentInkSoft} />
            <View style={{ flex: 1 }}>
              <T d size={17} weight={800} lh={21}>
                Every feature, always free
              </T>
              <T size={13} weight={500} color={C.accentInk} style={{ marginTop: 5 }}>
                No plans, no ads, no locked layouts
              </T>
            </View>
          </Grad>
        </Tap>

        <Group title="Account" style={{ marginTop: 16 }}>
          <RowItem
            icon="user"
            label="Account & data"
            chevron
            onPress={() => router.push('/account')}
          />
          <RowItem
            icon="cloud"
            label="Backup & sync"
            value={state.settings.backup.enabled ? 'On' : 'Off'}
            onPress={() => router.push('/settings/backup')}
          />
        </Group>

        <Group title="Support" style={{ marginTop: 12 }}>
          <RowItem icon="help" label="FAQs" chevron onPress={() => router.push('/guide')} />
          <RowItem
            icon="headset"
            label="Contact us"
            chevron
            onPress={() => router.push('/contact')}
          />
        </Group>

        <Group title="Info & more" style={{ marginTop: 12 }}>
          <RowItem
            icon="compass"
            label="User guide"
            chevron
            onPress={() => router.push('/guide')}
          />
          <RowItem icon="flask" label="Labs" chevron onPress={() => router.push('/labs')} />
          <RowItem
            icon="star"
            label="Rate us"
            external
            onPress={() => Linking.openURL('market://details?id=com.productively.app').catch(() => {})}
          />
          <RowItem
            icon="share"
            label="Share with a friend"
            external
            onPress={() =>
              Share.share({
                message:
                  'Productively — routine tracking that stays out of the way. Every feature free.',
              }).catch(() => {})
            }
          />
        </Group>

        <T size={12.5} weight={500} center color={C.wisp} style={{ marginTop: 22 }}>
          {streakFor('morning')} days in · Productively 1.4.2
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

const FREE = () => ({
  marginTop: 12,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 22,
  borderWidth: 1.5,
  borderColor: C.accentWashBorder,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
});
