/**
 * The back-chevron + progress-rail header shared by onboarding steps 1.5–1.9,
 * and the wheel column used by the two time pickers.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Grad, Row, T, Tap } from '../ui';
import { Icon } from '../icons';
import { C, G } from '../theme';

export function StepHeader({ progress }: { progress: number }) {
  return (
    <Row gap={16} style={{ paddingTop: 14 }}>
      <Tap onPress={() => router.back()} hitSlop={12}>
        <Icon name="chevL" size={24} color={C.faint} />
      </Tap>
      <Grad colors={G.well} style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' }}>
        <Grad
          colors={G.accent}
          diag
          style={{ width: `${Math.round(progress * 100)}%`, height: '100%' }}
        />
      </Grad>
    </Row>
  );
}

/**
 * A five-row wheel. The middle row is the selection; rows outside the value's
 * range are rendered invisible so columns stay aligned, as on the board.
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
  const rows = [-2, -1, 0, 1, 2].map((d) => {
    const i = index + d;
    const has = i >= 0 && i < values.length;
    return { d, i, has, label: has ? values[i] : values[0] };
  });

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      {rows.map(({ d, i, has, label }) =>
        d === 0 ? (
          <Tap key={d} onPress={() => onChange(i)}>
            <Grad
              colors={G.well}
              style={{
                paddingVertical: 16,
                paddingHorizontal: width,
                borderRadius: 14,
              }}
            >
              <T size={26} weight={600} color={C.ink}>
                {label}
              </T>
            </Grad>
          </Tap>
        ) : (
          <Tap key={d} onPress={() => has && onChange(i)} disabled={!has}>
            <T
              size={22}
              weight={500}
              color={Math.abs(d) === 1 ? C.faint : C.wisp}
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
