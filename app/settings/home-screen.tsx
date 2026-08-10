/**
 * 7.5 + 7.6 Home screen settings. The preview above the toggles is live — it
 * redraws as each switch flips, exactly as the two board variants show.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Row, Segmented, Spacer, T, Toggle, TopBar, cardSkin } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { daysLabel, fmtClock } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
export default function HomeScreenSettings() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();

  const [view, setView] = useState<'list' | 'timeline'>(state.settings.homeView);
  const [list, setList] = useState(state.settings.homeList);
  const [timeline, setTimeline] = useState(state.settings.homeTimeline);

  const apply = () => {
    set((d) => {
      d.settings.homeView = view;
      d.settings.homeList = list;
      d.settings.homeTimeline = timeline;
    });
    router.back();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.paper,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 18,
        paddingHorizontal: 20,
      }}
    >
      <TopBar onBack={() => router.back()} />

      <T d size={30} weight={800} lh={35} style={{ marginTop: 16 }}>
        Home screen
      </T>

      <View style={{ marginTop: 22 }}>
        <Segmented
          big
          dark
          options={[
            { key: 'list', label: 'List' },
            { key: 'timeline', label: 'Timeline' },
          ]}
          value={view}
          onChange={(k) => setView(k as 'list' | 'timeline')}
        />
      </View>

      <Grad colors={G.card} style={[PANEL, cardSkin()]}>
        <T size={12.5} weight={600} color={C.faint} style={{ paddingHorizontal: 4, paddingBottom: 12 }}>
          Preview
        </T>

        <Grad colors={G.stone} style={STAGE}>
          {view === 'list' ? <ListPreview cfg={list} /> : <TimelinePreview showTasks={timeline.showTasks} />}
        </Grad>

        {view === 'list' ? (
          <>
            <SwitchRow
              label="Start time"
              on={list.startTime}
              onChange={(v) => setList((c) => ({ ...c, startTime: v }))}
            />
            <SwitchRow
              label="Repeat days"
              on={list.repeatDays}
              onChange={(v) => setList((c) => ({ ...c, repeatDays: v }))}
            />
            <SwitchRow
              label="Progress"
              on={list.progress}
              onChange={(v) => setList((c) => ({ ...c, progress: v }))}
            />
            <SwitchRow
              label="Task icons"
              on={list.taskIcons}
              onChange={(v) => setList((c) => ({ ...c, taskIcons: v }))}
              last
            />
          </>
        ) : (
          <SwitchRow
            label="Show tasks inside blocks"
            on={timeline.showTasks}
            onChange={(v) => setTimeline({ showTasks: v })}
            last
          />
        )}
      </Grad>

      <Spacer />
      <Button label="Apply" onPress={apply} />
    </View>
  );
}

function SwitchRow({
  label,
  on,
  onChange,
  last,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <Row style={{ paddingTop: 16, paddingHorizontal: 4, paddingBottom: last ? 4 : 0 }}>
      <T size={16} weight={700} style={{ flex: 1 }}>
        {label}
      </T>
      <Toggle on={on} onChange={onChange} />
    </Row>
  );
}

function ListPreview({
  cfg,
}: {
  cfg: { startTime: boolean; repeatDays: boolean; progress: boolean; taskIcons: boolean };
}) {
  const { state } = useStore();
  const r = state.routines[0];

  return (
    <View style={{ borderRadius: 16, backgroundColor: C.card, padding: 16, paddingHorizontal: 18 }}>
      <Row gap={14}>
        {cfg.startTime ? (
          <Row gap={5}>
            <Icon name="alarm" size={13} color={C.muted} />
            <T size={12} weight={500} color={C.muted}>
              {fmtClock(r.start)}
            </T>
          </Row>
        ) : null}
        {cfg.repeatDays ? (
          <Row gap={5}>
            <Icon name="cal" size={13} color={C.muted} />
            <T size={12} weight={500} color={C.muted}>
              {daysLabel(r.days)}
            </T>
          </Row>
        ) : null}
        <View style={{ flex: 1 }} />
        {cfg.progress ? (
          <T size={12.5} weight={700} color={C.good}>
            {Math.round(r.rate * 100)}%
          </T>
        ) : null}
      </Row>

      <Row gap={12} style={{ marginTop: 12 }}>
        <T d size={17} weight={800} style={{ flex: 1 }}>
          {r.name}
        </T>
        <Grad colors={G.press} style={PREV_PLAY}>
          <Icon name="play" size={15} color={C.ink} />
        </Grad>
      </Row>

      {cfg.taskIcons ? (
        <Row gap={6} style={{ marginTop: 12 }}>
          {r.tasks.slice(0, 5).map((t) => (
            <Grad key={t.id} colors={G.press} style={PREV_CHIP}>
              <Icon name={t.icon} size={13} color={C.textMid} />
            </Grad>
          ))}
        </Row>
      ) : null}
    </View>
  );
}

function TimelinePreview({ showTasks }: { showTasks: boolean }) {
  return (
    <View style={{ borderRadius: 16, backgroundColor: C.card, paddingVertical: 14, paddingHorizontal: 12 }}>
      <Row gap={10} center={false}>
        <T size={11} weight={500} color={C.ghost} style={{ width: 36 }}>
          08:00
        </T>
        <View style={{ flex: 1 }}>
          <Row gap={6} style={PREV_HEAD()}>
            <T size={11.5} weight={700} style={{ flex: 1 }}>
              Morning routine
            </T>
            <View style={PREV_TICK()}>
              <Icon name="check" size={10} color={C.onInk} />
            </View>
          </Row>
          {showTasks ? (
            <Grad colors={G.chip} style={PREV_SUB}>
              <T size={11} weight={500} color={C.textSoft}>
                Make the bed
              </T>
            </Grad>
          ) : null}
        </View>
      </Row>

      <Row gap={10} style={{ marginTop: 6 }}>
        <View style={{ width: 36, alignItems: 'flex-end' }}>
          <Grad colors={G.inkDeep} diag style={{ paddingVertical: 2, paddingHorizontal: 5, borderRadius: 4 }}>
            <T size={9} weight={700} color={C.onInk}>
              08:51
            </T>
          </Grad>
        </View>
        <View style={{ flex: 1, borderTopWidth: 1.5, borderTopColor: C.ink }} />
      </Row>

      <Row gap={10} center={false} style={{ marginTop: 8 }}>
        <T size={11} weight={500} color={C.ghost} style={{ width: 36 }}>
          09:00
        </T>
        <Row gap={6} center={false} style={{ flex: 1 }}>
          {['Breakfast', 'Check schedule'].map((label, i) => (
            <View key={label} style={{ flex: 1 }}>
              <Grad colors={G.accent} diag style={PREV_BLOCK}>
                <T size={10.5} weight={700}>
                  {label}
                </T>
              </Grad>
              {showTasks ? (
                <Grad colors={G.peach} diag style={PREV_BLOCK_SUB}>
                  <T size={10} weight={500} color={C.accentInkDeep}>
                    {i === 0 ? 'Chew slowly' : 'Clear inbox'}
                  </T>
                </Grad>
              ) : null}
            </View>
          ))}
        </Row>
      </Row>
    </View>
  );
}

const PANEL = { marginTop: 20, padding: 16, borderRadius: 22 };
const STAGE = { borderRadius: 18, paddingVertical: 20, paddingHorizontal: 15 };
const PREV_PLAY = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const PREV_CHIP = {
  width: 24,
  height: 24,
  borderRadius: 8,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const PREV_HEAD = () => ({
  backgroundColor: C.track,
  borderTopLeftRadius: 7,
  borderTopRightRadius: 7,
  borderBottomLeftRadius: 3,
  borderBottomRightRadius: 3,
  paddingVertical: 6,
  paddingHorizontal: 9,
});
const PREV_TICK = () => ({
  width: 15,
  height: 15,
  borderRadius: 8,
  backgroundColor: C.good,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});
const PREV_SUB = { marginTop: 3, borderRadius: 3, paddingVertical: 7, paddingHorizontal: 9 };
const PREV_BLOCK = {
  borderTopLeftRadius: 6,
  borderTopRightRadius: 6,
  borderBottomLeftRadius: 2,
  borderBottomRightRadius: 2,
  paddingVertical: 5,
  paddingHorizontal: 8,
};
const PREV_BLOCK_SUB = {
  marginTop: 2,
  borderTopLeftRadius: 2,
  borderTopRightRadius: 2,
  borderBottomLeftRadius: 6,
  borderBottomRightRadius: 6,
  paddingVertical: 7,
  paddingHorizontal: 8,
};
