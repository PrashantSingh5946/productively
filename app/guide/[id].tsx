/** 9.2 Article. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C } from '../../src/theme';
import { ARTICLES } from '../../src/data';

export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const a = ARTICLES.find((x) => x.id === String(id));

  if (!a) {
    return (
      <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top + 40, paddingHorizontal: 22 }}>
        <T size={16} color={C.muted}>Article not found.</T>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <Grad
        colors={['#FFE6D9', '#FFCDB6']}
        diag
        style={{
          height: 210 + insets.top,
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <Tap
          onPress={() => router.back()}
          hitSlop={14}
          style={{ position: 'absolute', left: 20, top: insets.top + 14 }}
        >
          <Icon name="chevL" size={26} color={C.accentInkDeep} />
        </Tap>

        {/* Abstract page-of-text motif — three columns of rules. */}
        <View style={{ gap: 5, opacity: 0.35 }}>
          {[76, 76, 60].map((w, i) => (
            <View key={i} style={{ width: w, height: 15, borderRadius: 8, backgroundColor: '#FFC7A8' }} />
          ))}
        </View>
        <View style={{ gap: 5, opacity: 0.6 }}>
          {[88, 88, 70].map((w, i) => (
            <View key={i} style={{ width: w, height: 17, borderRadius: 9, backgroundColor: '#FFB894' }} />
          ))}
        </View>
        <View style={{ gap: 6 }}>
          {[
            { w: 104, c: '#D95D2B' },
            { w: 110, c: '#FFFFFF' },
            { w: 98, c: '#D95D2B' },
          ].map((r, i) => (
            <View key={i} style={{ width: r.w, height: 21, borderRadius: 11, backgroundColor: r.c }} />
          ))}
        </View>
      </Grad>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 34 }}
      >
        <T d size={26} weight={800} lh={33} style={{ marginTop: 24 }}>
          {a.heading}
        </T>
        <T size={16} lh={27.5} color={C.text} style={{ marginTop: 20 }}>
          {a.lede}
        </T>

        {a.sections.map((s) => (
          <View key={s.h}>
            <T d size={18} weight={800} lh={23} style={{ marginTop: 28 }}>
              {s.h}
            </T>
            <T size={16} lh={27.5} color={C.text} style={{ marginTop: 12 }}>
              {s.p}
            </T>
            {s.muted ? (
              <T size={16} lh={27.5} color={C.muted} style={{ marginTop: 16 }}>
                {s.muted}
              </T>
            ) : null}
          </View>
        ))}

        <Row gap={10} style={{ marginTop: 32 }}>
          <Icon name="bookmark" size={17} color={C.ghost} />
          <T size={13.5} color={C.ghost}>
            {a.vol} · Productively guide
          </T>
        </Row>
      </ScrollView>
    </View>
  );
}
