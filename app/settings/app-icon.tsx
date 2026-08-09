/** 7.8 App icon. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap, TopBar } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { APP_ICONS } from '../../src/data';
import { useStore } from '../../src/store';

export default function AppIconSettings() {
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top, paddingHorizontal: 20 }}>
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
              <Grad colors={G.card} style={ROW}>
                <Grad
                  colors={ic.bg}
                  diag
                  style={[
                    TILE,
                    ic.border && { borderWidth: 1.5, borderColor: C.border },
                  ]}
                >
                  <Icon name="logo" size={36} color={ic.fg} />
                </Grad>
                <T d size={17} weight={700} style={{ flex: 1 }}>
                  {ic.name}
                </T>
                {on ? <Icon name="check" size={22} color={C.ink} /> : null}
              </Grad>
            </Tap>
          );
        })}

        <T size={13} lh={20} color={C.ghost} style={{ marginTop: 8 }}>
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
  borderRadius: 20,
};

const TILE = {
  width: 58,
  height: 58,
  borderRadius: 18,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
