import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from '../../src/ui';
import { Icon, IconName } from '../../src/icons';
import { C } from '../../src/theme';

const ORDER: { name: string; icon: IconName }[] = [
  { name: 'home', icon: 'playc' },
  { name: 'explore', icon: 'search' },
  { name: 'social', icon: 'people' },
  { name: 'analysis', icon: 'chart' },
  { name: 'profile', icon: 'user' },
];

type TabBarProps = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
};

function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View
      style={{
        backgroundColor: C.white,
        borderTopWidth: 1,
        borderTopColor: C.hairline,
        paddingTop: 12,
        paddingBottom: 10 + insets.bottom,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {ORDER.map((tab) => {
        const on = activeName === tab.name;
        return (
          <Tap
            key={tab.name}
            hitSlop={14}
            onPress={() => {
              if (!on) navigation.navigate(tab.name);
            }}
          >
            <Icon name={tab.icon} size={25} color={on ? C.ink : C.ghost} />
          </Tap>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.white } }}
    >
      {ORDER.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}
