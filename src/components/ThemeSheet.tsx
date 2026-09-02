/**
 * Settings ▸ System ▸ Theme.
 *
 * Four accent swatches and Light / Dark / System, on the App-icon screen's
 * selected-row pattern (tint card + check coin), above a live mini-preview.
 * Selection applies immediately — the token set is swapped at the root, so
 * there is no per-screen work and nothing to restart.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  CheckCoin,
  Grad,
  Overline,
  Ring,
  Row,
  Sheet,
  T,
  Tap,
  rowSkin,
  tintSkin,
} from '../ui';
import { Icon } from '../icons';
import { ACCENTS, ACCENT_KEYS, AccentKey, C, G, RADIUS, accentSwatch } from '../theme';
import { useStore } from '../store';
import { ThemePref, useT } from '../theming';

const MODES: { key: ThemePref; label: string; note: string }[] = [
  { key: 'Light', label: 'Light', note: 'Warm paper' },
  { key: 'Dark', label: 'Dark', note: 'Low light' },
  { key: 'System', label: 'System', note: 'Follows your device' },
];

export function ThemeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const { state, set } = useStore();
  const s = state.settings;
  const pickAccent = (key: AccentKey) => {
    set((d) => {
      d.settings.accent = key;
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T d size={22} weight={800}>
        Theme
      </T>

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
        <Overline style={{ marginTop: 20 }}>Accent</Overline>
        <Row gap={10} style={{ marginTop: 12 }}>
          {ACCENT_KEYS.map((key) => {
            const on = s.accent === key;
            const swatch = accentSwatch(key);
            return (
              <Tap key={key} onPress={() => pickAccent(key)} style={{ flex: 1 }}>
                <View
                  style={[
                    {
                      alignItems: 'center',
                      gap: 9,
                      paddingVertical: 14,
                      borderRadius: RADIUS.tile,
                      minHeight: 44,
                    },
                    on
                      ? [{ backgroundColor: t.accentTintFrom }, tintSkin()]
                      : [rowSkin(), { borderRadius: RADIUS.tile }],
                  ]}
                >
                  <Grad
                    colors={[swatch.from, swatch.to]}
                    diag
                    style={{ width: 34, height: 34, borderRadius: 17 }}
                  />
                  <T size={12.5} weight={700} color={on ? t.accentText : t.textMid}>
                    {ACCENTS[key].label}
                  </T>
                </View>
              </Tap>
            );
          })}
        </Row>

        <Overline style={{ marginTop: 24 }}>Appearance</Overline>
        <View style={{ gap: 10, marginTop: 12 }}>
          {MODES.map((m) => {
            const on = s.theme === m.key;
            return (
              <Tap
                key={m.key}
                onPress={() =>
                  set((d) => {
                    d.settings.theme = m.key;
                  })
                }
              >
                <Row
                  gap={14}
                  style={[
                    {
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: RADIUS.row,
                      minHeight: 44,
                    },
                    on
                      ? [{ backgroundColor: t.accentTintFrom }, tintSkin()]
                      : [rowSkin(), { borderRadius: RADIUS.row }],
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <T size={16} weight={700} color={on ? t.accentText : t.ink}>
                      {m.label}
                    </T>
                    <T size={12.5} color={on ? t.accentText : t.muted} style={{ marginTop: 2 }}>
                      {m.note}
                    </T>
                  </View>
                  <CheckCoin size={26} on={on} />
                </Row>
              </Tap>
            );
          })}
        </View>

        <Overline style={{ marginTop: 24 }}>Preview</Overline>
        <Preview />
      </ScrollView>

      <Button label="Done" onPress={onClose} style={{ marginTop: 18 }} />
    </Sheet>
  );
}

/** The 7.5-style mini card, drawn from the same tokens the app uses. */
function Preview() {
  const t = useT();
  return (
    <View
      style={[
        { marginTop: 12, padding: 16, borderRadius: RADIUS.card, gap: 14 },
        rowSkin(),
        { borderRadius: RADIUS.card },
      ]}
    >
      <Row gap={14}>
        <Ring size={56} thickness={7} progress={0.68}>
          <T d size={13} weight={800}>
            68%
          </T>
        </Ring>
        <View style={{ flex: 1, gap: 6 }}>
          <T d size={16} weight={800}>
            Morning routine
          </T>
          <Row gap={6}>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 9,
                borderRadius: 999,
                backgroundColor: t.accentTintTo,
                borderWidth: 1,
                borderColor: t.accentTintBorder,
              }}
            >
              <T size={11} weight={700} color={t.accentText}>
                Next up
              </T>
            </View>
            <T size={11.5} weight={700} color={t.good}>
              92%
            </T>
          </Row>
        </View>
        <Grad
          colors={G.accent}
          diag
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="play" size={17} color={C.accentOn} />
        </Grad>
      </Row>

      <Row gap={8}>
        <View
          style={{
            flex: 1,
            height: 44,
            borderRadius: 999,
            backgroundColor: t.inkTo,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T d size={14} weight={700} color={t.onInk}>
            Primary
          </T>
        </View>
        <Grad
          colors={G.accent}
          diag
          style={{ flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <T d size={14} weight={700} color={C.accentOn}>
            Start
          </T>
        </Grad>
      </Row>
    </View>
  );
}
