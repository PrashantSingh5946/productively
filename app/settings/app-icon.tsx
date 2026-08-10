/** 7.8 App icon. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCoin, Grad, T, Tap, TopBar, rowSkin, tintSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, RADIUS } from '../../src/theme';
import { APP_ICONS } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function AppIconSettings() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <T d size={30} weight={800} style={{ marginTop: 16 }}>
        App icon
      </T>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 11, paddingTop: 22, paddingBottom: insets.bottom + 28 }}
      >
        {APP_ICONS.map((ic) => {
          const on = state.settings.appIcon === ic.id;
          return (
            <Tap
              key={ic.id}
              onPress={() =>
                set((d) => {
                  d.settings.appIcon = ic.id;
                })
              }
            >
              <View
                style={[
                  ROW,
                  on
                    ? [{ backgroundColor: C.accentTintFrom }, tintSkin()]
                    : rowSkin(),
                ]}
              >
                <Grad
                  colors={ic.bg}
                  diag
                  style={[
                    TILE,
                    ic.border && { borderWidth: 1.5, borderColor: C.hairlineStrong },
                  ]}
                >
                  <Icon name="logo" size={36} color={ic.fg} />
                </Grad>
                <T
                  d
                  size={17}
                  weight={700}
                  color={on ? C.accentText : C.ink}
                  style={{ flex: 1 }}
                >
                  {ic.name}
                </T>
                <CheckCoin size={26} on={on} />
              </View>
            </Tap>
          );
        })}

        <T size={13} lh={20} color={C.muted} style={{ marginTop: 8 }}>
          Every icon is included — nothing here is locked or paid for.
        </T>
      </ScrollView>
    </View>
  );
}

const ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 18,
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: RADIUS.row,
  minHeight: 44,
};

const TILE = {
  width: 58,
  height: 58,
  borderRadius: RADIUS.tile,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
