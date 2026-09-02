/** 7.3 Settings — every single choice opens the one wheel-picker sheet. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Dialog, Grad, Group, Row, RowItem, T, Tap, Toggle, TopBar } from '../../src/ui';
import { WheelSheet } from '../../src/components/WheelSheet';
import { ThemeSheet } from '../../src/components/ThemeSheet';
import { Icon } from '../../src/icons';
import { C, accentLabel, accentSwatch } from '../../src/theme';
import { fmtClock } from '../../src/data';
import { exactAlarmsConfigurable, openExactAlarmSettings, requestAlarms } from '../../src/alarms';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
type Field = 'timeFormat' | 'weekStart' | 'endDay' | 'lead' | null;

const FORMATS = ['12h (1:00pm)', '24h (13:00)'];
const WEEK = ['Sun', 'Mon'];
const END_HOURS = [0, 1, 2, 3, 4, 5, 6].map((h) => fmtClock(h * 60));
const LEADS = [0, 5, 10, 15, 30, 60];
const leadLabel = (m: number) => (m === 0 ? 'At the start time' : `${m} min before`);

/**
 * What the "?" beside a row actually says.
 *
 * The icon shipped as a bare glyph with no handler on three rows — the
 * universal "tap me and I'll explain" affordance, wired to nothing, on exactly
 * the three settings that need explaining. These are the explanations.
 */
const HELP: Record<string, { title: string; body: string }> = {
  weekStart: {
    title: 'Start week on',
    body: 'Which column the weekly grid begins with, and where the week boundary falls when Stats works out "this week". It does not change any routine — a routine that repeats on Monday still repeats on Monday.',
  },
  endDay: {
    title: 'End day at',
    body: 'When one day stops counting and the next begins. Set at 3:00am, a routine you finish at 1am still counts for the night before, so a late evening does not read as a missed day and a broken streak.',
  },
  haptics: {
    title: 'Haptic vibration',
    body: 'The short taps you feel when a task completes, a timer ends, or a control snaps into place. Turning this off is silent and saves a little battery; nothing else changes.',
  },
};

export default function Settings() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const s = state.settings;
  const [field, setField] = useState<Field>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [help, setHelp] = useState<keyof typeof HELP | null>(null);

  const config: Record<Exclude<Field, null>, { title: string; options: string[]; value: string }> = {
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
        </Group>

        <Group title="Data" style={{ marginTop: 14 }}>
          <RowItem
            label="Backup & export"
            value={s.backup.enabled ? 'Google Drive' : 'On this device'}
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
            onHelp={() => setHelp('weekStart')}
          />
          <HelpRow
            label="End day at"
            value={fmtClock(s.endDayAt)}
            onPress={() => setField('endDay')}
            onHelp={() => setHelp('endDay')}
          />
        </Group>

        <Group title="Plug-ins" style={{ marginTop: 14 }}>
          <HelpRow
            label="Haptic vibration"
            onHelp={() => setHelp('haptics')}
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

      <Dialog visible={help !== null} onClose={() => setHelp(null)}>
        <T d size={21} weight={800}>
          {help ? HELP[help].title : ''}
        </T>
        <T size={14.5} lh={23} color={C.textMid} style={{ marginTop: 12 }}>
          {help ? HELP[help].body : ''}
        </T>
        <Button label="Okay" onPress={() => setHelp(null)} style={{ marginTop: 20 }} />
      </Dialog>
    </View>
  );
}

/**
 * A settings row with the small "?" affordance sitting beside its label.
 *
 * The "?" is its own hit target: tapping it opens the explanation rather than
 * falling through to the row's picker, which is what it used to do.
 */
function HelpRow({
  label,
  value,
  right,
  onPress,
  onHelp,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  onHelp?: () => void;
}) {
  return (
    <Tap onPress={onPress}>
      <Row gap={8} style={{ paddingVertical: right ? 13 : 15 }}>
        <T size={16} weight={700}>
          {label}
        </T>
        <Tap onPress={onHelp} hitSlop={12}>
          <Icon name="help" size={15} color={C.ghost} />
        </Tap>
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

