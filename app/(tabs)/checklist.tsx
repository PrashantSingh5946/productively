/**
 * Flow 02 — Checklist.
 *
 * v2 kept this behind a segmented control at the top of Home, which meant the
 * only way to reach a packing list was to open the routine list first and then
 * switch away from it. v3 gives it the dock slot Explore vacated, so it stands
 * on its own: its own date line, its own heading, its own + button.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCoin,
  Grad,
  MenuSheet,
  Overline,
  Prompt,
  Row,
  T,
  Tap,
  rowSkin,
} from '../../src/ui';
import { Fab } from '../../src/components/HomeParts';
import { Icon } from '../../src/icons';
import { C, DOCK_CLEARANCE, G } from '../../src/theme';
import { useStore } from '../../src/store';
import { useNow } from '../../src/useNow';

import { useT } from '../../src/theming';

/**
 * Which dialog the page currently has open, and what it is about.
 *
 * One state rather than six booleans: a rename and an add can never be open at
 * once, and the target ids have to travel with the intent or the callback fires
 * against whichever row was last tapped.
 */
type ListEdit =
  | { kind: 'new-list' }
  | { kind: 'rename-list'; groupId: string; title: string }
  | { kind: 'new-item'; groupId: string }
  | { kind: 'rename-item'; groupId: string; itemId: string; title: string }
  | null;

export default function Checklist() {
  useT();
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const {
    state,
    toggleChecklistItem,
    addChecklist,
    renameChecklist,
    removeChecklist,
    resetChecklist,
    addChecklistItem,
    renameChecklistItem,
    removeChecklistItem,
  } = useStore();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [edit, setEdit] = useState<ListEdit>(null);
  const [menu, setMenu] = useState<{ groupId: string; itemId?: string } | null>(null);

  const group = menu ? state.checklists.find((g) => g.id === menu.groupId) : undefined;
  const item = menu?.itemId ? group?.items.find((i) => i.id === menu.itemId) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: DOCK_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        <Overline style={{ marginTop: 24 }}>
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </Overline>
        <T d size={27} weight={800} lh={35} style={{ marginTop: 6 }}>
          {'Nothing important\nleft behind.'}
        </T>

        {state.checklists.length === 0 ? (
          <T size={14.5} lh={22} color={C.muted} style={{ marginTop: 16 }}>
            Nothing here yet. A checklist is for the things that have no clock on
            them — what to pack, what to close down on a Friday.
          </T>
        ) : (
          <T size={13} lh={19} color={C.faint} style={{ marginTop: 12 }}>
            Tap to tick. Hold an item to rename or remove it.
          </T>
        )}

        {state.checklists.map((g, gi) => {
          const open = !collapsed.includes(g.id);
          const done = g.items.filter((i) => i.done).length;
          return (
            <View key={g.id}>
              <Row gap={10} style={{ marginTop: gi === 0 ? 20 : 26 }}>
                <Tap
                  style={{ flex: 1 }}
                  onPress={() =>
                    setCollapsed((c) =>
                      c.includes(g.id) ? c.filter((x) => x !== g.id) : [...c, g.id]
                    )
                  }
                >
                  <Row gap={10}>
                    <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
                      <Icon name="chevD" size={18} color={C.muted} />
                    </View>
                    <T d size={17} weight={700} style={{ flex: 1 }}>
                      {g.title}
                    </T>
                    {/* The board's count pill. A bare "5/8" beside a display-weight
                        title read as part of the title; the chip separates them. */}
                    <View style={COUNT()}>
                      <T size={12.5} weight={600} color={C.muted}>
                        {done}/{g.items.length}
                      </T>
                    </View>
                  </Row>
                </Tap>
                {/* The board draws a chevron here, but there is no list-detail
                    screen to navigate to — this opens the rename/reset/delete
                    menu, and dots are what that is. */}
                <Tap onPress={() => setMenu({ groupId: g.id })} hitSlop={10}>
                  <Icon name="dots" size={18} color={C.ghost} />
                </Tap>
              </Row>

              {open ? (
                <View style={{ gap: 10, marginTop: 14 }}>
                  {g.items.map((it) => (
                    <Tap
                      key={it.id}
                      onPress={() => toggleChecklistItem(g.id, it.id)}
                      onLongPress={() => setMenu({ groupId: g.id, itemId: it.id })}
                    >
                      <Grad colors={G.card} style={[CHECK_ROW, rowSkin()]}>
                        <CheckCoin size={24} on={it.done} />
                        <T
                          size={15.5}
                          weight={it.done ? 500 : 600}
                          color={it.done ? C.faint : C.ink}
                          style={{
                            flex: 1,
                            textDecorationLine: it.done ? 'line-through' : 'none',
                          }}
                        >
                          {it.title}
                        </T>
                      </Grad>
                    </Tap>
                  ))}

                  <Tap onPress={() => setEdit({ kind: 'new-item', groupId: g.id })}>
                    <Row gap={10} style={DASHED()}>
                      <Icon name="plus" size={17} color={C.ghost} />
                      <T size={14.5} weight={600} color={C.ghost}>
                        Add an item
                      </T>
                    </Row>
                  </Tap>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Fab icon="plus" onPress={() => setEdit({ kind: 'new-list' })} bottom={insets.bottom + 118} />

      <MenuSheet
        visible={!!menu}
        title={item ? item.title : group?.title}
        onClose={() => setMenu(null)}
        actions={
          menu && item
            ? [
                {
                  key: 'rename',
                  label: 'Rename item',
                  icon: 'pencil',
                  onPress: () =>
                    setEdit({
                      kind: 'rename-item',
                      groupId: menu.groupId,
                      itemId: item.id,
                      title: item.title,
                    }),
                },
                {
                  key: 'delete',
                  label: 'Remove item',
                  icon: 'x',
                  danger: true,
                  onPress: () => removeChecklistItem(menu.groupId, item.id),
                },
              ]
            : menu && group
              ? [
                  {
                    key: 'add',
                    label: 'Add an item',
                    icon: 'plus',
                    onPress: () => setEdit({ kind: 'new-item', groupId: menu.groupId }),
                  },
                  {
                    key: 'rename',
                    label: 'Rename list',
                    icon: 'pencil',
                    onPress: () =>
                      setEdit({
                        kind: 'rename-list',
                        groupId: menu.groupId,
                        title: group.title,
                      }),
                  },
                  {
                    key: 'reset',
                    label: 'Untick everything',
                    icon: 'refresh',
                    onPress: () => resetChecklist(menu.groupId),
                  },
                  {
                    key: 'delete',
                    label: 'Delete list',
                    icon: 'trash',
                    danger: true,
                    onPress: () => removeChecklist(menu.groupId),
                  },
                ]
              : []
        }
      />

      <Prompt
        visible={edit?.kind === 'new-list'}
        title="New checklist"
        placeholder="Weekend bag"
        confirm="Create"
        autoClose={false}
        onClose={() => setEdit(null)}
        onSubmit={(v) => {
          // A list you just named is a list you are about to fill, so the
          // composer moves straight on rather than closing onto an empty one.
          setEdit({ kind: 'new-item', groupId: addChecklist(v) });
        }}
      />
      <Prompt
        visible={edit?.kind === 'rename-list'}
        title="Rename checklist"
        initial={edit?.kind === 'rename-list' ? edit.title : ''}
        onClose={() => setEdit(null)}
        onSubmit={(v) => edit?.kind === 'rename-list' && renameChecklist(edit.groupId, v)}
      />
      <Prompt
        visible={edit?.kind === 'new-item'}
        title="Add an item"
        placeholder="Passport"
        confirm="Add"
        // Stays open on the same list: nobody adds exactly one thing to a
        // packing list, and reopening the dialog per item is the entire
        // friction budget for the feature.
        autoClose={false}
        onClose={() => setEdit(null)}
        onSubmit={(v) => edit?.kind === 'new-item' && addChecklistItem(edit.groupId, v)}
      />
      <Prompt
        visible={edit?.kind === 'rename-item'}
        title="Rename item"
        initial={edit?.kind === 'rename-item' ? edit.title : ''}
        onClose={() => setEdit(null)}
        onSubmit={(v) =>
          edit?.kind === 'rename-item' && renameChecklistItem(edit.groupId, edit.itemId, v)
        }
      />
    </View>
  );
}

const COUNT = () => ({
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 999,
  // The board's rgba(32,27,23,.06) — which is exactly the press token.
  backgroundColor: C.pressFrom,
});

const CHECK_ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 16,
};

/** The dashed "add one of these" affordance, shared by items and lists. */
const DASHED = () => ({
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 16,
  borderWidth: 1.5,
  borderStyle: 'dashed' as const,
  borderColor: C.hairline,
});
