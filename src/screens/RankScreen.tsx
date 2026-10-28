import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { api, Member } from '../lib/api';
import { useStore } from '../lib/store';
import { fill, font, radius, shade, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { Sheet, useFx } from '../components/overlays';
import { ErrorLine } from '../components/QuestSheet';
import { Avatar, Button, SPRING, Txt, tap } from '../components/ui';

const monthName = (key: string) => ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'][Number(key.split('-')[1]) - 1];

function Column({ m, place, height, delay, isMe }: { m: Member; place: number; height: number; delay: number; isMe: boolean }) {
  const t = useTheme();
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
      <Txt numberOfLines={1} style={{ fontFamily: font.black, fontSize: 15 }}>{isMe ? 'Tu' : m.name}</Txt>
      <Txt v="caption" muted>{`${m.pts.toLocaleString('it-IT')} pt`}</Txt>
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
  const { state } = useStore();
  const [choose, setChoose] = useState(false);
  if (!state) return null;
  const ranked = state.month.ranking.map(id => state.members.find(m => m.id === id)!).filter(Boolean);
  const podium = [ranked[1], ranked[0], ranked[2]];
  const heights = [104, 140, 80];
  const medal = [t.sole, t.argento, t.bronzo];
  const king = state.king;
  const kingMember = king ? state.members.find(m => m.id === king.memberId) : null;
  const opt = king?.outing ? state.outingOptions[king.outing.k] : null;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <View>
        <Txt v="display">Classifica</Txt>
        <Txt muted>{`${state.month.name[0].toUpperCase() + state.month.name.slice(1)} · ${state.month.days - state.month.day === 0 ? 'ultimo giorno' : `mancano ${state.month.days - state.month.day} giorni`}`}</Txt>
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
              <Txt v="heading">{m.id === state.me ? 'Tu' : m.name}</Txt>
              <Txt v="caption" muted>{`${m.quests} ${m.quests === 1 ? 'quest fatta' : 'quest fatte'}`}</Txt>
            </View>
            <Txt style={{ fontFamily: font.displayBold, fontSize: 15 }}>{m.pts.toLocaleString('it-IT')}</Txt>
          </View>
        ))}
      </Animated.View>

      {king && kingMember ? (
        <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="crown" size={16} color={t.sole} /><Txt v="label" color={t.soleText}>{`Vincitore di ${monthName(king.month)}`}</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={kingMember.name} color={kingMember.color} size={44} />
            <View style={{ flex: 1 }}>
              <Txt v="title">{king.memberId === state.me ? `Hai vinto ${monthName(king.month)}` : `${kingMember.name} ha vinto ${monthName(king.month)}`}</Txt>
              <Txt v="caption" muted>{`${king.pts.toLocaleString('it-IT')} pt`}</Txt>
            </View>
          </View>
          {king.outing ? (
            <View style={{ backgroundColor: t.ground, borderRadius: radius.sm, padding: 12, gap: 2 }}>
              <Txt v="label" muted>{opt?.label ?? 'La scelta'}</Txt>
              <Txt v="heading">{king.outing.v}</Txt>
              <Txt v="caption" muted>Il resto della prossima uscita lo decide il gruppo come al solito.</Txt>
            </View>
          ) : king.memberId === state.me ? (
            <Button kind="sole" icon="crown" title="Scegli una cosa dell’uscita" onPress={() => setChoose(true)} />
          ) : <Txt muted>{`${kingMember.name} deve ancora scegliere una cosa della prossima uscita.`}</Txt>}
        </View>
      ) : null}

      <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="trophy" size={16} color={t.soleText} /><Txt v="label" color={t.soleText}>{`Chi vince ${state.month.name}`}</Txt>
        </View>
        <Txt v="title">Si prende il trofeo e sceglie una cosa della prossima uscita</Txt>
        <Txt muted>Una sola tra dove si mangia, cosa si fa nel weekend o che film si vede al cinema. La classifica riparte da zero il primo del mese.</Txt>
      </View>

      <OutingSheet open={choose} onClose={() => setChoose(false)} />
    </ScrollView>
  );
}

function OutingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const fx = useFx();
  const { state, refresh } = useStore();
  const [k, setK] = useState<string | null>(null);
  const [v, setV] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  const submit = async () => {
    if (!k || !v.trim()) return;
    setBusy(true); setError('');
    try { await api.outing(k, v); await refresh(); onClose(); fx.confetti(); tap('success'); fx.toast('Scelta fatta. Il gruppo la vede subito.', 'crown'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Errore'); }
    finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>Scegli una cosa dell’uscita</Txt>
      <Txt muted>Puoi decidere una sola cosa tra le tre. Tocca un suggerimento o scrivi la tua.</Txt>
      {Object.entries(state.outingOptions).map(([key, o]) => (
        <View key={key} style={{ gap: 8 }}>
          <Txt v="heading" style={{ fontSize: 15 }}>{o.label}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {o.opts.map(opt => {
              const on = k === key && v === opt;
              return (
                <Pressable key={opt} onPress={() => { tap(); setK(key); setV(opt); }} accessibilityState={{ selected: on }}
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
          <Txt v="heading" style={{ fontSize: 15 }}>{`${state.outingOptions[k].label}: puoi anche scriverlo tu`}</Txt>
          <TextInput value={v} onChangeText={setV} maxLength={60} placeholderTextColor={t.inkMuted} placeholder="Es. Pizzeria da Gino"
            style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }} />
        </View>
      ) : null}
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="sole" title={busy ? 'Un attimo…' : 'Conferma la scelta'} disabled={busy || !k || !v.trim()} onPress={submit} />
    </Sheet>
  );
}
