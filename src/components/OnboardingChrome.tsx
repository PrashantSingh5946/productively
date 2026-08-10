/**
 * The back button + progress-rail header shared by onboarding steps 1.5–1.9,
 * and the wheel column used by the two time pickers.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { IconButton, Row, T, Tap, rowSkin } from '../ui';
import { C, RADIUS } from '../theme';
import { useT } from '../theming';

export function StepHeader({ progress }: { progress: number }) {
  const t = useT();
  return (
    <Row gap={16} style={{ paddingTop: 14 }}>
      <IconButton icon="chevL" onPress={() => router.back()} size={40} glyph={20} />
      <View
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: t.trackRing,
        }}
      >
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: '100%',
            backgroundColor: t.accent,
          }}
        />
      </View>
    </Row>
  );
}

/**
 * A five-row wheel. The selected row is a raised white card; its neighbours
 * fade out through muted and faint. Rows outside the value's range render
 * invisible so the columns stay aligned, as on the board.
 */
export function Wheel({
  values,
  index,
  onChange,
  width = 26,
}: {
  values: string[];
  index: number;
  onChange: (i: number) => void;
  width?: number;
}) {
  const t = useT();
  const rows = [-2, -1, 0, 1, 2].map((d) => {
    const i = index + d;
    const has = i >= 0 && i < values.length;
    return { d, i, has, label: has ? values[i] : values[0] };
  });

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      {rows.map(({ d, i, has, label }) =>
        d === 0 ? (
          <Tap key={d} onPress={() => onChange(i)}>
            <View
              style={[
                {
                  minHeight: 44,
                  paddingVertical: 14,
                  paddingHorizontal: width,
                  borderRadius: RADIUS.tile,
                },
                rowSkin(),
              ]}
            >
              <T size={26} weight={700} color={t.ink}>
                {label}
              </T>
            </View>
          </Tap>
        ) : (
          <Tap key={d} onPress={() => has && onChange(i)} disabled={!has} hitSlop={10}>
            <T
              size={22}
              weight={500}
              color={Math.abs(d) === 1 ? C.muted : C.faint}
              style={{ opacity: has ? 1 : 0 }}
            >
              {label}
            </T>
          </Tap>
        )
      )}
    </View>
  );
}
