/**
 * 7.9 Backup — Google Drive sync, plus the account-free export and import.
 *
 * Laid out the way the rest of Settings is: one hero card carrying the single
 * decisive action, then grouped rows. Every destructive path (restore, import,
 * disconnect) asks first and says exactly what it will do.
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Group,
  Overline,
  Row,
  RowItem,
  T,
  Toggle,
  TopBar,
  Dialog,
  tintSkin,
} from '../../src/ui';
import { WheelSheet } from '../../src/components/WheelSheet';
import { RestoreSheet } from '../../src/components/RestoreSheet';
import { Icon } from '../../src/icons';
import { C, RADIUS } from '../../src/theme';
import { useT } from '../../src/theming';
import { useBackup } from '../../src/backup/context';
import type { Archive } from '../../src/backup/archive';
import {
  FREQUENCIES,
  FREQUENCY_LABEL,
  NETWORK_LABEL,
  BackupFrequency,
} from '../../src/backup/settings';
import { agoLabel, contentsLabel, sizeLabel, stampLabel } from '../../src/backup/format';

type Field = 'frequency' | 'network' | null;

/** What the user picked, held until they confirm how to apply it. */
type Pending = { archive: Archive; tampered: boolean; from: string };

export default function BackupScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const b = useBackup();
  const s = b.settings;

  const [field, setField] = useState<Field>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const off = !b.configured;
  const connected = b.configured && b.signedIn;

  const confirmDisconnect = () =>
    Alert.alert(
      'Disconnect Google Drive?',
      'Automatic backups stop. Backups already in Drive are left alone — you can reconnect and restore from them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => b.disconnect() },
      ]
    );

  const pickFromDrive = useCallback(
    async (fileId: string, stamp: string) => {
      setRestoreOpen(false);
      setWorking('Fetching backup…');
      const r = await b.fetchOne(fileId);
      setWorking(null);
      if (!r.ok) {
        if (r.reason) Alert.alert('Could not restore', r.reason);
        return;
      }
      setPending({ archive: r.archive, tampered: r.tampered, from: stamp });
    },
    [b]
  );

  const importFile = useCallback(async () => {
    const r = await b.importFromFile();
    if (!r.ok) {
      // A null reason is the user backing out of the picker, not a failure.
      if (r.reason) Alert.alert('Could not import', r.reason);
      return;
    }
    setPending({
      archive: r.archive,
      tampered: r.tampered,
      from: stampLabel(Date.parse(r.archive.createdAt)),
    });
  }, [b]);

  const applyPending = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    b.apply(pending.archive, mode);
    setPending(null);
    router.replace('/(tabs)/home');
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}
    >
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <T d size={30} weight={800} style={{ marginTop: 16 }}>
          Backup
        </T>

        {/* ── hero ─────────────────────────────────────────────── */}
        <Card style={{ marginTop: 20, padding: 22 }}>
          <Row gap={12}>
            <View
              style={[
                tintSkin(),
                {
                  width: 42,
                  height: 42,
                  borderRadius: RADIUS.coin,
                  backgroundColor: C.accentTintFrom,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Icon name={connected ? 'cloudUp' : 'cloud'} size={22} color={C.accentIcon} />
            </View>
            <View style={{ flex: 1 }}>
              <Overline>{connected ? 'Last backup' : 'Google Drive'}</Overline>
              <T d size={22} weight={800} style={{ marginTop: 3 }}>
                {heroTitle(off, connected, b.meta.lastBackupAt)}
              </T>
            </View>
          </Row>

          <T size={13.5} lh={20} color={C.muted} style={{ marginTop: 12 }}>
            {heroBody(off, connected, b)}
          </T>

          {b.phase === 'error' && b.message ? (
            <Row gap={8} style={{ marginTop: 12 }}>
              <Icon name="x" size={15} color={C.danger} />
              <T size={13.5} weight={600} color={C.danger} style={{ flex: 1 }}>
                {b.message}
              </T>
            </Row>
          ) : null}

          {off ? null : (
            <Button
              label={connected ? 'Back up now' : 'Connect Google Drive'}
              kind="accent"
              height={54}
              disabled={b.busy}
              icon={connected ? 'cloudUp' : undefined}
              onPress={() => (connected ? b.backupNow() : b.connect())}
              style={{ marginTop: 18 }}
            />
          )}

          {b.busy || b.exporting ? (
            <Row gap={9} style={{ marginTop: 12, justifyContent: 'center' }}>
              <ActivityIndicator color={C.muted} />
              <T size={13} color={C.muted}>
                {b.exporting
                  ? 'Preparing the file…'
                  : connected
                    ? 'Backing up…'
                    : 'Talking to Google…'}
              </T>
            </Row>
          ) : null}
        </Card>

        {/* ── account ──────────────────────────────────────────────
            The only sign-in left in the app, and it is Google's, not ours. */}
        {off ? null : (
          <Group title="Google account" style={{ marginTop: 14 }}>
            {connected ? (
              <Row gap={14} style={{ paddingVertical: 15 }}>
                <Icon name="mail" size={20} color={C.textMid} />
                <View style={{ flex: 1 }}>
                  <T size={16} weight={700}>
                    {b.account?.name ?? 'Google account'}
                  </T>
                  <T size={13.5} color={C.muted} style={{ marginTop: 4 }}>
                    {b.account?.email ?? 'Connected'}
                  </T>
                </View>
              </Row>
            ) : (
              <RowItem
                icon="cloud"
                label="Connect a Google account"
                chevron
                onPress={() => b.connect()}
              />
            )}
            {connected ? (
              <RowItem
                icon="x"
                label="Disconnect"
                labelColor={C.danger}
                onPress={confirmDisconnect}
              />
            ) : null}
          </Group>
        )}

        {/* ── schedule ─────────────────────────────────────────── */}
        {connected ? (
          <Group title="Schedule" style={{ marginTop: 14 }}>
            <Row style={{ paddingVertical: 13 }}>
              <View style={{ flex: 1 }}>
                <T size={16} weight={700}>
                  Back up to Drive
                </T>
                <T size={13} color={C.muted} style={{ marginTop: 4 }}>
                  Runs on Wi-Fi in the background
                </T>
              </View>
              <Toggle on={s.enabled} onChange={(v) => b.update({ enabled: v })} />
            </Row>
            <RowItem
              label="Frequency"
              value={FREQUENCY_LABEL[s.frequency]}
              onPress={() => setField('frequency')}
            />
            <RowItem
              label="Back up over"
              value={NETWORK_LABEL[s.network]}
              onPress={() => setField('network')}
            />
            <Row style={{ paddingVertical: 13 }}>
              <View style={{ flex: 1 }}>
                <T size={16} weight={700}>
                  Include journal notes
                </T>
                <T size={13} color={C.muted} style={{ marginTop: 4 }}>
                  Off keeps notes on this device only
                </T>
              </View>
              <Toggle
                on={s.includeNotes}
                onChange={(v) => b.update({ includeNotes: v })}
              />
            </Row>
          </Group>
        ) : null}

        {/* ── restore & export ─────────────────────────────────── */}
        <Group title="Restore" style={{ marginTop: 14 }}>
          {connected ? (
            <RowItem
              icon="cloudDown"
              label="Restore from Drive"
              chevron
              onPress={() => setRestoreOpen(true)}
            />
          ) : null}
          <RowItem icon="download" label="Import from a file" chevron onPress={importFile} />
        </Group>

        <Group title="Export" style={{ marginTop: 14 }}>
          <RowItem
            icon="share"
            label="Export a copy"
            value="JSON"
            onPress={() => b.exportToFile()}
          />
        </Group>

        <T size={12.5} lh={19} color={C.faint} style={{ marginTop: 16, paddingHorizontal: 4 }}>
          {off
            ? 'Exports are plain JSON — every routine, session, note and setting, readable in any text editor.'
            : 'Backups go to a private folder in your Drive that only Productively can see. They count against your Google storage, and the five most recent are kept.'}
        </T>
      </ScrollView>

      {/* ── overlays ───────────────────────────────────────────── */}
      <RestoreSheet
        visible={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onPick={(f) => pickFromDrive(f.id, stampLabel(f.modifiedAt))}
      />

      <WheelSheet
        visible={field === 'frequency'}
        title="Frequency"
        options={FREQUENCIES.map((f) => FREQUENCY_LABEL[f])}
        value={FREQUENCY_LABEL[s.frequency]}
        onClose={() => setField(null)}
        onDone={(v) => {
          const next = FREQUENCIES.find((f) => FREQUENCY_LABEL[f] === v);
          if (next) b.update({ frequency: next as BackupFrequency });
          setField(null);
        }}
      />

      <WheelSheet
        visible={field === 'network'}
        title="Back up over"
        options={[NETWORK_LABEL.wifi, NETWORK_LABEL.any]}
        value={NETWORK_LABEL[s.network]}
        onClose={() => setField(null)}
        onDone={(v) => {
          b.update({ network: v === NETWORK_LABEL.any ? 'any' : 'wifi' });
          setField(null);
        }}
      />

      <Dialog visible={!!working} onClose={() => {}}>
        <Row gap={12} style={{ justifyContent: 'center', paddingVertical: 6 }}>
          <ActivityIndicator color={C.muted} />
          <T size={15} weight={600}>
            {working}
          </T>
        </Row>
      </Dialog>

      <Dialog visible={!!pending} onClose={() => setPending(null)}>
        {pending ? (
          <>
            <T d size={21} weight={800}>
              Restore this backup?
            </T>
            <T size={14} lh={21} color={C.textMid} style={{ marginTop: 10 }}>
              {pending.from} ·{' '}
              {contentsLabel(pending.archive.summary.routines, pending.archive.summary.days)}
              {pending.archive.omitted.includes('notes') ? ' · no journal notes' : ''}
            </T>
            {pending.tampered ? (
              <Row gap={8} style={{ marginTop: 12 }}>
                <Icon name="shield" size={16} color={C.over} />
                <T size={13} lh={19} color={C.over} style={{ flex: 1 }}>
                  This file has been edited since it was written. It will still restore.
                </T>
              </Row>
            ) : null}

            <View style={{ gap: 10, marginTop: 20 }}>
              <Button
                label="Replace everything"
                kind="accent"
                height={52}
                onPress={() => applyPending('replace')}
              />
              <Button
                label="Merge into what's here"
                kind="quiet"
                height={52}
                onPress={() => applyPending('merge')}
              />
              <Button
                label="Cancel"
                kind="ghost"
                height={48}
                onPress={() => setPending(null)}
              />
            </View>
          </>
        ) : null}
      </Dialog>
    </View>
  );
}

/* ── hero copy ────────────────────────────────────────────────────── */

function heroTitle(off: boolean, connected: boolean, at: number | null): string {
  if (off) return 'Not set up';
  if (!connected) return 'Not connected';
  return agoLabel(at);
}

function heroBody(off: boolean, connected: boolean, b: ReturnType<typeof useBackup>): string {
  if (off) {
    return 'This build ships without Google Drive credentials, so sync is unavailable. Exporting a copy to a file works as normal.';
  }
  if (!connected) {
    return 'Keep a copy of every routine, session and note in a private folder in your Google Drive, so a new phone picks up where this one left off.';
  }
  if (!b.meta.lastBackupAt) {
    return 'Nothing has been backed up yet. Run one now, or leave it to the schedule below.';
  }
  const size = sizeLabel(b.meta.lastSize);
  return `${size} in your Drive app folder · next run ${FREQUENCY_LABEL[
    b.settings.frequency
  ].toLowerCase()}`;
}
