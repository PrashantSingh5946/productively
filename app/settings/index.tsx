/** 7.3 Settings — every single choice opens the one wheel-picker sheet. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Group, Row, RowItem, T, Tap, Toggle, TopBar } from '../../src/ui';
import { WheelSheet } from '../../src/components/WheelSheet';
import { ThemeSheet } from '../../src/components/ThemeSheet';
import { Icon } from '../../src/icons';
import { C, accentLabel, accentSwatch } from '../../src/theme';
import { APP_ICONS, fmtClock } from '../../src/data';
import { exactAlarmsConfigurable, openExactAlarmSettings, requestAlarms } from '../../src/alarms';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
type Field = 'language' | 'timeFormat' | 'weekStart' | 'endDay' | 'lead' | null;

const LANGUAGES = ['English', 'Deutsch', 'Español', 'Français', 'हिन्दी', '日本語'];
const FORMATS = ['12h (1:00pm)', '24h (13:00)'];
const WEEK = ['Sun', 'Mon'];
const END_HOURS = [0, 1, 2, 3, 4, 5, 6].map((h) => fmtClock(h * 60));
const LEADS = [0, 5, 10, 15, 30, 60];
const leadLabel = (m: number) => (m === 0 ? 'At the start time' : `${m} min before`);

export default function Settings() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const s = state.settings;
  const [field, setField] = useState<Field>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const config: Record<Exclude<Field, null>, { title: string; options: string[]; value: string }> = {
    language: { title: 'Language', options: LANGUAGES, value: s.language },
    timeFormat: { title: 'Time format', options: FORMATS, value: FORMATS[s.timeFormat12 ? 0 : 1] },
    weekStart: { title: 'Start week on', options: WEEK, value: s.weekStart },
    endDay: { title: 'End day at', options: END_HOURS, value: fmtClock(s.endDayAt) },
    lead: { title: 'Remind me', options: LEADS.map(leadLabel), value: leadLabel(s.alarmLead) },
  };

  /**
   * Turning it on has to clear Android as well as the switch. Flipping the
   * store optimistically and letting the OS refuse would leave a settings
   * screen reading "On" while nothing was ever posted.
   */
  const toggleAlarms = async (v: boolean) => {
    if (!v) {
      set((d) => {
        d.settings.alarms = false;
      });
      return;
    }
    const ok = await requestAlarms();
    setBlocked(!ok);
    set((d) => {
      d.settings.alarms = ok;
    });
  };

  const apply = (v: string) => {
    set((d) => {
      switch (field) {
        case 'language':
          d.settings.language = v;
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
        case 'lead':
          d.settings.alarmLead = LEADS[LEADS.map(leadLabel).indexOf(v)] ?? 5;
          break;
      }
    });
    setField(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingHorizontal: 20 }}>
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
          <RowItem
            label="Theme"
            value={`${accentLabel(s.accent)} · ${s.theme}`}
            onPress={() => setThemeOpen(true)}
            right={
              <Grad
                colors={[accentSwatch(s.accent).from, accentSwatch(s.accent).to]}
                diag
                style={{ width: 20, height: 20, borderRadius: 10, marginRight: 10 }}
              />
            }
          />
          <RowItem
            label="App icon"
            value={iconName(s.appIcon)}
            onPress={() => router.push('/settings/app-icon')}
          />
        </Group>

        <Group title="Data" style={{ marginTop: 14 }}>
          <RowItem
            label="Backup & sync"
            value={s.backup.enabled ? 'On' : 'Off'}
            chevron
            onPress={() => router.push('/settings/backup')}
          />
        </Group>

        <Group title="Routine" style={{ marginTop: 14 }}>
          <Row style={{ paddingVertical: 13 }}>
            <View style={{ flex: 1 }}>
              <T size={16} weight={700}>
                Reminders
              </T>
              <T size={13} lh={18} color={C.muted} style={{ marginTop: 3 }}>
                {/*
                  Precise again, and now earned: the app declares
                  SCHEDULE_EXACT_ALARM, so expo-notifications schedules with
                  setExactAndAllowWhileIdle and the reminder survives Doze.
                  The one remaining caveat — that Android can revoke the grant
                  — lives on the Exact timing row below, next to the control
                  that fixes it, rather than hedging this line for everyone.
                */}
                {s.alarms
                  ? s.alarmLead === 0
                    ? 'A notification as each routine starts'
                    : `A notification ${s.alarmLead} minutes before each routine`
                  : blocked
                    ? 'Android is blocking notifications for Productively'
                    : 'Off — nothing will interrupt you'}
              </T>
            </View>
            <Toggle on={s.alarms} onChange={toggleAlarms} />
          </Row>
          {s.alarms ? (
            <RowItem
              label="Remind me"
              value={leadLabel(s.alarmLead)}
              onPress={() => setField('lead')}
            />
          ) : null}
          {/*
            Written as an offer, not a status. Android can revoke the
            exact-alarm grant — and denies it by default from 14 — but nothing
            in this app can read `canScheduleExactAlarms()` from JS, so a row
            claiming "On" or "Off" here would be a guess printed as a fact.
            It says what to do and gets out of the way.
          */}
          {s.alarms && exactAlarmsConfigurable() ? (
            <RowItem
              label="Exact timing"
              external
              onPress={openExactAlarmSettings}
            />
          ) : null}
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

      <ThemeSheet visible={themeOpen} onClose={() => setThemeOpen(false)} />

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

const iconName = (id: string) => APP_ICONS.find((i) => i.id === id)?.name ?? 'Default';
