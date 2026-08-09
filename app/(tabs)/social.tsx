/** Flow 06 — 6.1 Social feed · 6.2 Friends. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grad, Row, T, Tap } from '../../src/ui';
import { Icon } from '../../src/icons';
import { C, G } from '../../src/theme';
import { FEED, FRIENDS, STORY } from '../../src/data';
import { useStore } from '../../src/store';

export default function Social() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'social' | 'friends'>('social');

  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Row gap={6} style={{ paddingTop: 10 }}>
          {(['social', 'friends'] as const).map((k) => {
            const on = tab === k;
            const label = k === 'social' ? 'Social' : 'Friends';
            return (
              <Tap key={k} onPress={() => setTab(k)}>
                {on ? (
                  <Grad colors={G.card} style={BIG_TAB}>
                    <T d size={21} weight={800}>
                      {label}
                    </T>
                  </Grad>
                ) : (
                  <View style={BIG_TAB}>
                    <T d size={21} weight={800} color={C.ghost}>
                      {label}
                    </T>
                  </View>
                )}
              </Tap>
            );
          })}
        </Row>

        {tab === 'social' ? <Feed /> : <Friends />}
      </ScrollView>
    </View>
  );
}

/* ── 6.1 feed ─────────────────────────────────────────────────────── */

function Feed() {
  const { state, addTasksToRoutine } = useStore();
  const [openPost, setOpenPost] = useState(FEED[0].id);
  const [activeRoutine, setActiveRoutine] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<string[]>([]);

  return (
    <>
      <View style={STORY_CARD}>
        <Grad colors={['#F6F2ED', '#ECE6DF']} style={STORY_IMG}>
          <Icon name="img" size={30} color={C.faint} />
          <T size={11.5} weight={500} color={C.faint}>
            Story photo
          </T>
        </Grad>
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 }}>
          <T size={12} weight={600} color={C.accentInkDeep}>
            {STORY.kicker}
          </T>
          <T d size={17} weight={800} lh={22} style={{ marginTop: 8 }}>
            {STORY.title}
          </T>
        </View>
      </View>

      <Row gap={10} style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <Grad colors={G.card} style={SMALL_PILL}>
          <Icon name="filter" size={15} color={C.textMid} />
          <T size={13.5} weight={600} color={C.textMid}>
            Filter
          </T>
        </Grad>
        <Grad colors={G.card} style={SMALL_PILL}>
          <Icon name="lock" size={15} color={C.textMid} />
          <T size={13.5} weight={600} color={C.textMid}>
            Visibility
          </T>
        </Grad>
      </Row>

      {FEED.map((post) => {
        const open = openPost === post.id;
        const ri = activeRoutine[post.id] ?? 0;
        const isCopied = copied.includes(post.id);

        return (
          <View key={post.id}>
            <Tap onPress={() => setOpenPost(post.id)}>
              <Row gap={12} style={{ marginTop: 22 }}>
                <View style={[AVATAR, { backgroundColor: post.avatarBg }]}>
                  <Icon name="user" size={22} color={post.avatarFg} />
                </View>
                <T size={16} weight={700}>
                  {post.name}
                </T>
                <Icon name="ring" size={16} color={post.tierColor} />
                <View style={{ flex: 1 }} />
                <T size={13} weight={500} color={C.ghost}>
                  {post.ago}
                </T>
              </Row>
            </Tap>

            {open ? (
              <>
                <Row gap={8} style={{ marginTop: 14 }}>
                  {post.routines.map((name, i) => {
                    const on = i === ri;
                    return (
                      <Tap
                        key={name}
                        onPress={() => setActiveRoutine((a) => ({ ...a, [post.id]: i }))}
                      >
                        {on ? (
                          <Grad colors={G.chip} style={ROUTINE_CHIP}>
                            <T size={13.5} weight={700}>
                              {name}
                            </T>
                          </Grad>
                        ) : (
                          <View style={ROUTINE_CHIP}>
                            <T size={13.5} weight={600} color={C.ghost}>
                              {name}
                            </T>
                          </View>
                        )}
                      </Tap>
                    );
                  })}
                </Row>

                <Grad colors={G.card} style={SUMMARY}>
                  <View style={{ flex: 1 }}>
                    <Row gap={7}>
                      <Icon name="clock" size={15} color={C.muted} />
                      <T size={14.5} weight={700}>
                        {post.duration}
                      </T>
                    </Row>
                    <T size={13} weight={500} color={C.muted} style={{ marginTop: 6 }}>
                      {post.window}
                    </T>
                  </View>
                  <Tap
                    onPress={() => {
                      if (isCopied) return;
                      addTasksToRoutine(
                        state.routines[0].id,
                        post.tasks.map((t, i) => ({
                          id: `${post.id}-${i}`,
                          title: t.title,
                          icon: t.icon,
                          tone: 'leaf' as const,
                          minutes: parseLen(t.len),
                        }))
                      );
                      setCopied((c) => [...c, post.id]);
                    }}
                  >
                    <Row gap={7} style={ADD_BTN}>
                      <Icon name={isCopied ? 'check' : 'plus'} size={14} color={C.ink} />
                      <T size={13.5} weight={700}>
                        {isCopied ? 'Added' : 'Add'}
                      </T>
                    </Row>
                  </Tap>
                </Grad>

                <View style={{ gap: 14, marginTop: 16, paddingHorizontal: 4 }}>
                  {post.tasks.map((t) => (
                    <Row key={t.title} gap={12}>
                      <Icon name={t.icon} size={17} color={t.color} />
                      <T size={14.5} weight={500} color={C.text} style={{ flex: 1 }}>
                        {t.title}
                      </T>
                      <T size={13} weight={500} color={C.muted}>
                        {t.len}
                      </T>
                    </Row>
                  ))}
                  {post.more ? (
                    <T size={13.5} weight={600} color={C.ghost} style={{ textAlign: 'right' }}>
                      …{post.more} more
                    </T>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const parseLen = (s: string) => (s.endsWith('s') && !s.endsWith('ms') ? 1 : parseInt(s, 10) || 1);

/* ── 6.2 friends ──────────────────────────────────────────────────── */

function Friends() {
  const { state, nudge } = useStore();

  return (
    <>
      <Row style={{ marginTop: 20 }}>
        <T d size={17} weight={700} color={C.muted}>
          {FRIENDS.length} / 10
        </T>
        <View style={{ flex: 1 }} />
        <Grad colors={G.card} style={BELL}>
          <Icon name="bell" size={19} color={C.textMid} />
          <View style={BADGE_DOT} />
        </Grad>
      </Row>

      <View style={{ gap: 11, marginTop: 16 }}>
        {FRIENDS.map((f) => {
          const nudged = state.nudged.includes(f.id);
          return (
            <Grad
              key={f.id}
              colors={f.running ? G.accentWash : G.card}
              diag={f.running}
              style={[
                FRIEND,
                f.running && { borderWidth: 1.5, borderColor: C.accentWashBorder },
              ]}
            >
              <View style={[AVATAR_LG, { backgroundColor: f.avatarBg }]}>
                <Icon name="user" size={24} color={f.avatarFg} />
              </View>
              <View style={{ flex: 1 }}>
                <Row gap={7}>
                  <T size={16} weight={700}>
                    {f.name}
                  </T>
                  {f.tierColor ? <Icon name="ring" size={15} color={f.tierColor} /> : null}
                  {f.bookmarked ? <Icon name="bookmark" size={13} color={C.ghost} /> : null}
                </Row>
                <T
                  size={13}
                  weight={f.running ? 500 : 400}
                  color={f.running ? C.accentInk : C.muted}
                  style={{ marginTop: 5 }}
                >
                  {f.status}
                </T>
              </View>

              {f.running ? (
                <Grad colors={G.accent} diag style={PLAY_SM}>
                  <Icon name="play" size={14} color={C.ink} />
                </Grad>
              ) : f.quiet ? (
                <Tap onPress={() => nudge(f.id)}>
                  <View style={NUDGE_BTN}>
                    <T size={12.5} weight={600} color={nudged ? C.good : C.textMid}>
                      {nudged ? 'Nudged' : 'Nudge'}
                    </T>
                  </View>
                </Tap>
              ) : null}
            </Grad>
          );
        })}
      </View>

      <Row gap={12} style={ADD_FRIENDS}>
        <Grad colors={G.chip} style={PLUS_CIRCLE}>
          <Icon name="plus" size={17} color={C.textSoft} />
        </Grad>
        <T size={16} weight={700} color={C.textMid}>
          Add friends
        </T>
      </Row>

      <Row gap={9} style={{ marginTop: 26 }}>
        <Icon name="help" size={17} color={C.muted} />
        <T size={15} weight={700} color={C.textMid}>
          Why add friends?
        </T>
      </Row>
      <T size={14} lh={22} color={C.muted} style={{ marginTop: 12 }}>
        You get a quiet ping when a friend starts a routine. No feed, no likes — just the nudge of
        knowing someone else is up too.
      </T>
    </>
  );
}

/* ── styles ───────────────────────────────────────────────────────── */

const BIG_TAB = { paddingVertical: 11, paddingHorizontal: 22, borderRadius: 999 };

const STORY_CARD = {
  marginTop: 16,
  borderRadius: 20,
  overflow: 'hidden' as const,
  backgroundColor: '#FFF1E8',
};

const STORY_IMG = {
  height: 132,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 8,
};

const SMALL_PILL = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 999,
};

const AVATAR = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const AVATAR_LG = {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const ROUTINE_CHIP = { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999 };

const SUMMARY = {
  marginTop: 12,
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 18,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
};

const ADD_BTN = {
  paddingVertical: 10,
  paddingHorizontal: 18,
  borderRadius: 999,
  borderWidth: 1.5,
  borderColor: C.ring,
};

const BELL = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const BADGE_DOT = {
  position: 'absolute' as const,
  top: 8,
  right: 9,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: C.danger,
  borderWidth: 2,
  borderColor: '#F6F2ED',
};

const FRIEND = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 14,
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 20,
};

const PLAY_SM = {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const NUDGE_BTN = {
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 999,
  backgroundColor: C.white,
};

const ADD_FRIENDS = {
  marginTop: 14,
  padding: 20,
  borderRadius: 20,
  borderWidth: 1.6,
  borderColor: C.ring,
  borderStyle: 'dashed' as const,
  justifyContent: 'center' as const,
};

const PLUS_CIRCLE = {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
