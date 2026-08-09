/** 8.2 Account & data. */
import React, { useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, Row, RowItem, Spacer, T, Tap, TopBar } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { useStore } from '../../src/store';

export default function Account() {
  const insets = useSafeAreaInsets();
  const { state, set, reset } = useStore();
  const [backedUpAgo] = useState('2 minutes ago');

  const taskCount = state.routines.reduce((s, r) => s + r.tasks.length, 0);

  const exportData = async () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile: state.profile,
        routines: state.routines,
        checklists: state.checklists,
        notes: state.notes,
        sessions: state.sessions,
      },
      null,
      2
    );
    await Share.share({ message: payload, title: 'Productively export' }).catch(() => {});
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete account',
      'This wipes every routine, note and session on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, flexGrow: 1 }}
      >
        <T d size={30} weight={800} lh={34} style={{ marginTop: 16 }}>
          Account & data
        </T>

        <Grad colors={G.inkDeep} diag style={HERO}>
          <Row gap={10}>
            <Icon name="shield" size={18} color={C.accent} />
            <T size={14} weight={700} color={C.accent}>
              LAST BACKUP · {backedUpAgo.toUpperCase()}
            </T>
          </Row>
          <T d size={24} weight={800} lh={29} color={C.white} style={{ marginTop: 14 }}>
            146 days of history
          </T>
          <T size={14} lh={21} color="rgba(255,255,255,0.6)" style={{ marginTop: 8 }}>
            {state.routines.length} routines, {taskCount} tasks and {state.notes.length} notes.
            Stored on this device, copied to your account each night.
          </T>
          <Row gap={8} style={{ marginTop: 18 }}>
            <View style={DARK_PILL}>
              <T size={12} weight={600} color="rgba(255,255,255,0.75)">
                2.4 MB
              </T>
            </View>
            <View style={DARK_PILL}>
              <T size={12} weight={600} color="rgba(255,255,255,0.75)">
                Since 14 Mar
              </T>
            </View>
          </Row>
        </Grad>

        <Group title="Account" style={{ marginTop: 14 }}>
          <Row gap={14} style={{ paddingVertical: 15 }}>
            <Icon name="mail" size={20} color={C.text} />
            <View style={{ flex: 1 }}>
              <T size={16} weight={700}>
                Email
              </T>
              <T size={13.5} color={C.muted} style={{ marginTop: 5 }}>
                p•••••@gmail.com
              </T>
            </View>
          </Row>

          <RowItem
            icon="shield"
            label="Back up & sync"
            value={state.settings.backupOn ? `On · ${backedUpAgo.replace(' minutes ago', 'm ago')}` : 'Off'}
            onPress={() =>
              set((d) => {
                d.settings.backupOn = !d.settings.backupOn;
              })
            }
          />

          <RowItem icon="share" label="Export my data" chevron onPress={exportData} />
        </Group>

        <View style={{ marginTop: 18, gap: 14, paddingHorizontal: 4 }}>
          <Tap
            onPress={() => {
              reset();
              router.replace('/onboarding/welcome');
            }}
          >
            <T size={15} weight={600} color={C.muted}>
              Sign out
            </T>
          </Tap>
          <Tap onPress={confirmDelete}>
            <T size={15} weight={600} color={C.over}>
              Delete account
            </T>
          </Tap>
        </View>

        <Spacer />
        <T size={12.5} weight={500} center color={C.wisp} style={{ paddingBottom: 16 }}>
          Productively 1.4.2
        </T>
      </ScrollView>
    </View>
  );
}

const HERO = { marginTop: 22, padding: 22, borderRadius: 22 };

const DARK_PILL = {
  paddingVertical: 7,
  paddingHorizontal: 13,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.1)',
};
