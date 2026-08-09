/** 5.2 Template detail — hero, blurb, task list, add to my routines. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Pill, Row, T, Tap } from '../../src/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { TEMPLATES, totalMinutes } from '../../src/data';
import { useStore } from '../../src/store';

export default function TemplateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, toggleSaved, addRoutineFromTemplate } = useStore();

  const tpl = TEMPLATES.find((t) => t.id === String(id));
  if (!tpl) {
    return (
      <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top + 40, paddingHorizontal: 20 }}>
        <T size={16} color={C.muted}>Template not found.</T>
      </View>
    );
  }

  const saved = state.savedTemplates.includes(tpl.id);

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <Grad
        colors={['#FFD9C6', '#FFF1E8']}
        diag
        style={{
          height: 150 + insets.top,
          paddingTop: insets.top,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Tap
          onPress={() => router.back()}
          hitSlop={14}
          style={{ position: 'absolute', left: 20, top: insets.top + 16 }}
        >
          <Icon name="chevL" size={26} color={C.accentInkDeep} />
        </Tap>
        <Icon name={tpl.icon} size={64} color={tpl.iconColor} />
      </Grad>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <T d size={27} weight={800} lh={32} style={{ marginTop: 20 }}>
          {tpl.name}
        </T>

        <Row gap={8} style={{ marginTop: 12 }}>
          <Pill label={`${totalMinutes(tpl.tasks)} min`} size={12.5} />
          <Pill label={`${tpl.tasks.length} tasks`} size={12.5} />
          {tpl.using ? <Pill label={tpl.using} tone="tint" size={12.5} /> : null}
        </Row>

        <T size={14.5} lh={23} color={C.textMid} style={{ marginTop: 16 }}>
          {tpl.about}
        </T>

        <View style={{ gap: 10, marginTop: 20 }}>
          {tpl.tasks.map((t) => (
            <TaskRow key={t.id} task={t} showIndex={false} compact />
          ))}
        </View>
      </ScrollView>

      <Row
        gap={12}
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 18 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#F4EFE9',
          backgroundColor: C.white,
        }}
      >
        <Tap onPress={() => toggleSaved(tpl.id)}>
          <Grad colors={saved ? G.accent : G.card} diag={saved} style={SAVE}>
            <Icon name="bookmark" size={22} color={saved ? C.ink : C.textMid} />
          </Grad>
        </Tap>
        <Tap
          onPress={() => {
            const newId = addRoutineFromTemplate(tpl);
            router.replace(`/routine/${newId}`);
          }}
          style={{ flex: 1 }}
        >
          <Grad colors={G.accent} diag style={CTA}>
            <T d size={17} weight={700}>
              Add to my routines
            </T>
          </Grad>
        </Tap>
      </Row>
    </View>
  );
}

const SAVE = {
  width: 56,
  height: 56,
  borderRadius: 18,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const CTA = {
  height: 56,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
