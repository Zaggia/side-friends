import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { Member } from '../lib/api';
import { fmtNum, useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { fill, font, radius, shade, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { KingCard } from '../components/KingPowers';
import { Avatar, SPRING, Txt } from '../components/ui';
import { monthOf } from './QuestScreen';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Column({ m, place, height, delay, isMe }: { m: Member; place: number; height: number; delay: number; isMe: boolean }) {
  const t = useTheme();
  const { t: tr, lang } = useI18n();
  const grow = useSharedValue(0), pop = useSharedValue(0), crown = useSharedValue(0);
  useEffect(() => {
    grow.value = 0; pop.value = 0; crown.value = 0;
    grow.value = withDelay(delay, withSpring(1, SPRING.bouncy));
    pop.value = withDelay(delay + 120, withSpring(1, SPRING.bouncy));
    crown.value = withDelay(delay + 420, withSpring(1, SPRING.bouncy));
  }, [m.id, m.pts]);
  const bar = useAnimatedStyle(() => ({ height: height * grow.value }));
  const av = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const cr = useAnimatedStyle(() => ({ opacity: crown.value, transform: [{ translateY: (1 - crown.value) * -40 }, { rotate: `${(1 - crown.value) * -25}deg` }] }));
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <Animated.View style={av}>
        {place === 1 ? <Animated.View style={[{ position: 'absolute', top: -28, alignSelf: 'center', zIndex: 2 }, cr]}><Icon name="crown" size={30} color={t.sole} /></Animated.View> : null}
        <View style={{ padding: 3, borderRadius: 40, borderWidth: 2, borderColor: fill(t, m.color) }}><Avatar name={m.name} color={m.color} size={52} /></View>
      </Animated.View>
      <Txt numberOfLines={1} style={{ fontFamily: font.black, fontSize: 15 }}>{isMe ? tr.you : m.name}</Txt>
      <Txt v="caption" muted>{`${fmtNum(m.pts, lang)} pt`}</Txt>
      <Animated.View style={[{ width: '100%', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, backgroundColor: shade(t, m.color), paddingBottom: 6, overflow: 'hidden' }, bar]}>
        <View style={{ flex: 1, backgroundColor: fill(t, m.color), borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, alignItems: 'center', paddingTop: 10 }}>
          <Txt style={{ fontFamily: font.display, fontSize: 28, color: t.onColor }}>{String(place)}</Txt>
        </View>
      </Animated.View>
    </View>
  );
}

export function RankScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const { t: tr, lang } = useI18n();
  const { state } = useStore();
  if (!state) return null;
  const ranked = state.month.ranking.map(id => state.members.find(m => m.id === id)!).filter(Boolean);
  const podium = [ranked[1], ranked[0], ranked[2]];
  const heights = [104, 140, 80];
  const medal = [t.sole, t.argento, t.bronzo];
  const month = monthOf(state.month.key, tr.months);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <View>
        <Txt v="display">{tr.rankTitle}</Txt>
        <Txt muted>{tr.monthStatus(cap(month), tr.daysLeft(state.month.days - state.month.day))}</Txt>
      </View>

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 28, minHeight: 280 }}>
          {podium.map((m, i) => m ? <Column key={m.id} m={m} place={[2, 1, 3][i]} height={heights[i]} delay={[120, 40, 200][i]} isMe={m.id === state.me} /> : <View key={i} style={{ flex: 1 }} />)}
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: t.line, marginTop: -2 }} />
      </View>

      <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={{ gap: 8 }}>
        {ranked.map((m, i) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: m.id === state.me ? t.azzurroSoft : t.nuvola, borderWidth: 2, borderColor: m.id === state.me ? t.azzurro : 'transparent' }}>
            {i < 3 ? (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: medal[i], alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontFamily: font.display, fontSize: 13, color: t.onColor }}>{String(i + 1)}</Txt></View>
            ) : <Txt style={{ width: 28, textAlign: 'center', fontFamily: font.display, color: t.inkMuted }}>{String(i + 1)}</Txt>}
            <Avatar name={m.name} color={m.color} size={36} />
            <View style={{ flex: 1 }}>
              <Txt v="heading">{m.id === state.me ? tr.you : m.name}</Txt>
              <Txt v="caption" muted>{tr.questsDone(m.quests)}</Txt>
            </View>
            <Txt style={{ fontFamily: font.displayBold, fontSize: 15 }}>{fmtNum(m.pts, lang)}</Txt>
          </View>
        ))}
      </Animated.View>

      {state.king ? <KingCard state={state} /> : null}

      <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="trophy" size={16} color={t.soleText} /><Txt v="label" color={t.soleText}>{tr.whoWins(month)}</Txt>
        </View>
        <Txt v="title">{tr.prizeTitle}</Txt>
        <Txt muted>{tr.prizeSub}</Txt>
      </View>

    </ScrollView>
  );
}
