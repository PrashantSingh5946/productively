/**
 * 3.3 Custom colour — wheel, lightness rail and a live preview.
 *
 * The preview is not a picture of a card: it is built from the same tokens the
 * real card uses, rebuilt against the candidate colour on every drag. That is
 * the whole point of the screen — a hex means nothing until you see what the
 * accent derivation does with it, and `deriveAccent` moves lightness around to
 * hold contrast, so the colour you pick is not always the colour you get.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Grad, Overline, Prompt, Row, T, Tap, cardSkin, rowSkin } from '../../src/ui';
import { ColorWheel, LightnessRail } from '../../src/components/ColorWheel';
import { Icon } from '../../src/icons';
import {
  C,
  RADIUS,
  accentBase,
  buildPalette,
  hslOf,
  rgbOf,
  wheelHex,
} from '../../src/theme';
import { useStore } from '../../src/store';
import { useT, useThemeInfo } from '../../src/theming';

const WHEEL = 250;

export default function ThemeWheel() {
  const t = useT();
  const { mode } = useThemeInfo();
  const insets = useSafeAreaInsets();
  const { state, saveTheme } = useStore();
  const [naming, setNaming] = useState(false);

  // Seeded from the live accent, so opening the wheel starts where you are.
  const seed = useMemo(() => hslOf(accentBase(state.settings.accent)), [state.settings.accent]);
  const [hue, setHue] = useState(seed.h);
  const [light, setLight] = useState(seed.l);

  const hex = wheelHex(hue, light);
  const rgb = rgbOf(hex);
  // The candidate's whole accent family, derived exactly as the app would.
  const p = useMemo(() => buildPalette(hex, mode), [hex, mode]);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 }}>
        <Tap onPress={() => router.back()} hitSlop={8}>
          <Grad colors={[t.card, t.card]} style={[BACK, rowSkin()]}>
            <Icon name="chevL" size={19} color={C.textMid} />
          </Grad>
        </Tap>
        <Grad colors={[t.card, t.card]} style={[TAG, rowSkin()]}>
          <T size={12.5} weight={600} color={C.muted}>
            New theme
          </T>
        </Grad>
        <View style={{ width: 38 }} />
      </Row>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ColorWheel size={WHEEL} hue={hue} onHue={setHue}>
            <View
              style={{
                width: WHEEL * 0.62,
                height: WHEEL * 0.62,
                borderRadius: WHEEL,
                backgroundColor: hex,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <T size={15} weight={700} color={p.accentOn}>
                {hex}
              </T>
              <T size={11} weight={500} color={p.accentOn} style={{ opacity: 0.75 }}>
                {mode === 'dark' ? 'Dark' : 'Light'}
              </T>
            </View>
          </ColorWheel>
        </View>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <LightnessRail hex={hex} value={light} onChange={setLight} width={WHEEL} />
        </View>

        <Row gap={8} style={{ justifyContent: 'center', marginTop: 16 }}>
          {([
            ['R', rgb.r],
            ['G', rgb.g],
            ['B', rgb.b],
          ] as const).map(([k, v]) => (
            <View key={k} style={[CHIP, rowSkin()]}>
              <T size={12.5} weight={600} color={C.textMid}>
                {k} {v}
              </T>
            </View>
          ))}
          <Grad colors={[t.inkFrom, t.inkTo]} diag style={CHIP}>
            <T size={12.5} weight={600} color={C.onInk}>
              HEX {hex}
            </T>
          </Grad>
        </Row>

        <View style={[PREVIEW, cardSkin()]}>
          <Overline>Preview</Overline>
          <View style={{ backgroundColor: t.wellFrom, borderRadius: 18, padding: 14, marginTop: 10 }}>
            <Grad
              colors={[p.accentTintFrom, p.accentTintTo]}
              diag
              style={{
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: p.accentTintBorder,
                paddingVertical: 14,
                paddingHorizontal: 16,
              }}
            >
              <Row gap={12}>
                <Row gap={5}>
                  <Icon name="alarm" size={13} color={p.accentText} />
                  <T size={12} weight={500} color={p.accentText}>
                    8:00am
                  </T>
                </Row>
                <Row gap={5}>
                  <Icon name="cal" size={13} color={p.accentText} />
                  <T size={12} weight={500} color={p.accentText}>
                    M·T·W·T·F
                  </T>
                </Row>
                <View style={{ flex: 1 }} />
                <View style={[PILL, { backgroundColor: t.card }]}>
                  <T size={11.5} weight={700}>
                    in 18m
                  </T>
                </View>
              </Row>
              <Row gap={12} style={{ marginTop: 11 }}>
                <T d size={17} weight={800} style={{ flex: 1 }}>
                  Morning routine
                </T>
                <Grad colors={[p.accentFrom, p.accentTo]} diag style={PLAY}>
                  <Icon name="play" size={16} color={p.accentOn} />
                </Grad>
              </Row>
            </Grad>
          </View>
        </View>

        <Row gap={12} style={{ marginTop: 16 }}>
          <Tap onPress={() => router.back()} style={{ flex: 1 }}>
            <View style={[CANCEL, rowSkin()]}>
              <T d size={16} weight={700} color={C.textMid}>
                Cancel
              </T>
            </View>
          </Tap>
          <View style={{ flex: 1.6 }}>
            <Button label="Save as my theme" onPress={() => setNaming(true)} />
          </View>
        </Row>
      </ScrollView>

      <Prompt
        visible={naming}
        title="Name this theme"
        placeholder="Ocean calm"
        confirm="Save"
        onClose={() => setNaming(false)}
        onSubmit={(name) => {
          // Applying is part of saving — see `saveTheme`. Back to Customize,
          // which is now showing the theme in My themes and the app in it.
          saveTheme(name.trim() || hex, hex, mode === 'dark' ? 'Dark' : 'Light');
          router.back();
        }}
      />
    </View>
  );
}

const BACK = {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const TAG = {
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: RADIUS.pill,
};

const CHIP = {
  paddingVertical: 9,
  paddingHorizontal: 13,
  borderRadius: RADIUS.pill,
};

const PILL = {
  paddingVertical: 5,
  paddingHorizontal: 9,
  borderRadius: RADIUS.pill,
};

const PLAY = {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const PREVIEW = {
  marginTop: 18,
  padding: 14,
  borderRadius: RADIUS.card,
};

const CANCEL = {
  height: 58,
  borderRadius: RADIUS.pill,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
