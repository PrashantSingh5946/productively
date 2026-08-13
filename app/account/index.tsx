/**
 * 8.2 Your data.
 *
 * Drawn on the board as "Account & data", with an email row, a "Sign out" and a
 * "Delete account". There is no account to sign out of — the email it printed
 * was the *Google* one used to reach Drive, and "Sign out" silently called
 * `reset()`, which wipes the phone. What is here is what actually exists: the
 * archive, where it goes, and how to get it out or destroy it.
 */
import React, { useMemo } from 'react';
import { Alert, Linking, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, Row, RowItem, Spacer, T, Tap, TopBar } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { useStore } from '../../src/store';
import { useBackup } from '../../src/backup/context';
import { summarize } from '../../src/backup/archive';
import { agoLabel, sizeLabel } from '../../src/backup/format';
import { APP_LABEL } from '../../src/release';

import { useT } from '../../src/theming';
export default function Account() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, reset } = useStore();
  const backup = useBackup();

  // What the export would actually weigh, rather than a number on a mock-up.
  const { summary, bytes } = useMemo(
    () => ({ summary: summarize(state), bytes: JSON.stringify(state).length }),
    [state]
  );
  const backedUpAgo = agoLabel(backup.meta.lastBackupAt);
  const since = firstDay(state.sessions.map((s) => s.day));

  const confirmDelete = () =>
    Alert.alert(
      'Delete everything',
      'This wipes every routine, note and session on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            reset();
            // There is no onboarding to land on any more. A wiped account goes
            // to an empty Today, which is the same place a fresh install goes.
            router.replace('/(tabs)/home');
          },
        },
      ]
    );

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, flexGrow: 1 }}
      >
        <T d size={30} weight={800} lh={34} style={{ marginTop: 16 }}>
          Your data
        </T>

        <Grad colors={G.inkDeep} diag style={HERO}>
          <Row gap={10}>
            <Icon name="cloud" size={18} color={C.accent} />
            <T size={14} weight={700} color={C.accent}>
              LAST BACKUP · {backedUpAgo.toUpperCase()}
            </T>
          </Row>
          <T d size={24} weight={800} lh={29} color={C.onInk} style={{ marginTop: 14 }}>
            {summary.days > 0
              ? `${summary.days} ${summary.days === 1 ? 'day' : 'days'} of history`
              : 'No history yet'}
          </T>
          <T size={14} lh={21} color={C.onInkSoft} style={{ marginTop: 8 }}>
            {summary.routines} routines, {summary.tasks} tasks and {summary.notes} notes.
            {backup.settings.enabled
              ? ' Stored on this device, copied to your Drive on a schedule.'
              : ' Stored on this device only.'}
          </T>
          <Row gap={8} style={{ marginTop: 18 }}>
            <View style={darkPill()}>
              <T size={12} weight={600} color={C.onInkSoft}>
                {sizeLabel(bytes)}
              </T>
            </View>
            <View style={darkPill()}>
              <T size={12} weight={600} color={C.onInkSoft}>
                {since ? `Since ${since}` : 'No sessions yet'}
              </T>
            </View>
          </Row>
        </Grad>

        <Group title="This device" style={{ marginTop: 14 }}>
          <RowItem
            icon="cloud"
            label="Back up & sync"
            value={backup.settings.enabled ? `On · ${backedUpAgo.toLowerCase()}` : 'Off'}
            chevron
            onPress={() => router.push('/settings/backup')}
          />

          <RowItem
            icon="share"
            label="Export my data"
            chevron
            onPress={() => backup.exportToFile()}
          />

          <RowItem
            icon="download"
            label="Import a backup"
            chevron
            onPress={() => router.push('/settings/backup')}
          />
        </Group>

        {/* v3 takes Rate us, Contact us and the FAQs off Profile — they were
            four rows of housekeeping above the things people came to change.
            They keep working; they just live down here now. */}
        <Group title="Help & about" style={{ marginTop: 12 }}>
          <RowItem icon="help" label="FAQs" chevron onPress={() => router.push('/guide')} />
          <RowItem
            icon="headset"
            label="Contact us"
            chevron
            onPress={() => router.push('/contact')}
          />
          <RowItem icon="flask" label="Labs" chevron onPress={() => router.push('/labs')} />
          <RowItem
            icon="star"
            label="Rate us"
            external
            onPress={() =>
              Linking.openURL('market://details?id=com.productively.app').catch(() => {})
            }
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

        <View style={{ marginTop: 18, gap: 14, paddingHorizontal: 4 }}>
          <Tap onPress={confirmDelete}>
            <T size={15} weight={600} color={C.over}>
              Delete everything
            </T>
          </Tap>
        </View>

        <Spacer />
        <T size={12.5} weight={500} center color={C.wisp} style={{ paddingBottom: 16 }}>
          {APP_LABEL}
        </T>
      </ScrollView>
    </View>
  );
}

/** Earliest recorded session, as "14 Mar". Null when nothing has been run. */
function firstDay(days: string[]): string | null {
  if (!days.length) return null;
  const earliest = days.slice().sort()[0];
  const d = new Date(`${earliest}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const HERO = { marginTop: 22, padding: 22, borderRadius: 22 };

/** A factory, not a const — `onInkWash` flips with the theme. */
const darkPill = () => ({
  paddingVertical: 7,
  paddingHorizontal: 13,
  borderRadius: 999,
  backgroundColor: C.onInkWash,
});
