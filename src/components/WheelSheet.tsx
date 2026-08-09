/**
 * 7.4 Wheel picker — the single pattern behind every one-of-many choice in
 * Settings and Edit profile.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Grad, Row, Sheet, T, Tap } from '../ui';
import { C, G } from '../theme';

export function WheelSheet({
  visible,
  title,
  options,
  value,
  onClose,
  onDone,
}: {
  visible: boolean;
  title?: string;
  options: string[];
  value: string;
  onClose: () => void;
  onDone: (value: string) => void;
}) {
  const [idx, setIdx] = useState(Math.max(0, options.indexOf(value)));

  useEffect(() => {
    if (visible) setIdx(Math.max(0, options.indexOf(value)));
  }, [visible, value, options]);

  const rows = [-2, -1, 0, 1, 2].map((d) => {
    const i = idx + d;
    return { d, i, has: i >= 0 && i < options.length };
  });

  return (
    <Sheet visible={visible} onClose={onClose}>
      {title ? (
        <T size={16} weight={700} center color={C.textMid} style={{ marginBottom: 8 }}>
          {title}
        </T>
      ) : null}

      <View style={{ alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 28 }}>
        {rows.map(({ d, i, has }) =>
          d === 0 ? (
            <Grad key={d} colors={G.press} style={SELECTED}>
              <T size={25} weight={600} center>
                {options[i]}
              </T>
            </Grad>
          ) : (
            <Tap key={d} onPress={() => has && setIdx(i)} disabled={!has}>
              <T
                size={21}
                color={Math.abs(d) === 1 ? C.faint : C.wisp}
                style={{ opacity: has ? 1 : 0 }}
              >
                {has ? options[i] : options[0]}
              </T>
            </Tap>
          )
        )}
      </View>

      <Row gap={12}>
        <Tap onPress={onClose} style={{ flex: 1 }}>
          <Grad colors={G.press} style={BTN}>
            <T d size={17} weight={700} color={C.textMid}>
              Cancel
            </T>
          </Grad>
        </Tap>
        <Tap onPress={() => onDone(options[idx])} style={{ flex: 1 }}>
          <Grad colors={G.ink} diag style={BTN}>
            <T d size={17} weight={700} color={C.white}>
              Done
            </T>
          </Grad>
        </Tap>
      </Row>
    </Sheet>
  );
}

const SELECTED = {
  alignSelf: 'stretch' as const,
  paddingVertical: 16,
  borderRadius: 14,
};

const BTN = {
  height: 58,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
