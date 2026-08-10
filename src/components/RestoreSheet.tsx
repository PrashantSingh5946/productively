/**
 * The list of backups sitting in the user's Drive app folder.
 *
 * Opened from the Backup screen. Loads on show rather than on mount so the
 * list is never stale, and stays useful when it is empty — an account with no
 * backups yet is the common case right after connecting.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Row, Sheet, T, Tap, rowSkin } from '../ui';
import { Icon } from '../icons';
import { C, RADIUS } from '../theme';
import { useT } from '../theming';
import { useBackup } from '../backup/context';
import type { DriveFile } from '../backup/drive';
import { contentsLabel, sizeLabel, stampLabel } from '../backup/format';

export function RestoreSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (file: DriveFile) => void;
}) {
  const t = useT();
  const { list } = useBackup();
  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFiles(null);
    setError(null);
    try {
      setFiles(await list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach Google Drive.');
    }
  }, [list]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800} style={{ marginBottom: 4 }}>
        Restore from Drive
      </T>
      <T size={13.5} lh={20} color={C.muted} style={{ marginBottom: 16 }}>
        The five most recent backups are kept. Restoring replaces what is on this
        device.
      </T>

      {files === null && !error ? (
        <Row gap={10} style={{ paddingVertical: 26, justifyContent: 'center' }}>
          <ActivityIndicator color={C.muted} />
          <T size={14} color={C.muted}>
            Looking for backups…
          </T>
        </Row>
      ) : null}

      {error ? (
        <Tap onPress={load}>
          <View
            style={[
              rowSkin(),
              { padding: 16, borderRadius: RADIUS.row, alignItems: 'center', gap: 6 },
            ]}
          >
            <T size={14} weight={700} color={C.danger} center>
              {error}
            </T>
            <T size={13} color={C.muted}>
              Tap to try again
            </T>
          </View>
        </Tap>
      ) : null}

      {files?.length === 0 ? (
        <View style={{ paddingVertical: 22, alignItems: 'center', gap: 8 }}>
          <Icon name="cloud" size={30} color={C.faint} />
          <T size={14} color={C.muted} center>
            No backups in this account yet.
          </T>
        </View>
      ) : null}

      {files?.length ? (
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10, paddingBottom: 4 }}>
            {files.map((f, i) => (
              <Tap key={f.id} onPress={() => onPick(f)}>
                <Row
                  gap={14}
                  style={[rowSkin(), { padding: 15, borderRadius: RADIUS.row, minHeight: 44 }]}
                >
                  <Icon name="cloudDown" size={22} color={i === 0 ? C.accentIcon : C.textMid} />
                  <View style={{ flex: 1 }}>
                    <T size={15.5} weight={700}>
                      {stampLabel(f.modifiedAt)}
                      {i === 0 ? '  ·  Latest' : ''}
                    </T>
                    <T size={13} color={C.muted} style={{ marginTop: 4 }}>
                      {describe(f)}
                    </T>
                  </View>
                  <Icon name="chevR" size={16} color={t.faint} />
                </Row>
              </Tap>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

/** Drive gives us back the counts we tucked into appProperties at upload. */
function describe(f: DriveFile): string {
  const routines = Number(f.props.routines ?? 0);
  const days = Number(f.props.days ?? 0);
  const size = sizeLabel(f.size);
  return routines || days ? `${contentsLabel(routines, days)}  ·  ${size}` : size;
}
