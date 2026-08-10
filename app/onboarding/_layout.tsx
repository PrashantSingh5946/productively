import { Stack } from 'expo-router';
import { C } from '../../src/theme';

import { useT } from '../../src/theming';
export default function OnboardingLayout() {
  useT();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.paper },
        animation: 'slide_from_right',
      }}
    />
  );
}
