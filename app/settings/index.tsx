/** 7.3 Settings — every single choice opens the one wheel-picker sheet. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Group, Row, RowItem, T, Tap, Toggle, TopBar } from '../../src/ui';
import { WheelSheet } from '../../src/components/WheelSheet';
import { Icon } from '../../src/icons';
import { C } from '../../src/theme';
import { fmtClock } from '../../src/data';
import { useStore } from '../../src/store';

type Field = 'language' | 'theme' | 'timeFormat' | 'weekStart' | 'endDay' | null;

const LANGUAGES = ['English', 'Deutsch', 'Español', 'Français', 'हिन्दी', '日本語'];
const THEMES = ['Light', 'Dark', 'System'];
const FORMATS = ['12h (1:00pm)', '24h (13:00)'];
const WEEK = ['Sun', 'Mon'];
const END_HOURS = [0, 1, 2, 3, 4, 5, 6].map((h) => fmtClock(h * 60));

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const s = state.settings;
  const [field, setField] = useState<Field>(null);

  const config: Record<Exclude<Field, null>, { title: string; options: string[]; value: string }> = {
    language: { title: 'Language', options: LANGUAGES, value: s.language },
    theme: { title: 'Theme', options: THEMES, value: s.theme },
    timeFormat: { title: 'Time format', options: FORMATS, value: FORMATS[s.timeFormat12 ? 0 : 1] },
    weekStart: { title: 'Start week on', options: WEEK, value: s.weekStart },
    endDay: { title: 'End day at', options: END_HOURS, value: fmtClock(s.endDayAt) },
  };

  const apply = (v: string) => {
    set((d) => {
      switch (field) {
        case 'language':
          d.settings.language = v;
          break;
        case 'theme':
          d.settings.theme = v as typeof d.settings.theme;
          break;
        case 'timeFormat':
          d.settings.timeFormat12 = v === FORMATS[0];
          break;
        case 'weekStart':
          d.settings.weekStart = v as 'Sun' | 'Mon';
          break;
        case 'endDay':
          d.settings.endDayAt = END_HOURS.indexOf(v) * 60;
          break;
      }
    });
    setField(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <TopBar onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <T d size={30} weight={800} style={{ marginTop: 16 }}>
          Settings
        </T>

        <Group title="System" style={{ marginTop: 22 }}>
          <RowItem label="Language" value={s.language} onPress={() => setField('language')} />
          <RowItem label="Theme" value={s.theme} onPress={() => setField('theme')} />
          <RowItem
            label="App icon"
            value={iconName(s.appIcon)}
            onPress={() => router.push('/settings/app-icon')}
          />
        </Group>

        <Group title="Routine" style={{ marginTop: 14 }}>
          <RowItem label="Home screen" chevron onPress={() => router.push('/settings/home-screen')} />
          <RowItem label="Timer" chevron onPress={() => router.push('/settings/timer')} />
        </Group>

        <Group title="Date & time" style={{ marginTop: 14 }}>
          <RowItem
            label="Time format"
            value={FORMATS[s.timeFormat12 ? 0 : 1]}
            onPress={() => setField('timeFormat')}
          />
          <HelpRow
            label="Start week on"
            value={s.weekStart}
            onPress={() => setField('weekStart')}
          />
          <HelpRow
            label="End day at"
            value={fmtClock(s.endDayAt)}
            onPress={() => setField('endDay')}
          />
        </Group>

        <Group title="Plug-ins" style={{ marginTop: 14 }}>
          <HelpRow
            label="Haptic vibration"
            right={
              <Toggle
                on={s.haptics}
                onChange={(v) =>
                  set((d) => {
                    d.settings.haptics = v;
                  })
                }
              />
            }
          />
          <Row style={{ paddingVertical: 13 }}>
            <T size={16} weight={700} style={{ flex: 1 }}>
              Status bar timer
            </T>
            <Toggle
              on={s.statusBarTimer}
              onChange={(v) =>
                set((d) => {
                  d.settings.statusBarTimer = v;
                })
              }
            />
          </Row>
        </Group>
      </ScrollView>

      {field ? (
        <WheelSheet
          visible
          title={config[field].title}
          options={config[field].options}
          value={config[field].value}
          onClose={() => setField(null)}
          onDone={apply}
        />
      ) : null}
    </View>
  );
}

/** A settings row with the small "?" affordance sitting beside its label. */
function HelpRow({
  label,
  value,
  right,
  onPress,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Tap onPress={onPress}>
      <Row gap={8} style={{ paddingVertical: right ? 13 : 15 }}>
        <T size={16} weight={700}>
          {label}
        </T>
        <Icon name="help" size={15} color={C.ghost} />
        <View style={{ flex: 1 }} />
        {value ? (
          <T size={16} color={C.muted}>
            {value}
          </T>
        ) : null}
        {right}
      </Row>
    </Tap>
  );
}

const iconName = (id: string) =>
  ({
    default: 'Default',
    paper: 'Paper',
    gentle: 'Gentle day',
    deep: 'Deep immersion',
    calm: 'Calm mind',
    clay: 'Clay',
    soft: 'Soft start',
  })[id] ?? 'Default';
