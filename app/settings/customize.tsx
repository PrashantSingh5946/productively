/**
 * 3.2 Customize.
 *
 * Takes the slot the Support rows had on Profile. Appearance and accent were
 * already reachable from Settings ▸ Theme as a bottom sheet; v3 promotes them
 * to a screen of their own and adds saved themes, which a sheet had nowhere to
 * put.
 */
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Grad,
  Group,
  Overline,
  Row,
  RowItem,
  T,
  Tap,
  Toggle,
  TopBar,
  cardSkin,
} from '../../src/ui';
import { WheelCoin } from '../../src/components/ColorWheel';
import { Icon } from '../../src/icons';
import {
  ACCENTS,
  ACCENT_KEYS,
  Accent,
  C,
  accentSwatch,
  isAccentKey,
} from '../../src/theme';
import { useStore } from '../../src/store';
import { useT, useThemeInfo } from '../../src/theming';

export default function Customize() {
  const t = useT();
  const { mode } = useThemeInfo();
  const insets = useSafeAreaInsets();
  const { state, set, removeTheme } = useStore();
  const s = state.settings;
  const system = s.theme === 'System';

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <T d size={30} weight={800} style={{ marginTop: 16 }}>
          Customize
        </T>

        <Group title="Appearance" style={{ marginTop: 20 }}>
          {/*
            The board draws one "Dark theme" switch. A single switch cannot say
            "follow the phone", which is the setting most people are actually
            on — so System keeps its own row and takes precedence, and the dark
            switch reports the resolved mode while it is on.
          */}
          <RowItem
            label="Match system"
            right={
              <Toggle
                on={system}
                onChange={(v) =>
                  set((d) => {
                    d.settings.theme = v ? 'System' : mode === 'dark' ? 'Dark' : 'Light';
                  })
                }
              />
            }
          />
          <RowItem
            icon="moon"
            label="Dark theme"
            labelColor={system ? t.faint : undefined}
            right={
              <Toggle
                on={mode === 'dark'}
                disabled={system}
                onChange={(v) =>
                  set((d) => {
                    d.settings.theme = v ? 'Dark' : 'Light';
                  })
                }
              />
            }
          />
          <RowItem
            icon="logo"
            label="App icon"
            value={s.appIcon === 'default' ? 'Default' : s.appIcon}
            chevron
            onPress={() => router.push('/settings/app-icon')}
          />
        </Group>

        <View style={[CARD, cardSkin()]}>
          <Overline>Accent colour</Overline>
          <Row gap={16} style={{ marginTop: 16 }}>
            {ACCENT_KEYS.map((k) => (
              <Swatch
                key={k}
                accent={k}
                on={s.accent === k}
                onPress={() =>
                  set((d) => {
                    d.settings.accent = k;
                  })
                }
              />
            ))}
            <Tap onPress={() => router.push('/settings/theme-wheel')}>
              <View style={COIN}>
                <WheelCoin size={46} />
                <View style={[HOLE, { backgroundColor: t.card }]}>
                  <Icon name="plus" size={16} color={C.textMid} />
                </View>
              </View>
            </Tap>
          </Row>
          <T size={13} lh={18} color={C.muted} style={{ marginTop: 14 }}>
            {isAccentKey(s.accent)
              ? `${ACCENTS[s.accent].label} · ${ACCENTS[s.accent].note.toLowerCase()}. Tap the wheel for your own colour.`
              : `${s.accent} · your own. Tap the wheel to mix another.`}
          </T>
        </View>

        <Group title="My themes" style={{ marginTop: 12 }}>
          {state.customThemes.map((th) => (
            <RowItem
              key={th.id}
              label={th.name}
              value={`${th.hex} · ${th.mode.toLowerCase()}`}
              chevron
              onPress={() =>
                set((d) => {
                  d.settings.accent = th.hex;
                  d.settings.theme = th.mode;
                })
              }
              right={
                <Tap
                  hitSlop={10}
                  onPress={() =>
                    Alert.alert('Delete theme', `Forget "${th.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => removeTheme(th.id),
                      },
                    ])
                  }
                  style={{ marginRight: 10 }}
                >
                  <Icon name="trash" size={17} color={C.ghost} />
                </Tap>
              }
            />
          ))}
          <RowItem
            label="New theme from colour wheel"
            labelColor={C.textMid}
            chevron
            onPress={() => router.push('/settings/theme-wheel')}
          />
        </Group>

        <T size={12.5} lh={20} center color={C.wisp} style={{ marginTop: 16 }}>
          {'Rate us, Contact us and FAQs are hidden for now —\nreachable from Account & data.'}
        </T>
      </ScrollView>
    </View>
  );
}

/**
 * One 46px preset coin, ringed and ticked when it is the live accent.
 *
 * The board's selected state is two stacked box-shadow rings — paper, then
 * accent. React Native has one border per view, so the ring is a second view
 * around the coin: outer border in the accent, padding in the card colour.
 */
function Swatch({ accent, on, onPress }: { accent: Accent; on: boolean; onPress: () => void }) {
  const t = useT();
  const sw = accentSwatch(accent);
  return (
    <Tap onPress={onPress}>
      <View style={on ? [RING, { borderColor: t.accentIcon, backgroundColor: t.card }] : null}>
        <Grad colors={[sw.from, sw.to]} diag style={COIN}>
          {on ? <Icon name="check" size={18} color={t.accentOn} /> : null}
        </Grad>
      </View>
    </Tap>
  );
}

const RING = {
  padding: 2.5,
  borderRadius: 999,
  borderWidth: 2,
};

const COIN = {
  width: 46,
  height: 46,
  borderRadius: 23,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  overflow: 'hidden' as const,
};

const HOLE = {
  position: 'absolute' as const,
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const CARD = {
  marginTop: 12,
  padding: 16,
  borderRadius: 24,
};
