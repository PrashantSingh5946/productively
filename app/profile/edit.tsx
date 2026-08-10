/** 7.2 Edit profile. */
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, Spacer, T, Tap, TopBar, cardSkin, rowSkin } from '../../src/ui';
import { WheelSheet } from '../../src/components/WheelSheet';
import { Icon } from '../../src/icons';
import { C, G, IDENTITY } from '../../src/theme';
import { INTENTS } from '../../src/data';
import { useStore } from '../../src/store';

import { useT } from '../../src/theming';
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const AGES = ['Under 18', '18–24', '25–29', '30–34', '35–44', '45–54', '55+'];

export default function EditProfile() {
  useT();
  const insets = useSafeAreaInsets();
  const { state, set } = useStore();
  const p = state.profile;

  const [sheet, setSheet] = useState<null | 'gender' | 'age'>(null);
  const [editing, setEditing] = useState<null | 'name' | 'intro'>(null);
  const [draft, setDraft] = useState('');
  const [focusOpen, setFocusOpen] = useState(false);

  const commit = () => {
    const v = draft.trim();
    if (v) {
      set((d) => {
        if (editing === 'name') d.profile.name = v;
        if (editing === 'intro') d.profile.intro = v;
      });
    }
    setEditing(null);
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <View style={AVATAR}>
            <Icon name="user" size={52} color={IDENTITY.avatarSageInk} />
            <View style={AVATAR_ADD()}>
              <Icon name="plus" size={15} color={C.textMid} />
            </View>
          </View>
        </View>

        <View style={{ gap: 11, marginTop: 26 }}>
          <Tap
            onPress={() => {
              setDraft(p.name);
              setEditing('name');
            }}
          >
            <Grad colors={G.card} style={[FIELD, rowSkin()]}>
              <T size={16} weight={700} style={{ flex: 1 }}>
                Nickname
              </T>
              {editing === 'name' ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onBlur={commit}
                  onSubmitEditing={commit}
                  autoFocus
                  style={INPUT_INLINE()}
                />
              ) : (
                <T size={16} color={C.muted}>
                  {p.name}
                </T>
              )}
            </Grad>
          </Tap>

          <Tap onPress={() => setSheet('gender')}>
            <Grad colors={G.card} style={[FIELD, rowSkin()]}>
              <T size={16} weight={700} style={{ flex: 1 }}>
                Gender
              </T>
              <T size={16} color={C.muted}>
                {p.gender}
              </T>
            </Grad>
          </Tap>

          <Tap onPress={() => setSheet('age')}>
            <Grad colors={G.card} style={[FIELD, rowSkin()]}>
              <T size={16} weight={700} style={{ flex: 1 }}>
                Age
              </T>
              <T size={16} color={C.muted}>
                {p.age}
              </T>
            </Grad>
          </Tap>

          <Grad colors={G.card} style={[BLOCK, cardSkin()]}>
            <Row>
              <T size={16} weight={700} color={C.accentInkSoft} style={{ flex: 1 }}>
                Introduction
              </T>
              <Tap
                onPress={() => {
                  setDraft(p.intro);
                  setEditing('intro');
                }}
              >
                <T size={15} color={C.muted}>
                  Edit
                </T>
              </Tap>
            </Row>
            {editing === 'intro' ? (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onBlur={commit}
                multiline
                autoFocus
                style={INPUT_BLOCK()}
              />
            ) : (
              <T size={15} lh={23} color={C.textMid} style={{ marginTop: 14 }}>
                {p.intro}
              </T>
            )}
          </Grad>

          <Grad colors={G.card} style={[BLOCK, cardSkin()]}>
            <Row>
              <T size={16} weight={700} color={C.accentInk} style={{ flex: 1 }}>
                Focus
              </T>
              <Tap onPress={() => setFocusOpen((v) => !v)}>
                <T size={15} color={C.muted}>
                  {focusOpen ? 'Done' : 'Select'}
                </T>
              </Tap>
            </Row>

            <Row gap={8} style={{ marginTop: 14, flexWrap: 'wrap' }}>
              {(focusOpen ? INTENTS : INTENTS.filter((i) => p.intents.includes(i.id))).map((i) => {
                const on = p.intents.includes(i.id);
                return (
                  <Tap
                    key={i.id}
                    onPress={() =>
                      focusOpen &&
                      set((d) => {
                        d.profile.intents = on
                          ? d.profile.intents.filter((x) => x !== i.id)
                          : [...d.profile.intents, i.id];
                      })
                    }
                  >
                    <View
                      style={[
                        TAG,
                        { backgroundColor: focusOpen && !on ? 'transparent' : C.card },
                        focusOpen && !on && { borderWidth: 1.5, borderColor: C.border },
                      ]}
                    >
                      <T size={13} weight={600} color={C.textMid}>
                        {i.label}
                      </T>
                    </View>
                  </Tap>
                );
              })}
            </Row>
          </Grad>
        </View>

        <Spacer />
      </ScrollView>

      <T size={12.5} lh={21} center color={C.ghost}>
        Only used to tune your habit suggestions.{'\n'}
        <T size={12.5} color={C.muted} style={{ textDecorationLine: 'underline' }}>
          Terms
        </T>{' '}
        and{' '}
        <T size={12.5} color={C.muted} style={{ textDecorationLine: 'underline' }}>
          Privacy policy
        </T>
      </T>

      <WheelSheet
        visible={sheet !== null}
        title={sheet === 'gender' ? 'Gender' : 'Age'}
        options={sheet === 'gender' ? GENDERS : AGES}
        value={sheet === 'gender' ? p.gender : p.age}
        onClose={() => setSheet(null)}
        onDone={(v) => {
          set((d) => {
            if (sheet === 'gender') d.profile.gender = v;
            else d.profile.age = v;
          });
          setSheet(null);
        }}
      />
    </View>
  );
}

const AVATAR = {
  width: 104,
  height: 104,
  borderRadius: 52,
  backgroundColor: IDENTITY.avatarSage,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const AVATAR_ADD = () => ({
  position: 'absolute' as const,
  right: 0,
  bottom: 4,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: C.card,
  borderWidth: 2,
  borderColor: C.cardTo,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

const FIELD = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  padding: 20,
  borderRadius: 18,
};

const BLOCK = { padding: 20, borderRadius: 18 };

const TAG = { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 };

const INPUT_INLINE = () => ({
  fontFamily: 'Instrument_400Regular',
  fontSize: 16,
  color: C.ink,
  minWidth: 120,
  textAlign: 'right' as const,
  padding: 0,
});

const INPUT_BLOCK = () => ({
  marginTop: 14,
  fontFamily: 'Instrument_400Regular',
  fontSize: 15,
  lineHeight: 23,
  color: C.textMid,
  textAlignVertical: 'top' as const,
  minHeight: 60,
});
