/**
 * The v2 dock: a floating white pill that content scrolls beneath, with the
 * active tab drawn as a labelled ink pill.
 */
import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap } from '../../src/ui';
import { Icon, IconName } from '../../src/icons';
import { C, G, SHADOW } from '../../src/theme';
import { useT } from '../../src/theming';

/**
 * Four tabs, not the board's five. Social was a feed, a friends list and a
 * nudge button over constants — there is no account system and no server here,
 * so it could never have become real. A dock with a working tab in every slot
 * beats one that reserves a fifth of the app for a mock-up.
 */
const ORDER: { name: string; icon: IconName; label: string }[] = [
  { name: 'home', icon: 'playc', label: 'Home' },
  { name: 'explore', icon: 'search', label: 'Explore' },
  { name: 'analysis', icon: 'chart', label: 'Stats' },
  { name: 'profile', icon: 'user', label: 'Profile' },
];

/** Height the dock occupies, so screens can clear it in their scroll padding. */
export const DOCK_HEIGHT = 62;

type TabBarProps = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
};

function Dock({ state, navigation }: TabBarProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  // Gesture-nav bars report a small inset; give the dock room either way.
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}
    >
      <Grad
        colors={[t.paperFade, t.paper]}
        pointerEvents="none"
        style={{ height: 46 }}
      />
      <View style={{ backgroundColor: t.paper, paddingBottom: bottom, paddingHorizontal: 16 }}>
        <Row
          gap={2}
          style={{
            backgroundColor: t.card,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: t.hairline,
            padding: 6,
            boxShadow: SHADOW.dock,
            justifyContent: 'space-between',
          }}
        >
          {ORDER.map((tab) => {
            const on = activeName === tab.name;
            return (
              <Tap
                key={tab.name}
                hitSlop={6}
                onPress={() => {
                  if (!on) navigation.navigate(tab.name);
                }}
                style={on ? { flexShrink: 1 } : undefined}
              >
                {on ? (
                  <Grad
                    colors={G.ink}
                    diag
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 7,
                      height: 44,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                    }}
                  >
                    <Icon name={tab.icon} size={19} color={t.onInk} />
                    <T size={13.5} weight={700} color={t.onInk} numberOfLines={1}>
                      {tab.label}
                    </T>
                  </Grad>
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={tab.icon} size={21} color={t.dockIdle} />
                  </View>
                )}
              </Tap>
            );
          })}
        </Row>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  useT();
  return (
    <Tabs
      tabBar={(props) => <Dock {...props} />}
      screenOptions={{
        headerShown: false,
        // The dock floats over the scene, so the scene owns the full height.
        tabBarStyle: { position: 'absolute' },
        sceneStyle: { backgroundColor: C.paper },
      }}
    >
      {ORDER.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}
