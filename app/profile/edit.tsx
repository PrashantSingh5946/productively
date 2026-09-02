/** 7.2 Edit profile. */
import React, { useState } from 'react';
import { Linking, ScrollView, TextInput, View } from 'react-native';
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

const PRIVACY_URL =
  'https://github.com/PrashantSingh5946/productively/blob/main/PRIVACY.md';

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
      {/*
        Commit before leaving. `commit` runs on blur, and tapping Back never
        blurs the field — so typing a nickname and pressing Back discarded it.
        That was survivable while onboarding also collected a name; with
        onboarding gone this screen is the only place a name can be set, and
        the most natural way to leave it was the one that threw the answer
        away. A no-op when nothing is being edited.
      */}
      <TopBar
        onBack={() => {
          commit();
          router.back();
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          {/* The "+" badge that used to sit here was a bare View — it drew the
              universal add-a-photo affordance over an app that has no image
              picker and no avatar field to put a photo in. Removed rather than
              faked; if avatars ever ship, the badge comes back with a handler. */}
          <View style={AVATAR}>
            <Icon name="user" size={52} color={IDENTITY.avatarSageInk} />
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
                <T size={16} color={p.name ? C.muted : C.faint}>
                  {p.name || 'Not set'}
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
              <T size={16} color={p.age ? C.muted : C.faint}>
                {p.age || 'Not set'}
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
              <T
                size={15}
                lh={23}
                color={p.intro ? C.textMid : C.faint}
                style={{ marginTop: 14 }}
              >
                {p.intro || 'Nothing here yet.'}
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
                    {/*
                      Selected used to be `backgroundColor: C.card` — inside a
                      card that is already C.card, so a chosen intent rendered
                      as bare floating text while the unchosen ones were the
                      only things drawn as pills. The states read backwards.
                      Selected now carries the accent wash and its border.
                    */}
                    <Grad
                      colors={on ? G.accentWash : G.card}
                      diag={on}
                      style={[
                        TAG,
                        {
                          borderWidth: 1.5,
                          borderColor: on ? C.accentWashBorder : C.border,
                        },
                      ]}
                    >
                      <T size={13} weight={on ? 700 : 600} color={on ? C.accentText : C.textMid}>
                        {i.label}
                      </T>
                    </Grad>
                  </Tap>
                );
              })}
            </Row>
          </Grad>
        </View>

        <Spacer />
      </ScrollView>

      {/* These were underlined text with no handler — they looked like links
          and were inert. Play requires a working privacy-policy link. */}
      <T size={12.5} lh={21} center color={C.ghost}>
        Stored on this device and never uploaded.{'\n'}
        <T
          size={12.5}
          color={C.muted}
          style={{ textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
        >
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
