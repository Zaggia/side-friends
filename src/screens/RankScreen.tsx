import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { api, Member } from '../lib/api';
import { fmtNum, useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { fill, font, radius, shade, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { Sheet, useFx } from '../components/overlays';
import { ErrorLine } from '../components/QuestSheet';
import { Avatar, Button, SPRING, Txt, tap } from '../components/ui';
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
  const [choose, setChoose] = useState(false);
  if (!state) return null;
  const ranked = state.month.ranking.map(id => state.members.find(m => m.id === id)!).filter(Boolean);
  const podium = [ranked[1], ranked[0], ranked[2]];
  const heights = [104, 140, 80];
  const medal = [t.sole, t.argento, t.bronzo];
  const king = state.king;
  const kingMember = king ? state.members.find(m => m.id === king.memberId) : null;
  const opt = king?.outing ? tr.outing[king.outing.k] : null;
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

      {king && kingMember ? (
        <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="crown" size={16} color={t.sole} /><Txt v="label" color={t.soleText}>{tr.winnerOf(monthOf(king.month, tr.months))}</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={kingMember.name} color={kingMember.color} size={44} />
            <View style={{ flex: 1 }}>
              <Txt v="title">{tr.wonMonth(king.memberId === state.me, kingMember.name, monthOf(king.month, tr.months))}</Txt>
              <Txt v="caption" muted>{`${fmtNum(king.pts, lang)} pt`}</Txt>
            </View>
          </View>
          {king.outing ? (
            <View style={{ backgroundColor: t.ground, borderRadius: radius.sm, padding: 12, gap: 2 }}>
              <Txt v="label" muted>{opt?.label ?? tr.choiceLabel}</Txt>
              <Txt v="heading">{king.outing.v}</Txt>
              <Txt v="caption" muted>{tr.restByGroup}</Txt>
            </View>
          ) : king.memberId === state.me ? (
            <Button kind="sole" icon="crown" title={tr.chooseOuting} onPress={() => setChoose(true)} />
          ) : <Txt muted>{tr.stillToChoose(kingMember.name)}</Txt>}
        </View>
      ) : null}

      <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="trophy" size={16} color={t.soleText} /><Txt v="label" color={t.soleText}>{tr.whoWins(month)}</Txt>
        </View>
        <Txt v="title">{tr.prizeTitle}</Txt>
        <Txt muted>{tr.prizeSub}</Txt>
      </View>

      <OutingSheet open={choose} onClose={() => setChoose(false)} />
    </ScrollView>
  );
}

function OutingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const fx = useFx();
  const { refresh } = useStore();
  const [k, setK] = useState<string | null>(null);
  const [v, setV] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!k || !v.trim()) return;
    setBusy(true); setError('');
    try { await api.outing(k, v); await refresh(); onClose(); fx.confetti(); tap('success'); fx.toast(tr.choiceToast, 'crown'); }
    catch (e) { setError(e instanceof Error ? e.message : tr.genericError); }
    finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.chooseOuting}</Txt>
      <Txt muted>{tr.outingSub}</Txt>
      {Object.entries(tr.outing).map(([key, o]) => (
        <View key={key} style={{ gap: 8 }}>
          <Txt v="heading" style={{ fontSize: 15 }}>{o.label}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {o.opts.map(opt => {
              const on = k === key && v === opt;
              return (
                <Pressable key={opt} onPress={() => { tap(); setK(key); setV(opt); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? t.soleShade : t.line, backgroundColor: on ? t.sole : t.ground }}>
                  <Txt style={{ fontFamily: font.bold, fontSize: 15, color: on ? t.onColor : t.ink }}>{opt}</Txt>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {k ? (
        <View style={{ gap: 6 }}>
          <Txt v="heading" style={{ fontSize: 15 }}>{tr.canWrite(tr.outing[k].label)}</Txt>
          <TextInput value={v} onChangeText={setV} maxLength={60} placeholderTextColor={t.inkMuted} placeholder={tr.outingPh}
            style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }} />
        </View>
      ) : null}
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="sole" title={busy ? tr.wait : tr.confirmChoice} disabled={busy || !k || !v.trim()} onPress={submit} />
    </Sheet>
  );
}
