import { useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, Share, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { api, Quest } from '../lib/api';
import { useStore } from '../lib/store';
import { fill, font, radius, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { Sheet, useFx } from '../components/overlays';
import { QuestSheet, ErrorLine } from '../components/QuestSheet';
import { Avatar, AvatarStack, Button, Chip, PressCard, QuestIcon, SPRING, Section, Txt, tap } from '../components/ui';

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} g`;
};

export function QuestCard({ q, onPress }: { q: Quest; onPress: () => void }) {
  const t = useTheme();
  const color = q.kind === 'idea' ? 'lilla' : q.kind === 'group' ? 'menta' : ['azzurro', 'fragola', 'sole'][q.title.length % 3];
  const chip = q.state === 'done' ? <Chip label="Fatta" tone="done" icon="check" />
    : q.state === 'pending' ? <Chip label="In votazione" tone="pending" />
    : q.state === 'active' ? <Chip label="In corso" tone="active" /> : <Chip label="Nuova" />;
  return (
    <PressCard onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
      <QuestIcon icon={q.icon} color={color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="heading" style={{ color: q.state === 'done' ? t.inkMuted : t.ink }}>{q.title}</Txt>
        <Txt v="caption" muted>{`+${q.pts} pt${q.video ? ' · serve un video' : ''}`}</Txt>
      </View>
      {chip}
    </PressCard>
  );
}

function MonthCard() {
  const t = useTheme();
  const { state } = useStore();
  const bar = useSharedValue(0);
  const s = state!;
  const rank = s.month.ranking.indexOf(s.me) + 1;
  const me = s.members.find(m => m.id === s.me)!;
  const ahead = rank > 1 ? s.members.find(m => m.id === s.month.ranking[rank - 2]) : null;
  useEffect(() => { bar.value = withDelay(150, withSpring(s.month.day / s.month.days, SPRING.soft)); }, [s.month.day]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  const top3 = s.month.ranking.slice(0, 3).map(id => s.members.find(m => m.id === id)!).filter(Boolean);
  return (
    <View style={{ backgroundColor: t.azzurroSoft, borderRadius: radius.md, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Txt v="label" muted>{s.month.name}</Txt>
          <Txt v="score" color={t.azzurroText}>{`${rank}° posto`}</Txt>
        </View>
        <AvatarStack people={top3} />
      </View>
      <Txt style={{ fontSize: 15 }}>
        {s.members.length === 1 ? 'Sei da solo: invita gli amici dal pulsante del gruppo qui sopra.'
          : ahead ? `${ahead.pts - me.pts + 1 === 1 ? 'Ti manca 1 pt' : `Ti mancano ${ahead.pts - me.pts + 1} pt`} per superare ${ahead.name}.`
          : me.pts > 0 ? 'Sei in testa. Tieni duro fino a fine mese.' : 'Completa una quest per prendere i primi punti.'}
      </Txt>
      <View>
        <View style={{ height: 16, borderRadius: 8, backgroundColor: t.ground, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', borderRadius: 8, backgroundColor: t.azzurro }, barStyle]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Txt v="caption" muted>{`Giorno ${s.month.day} di ${s.month.days}`}</Txt>
          <Txt v="caption" muted>{s.month.days - s.month.day === 0 ? 'Ultimo giorno' : `Mancano ${s.month.days - s.month.day} giorni`}</Txt>
        </View>
      </View>
    </View>
  );
}

export function QuestScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const fx = useFx();
  const { state, refresh } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  if (!state) return null;
  const me = state.members.find(m => m.id === state.me)!;
  const list = state.quests.filter(q => q.kind === 'list');
  const ideas = state.quests.filter(q => q.kind === 'idea');
  const group = state.quests.filter(q => q.kind === 'group');
  const week = [...list, ...ideas];
  const current = state.quests.find(q => q.id === open) ?? null;
  const name = (id: string) => (id === state.me ? 'Tu' : state.members.find(m => m.id === id)?.name ?? 'Qualcuno');
  const verbFix = (id: string, text: string) => (id === state.me ? text.replace(/^ha /, 'hai ').replace(/^è entrato/, 'sei entrato') : text);

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} tintColor={t.azzurro} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={() => { tap(); setGroupOpen(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 12, borderRadius: radius.full, borderWidth: 2, borderColor: t.line }}>
            <AvatarStack people={state.members.slice(0, 5)} />
            <Txt style={{ fontFamily: font.black, fontSize: 15 }}>{state.group.name}</Txt>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: t.soleSoft }}>
            <Icon name="star" size={18} color={t.sole} />
            <Txt style={{ fontFamily: font.black, fontSize: 15, color: t.soleText }}>{me.pts.toLocaleString('it-IT')}</Txt>
          </View>
        </View>

        <Animated.View entering={FadeInDown.springify().damping(18)}><MonthCard /></Animated.View>

        {state.king ? <KingBanner /> : null}

        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <Section title="Questa settimana" right={<Txt v="caption" muted>{`${week.filter(q => q.state === 'done').length} di ${week.length} fatte`}</Txt>}>
            <Txt v="caption" muted style={{ marginTop: -6 }}>{`3 dalla vostra lista e 2 idee nuove. Le prossime escono ${state.week.daysToNext === 1 ? 'domani' : `tra ${state.week.daysToNext} giorni`}.`}</Txt>
            {list.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Icon name="bolt" size={16} color={t.lilla} /><Txt v="label" muted>Idee nuove della settimana</Txt>
            </View>
            {ideas.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <Section title="Proposte dal gruppo">
            {group.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
            <Pressable onPress={() => { tap(); setProposeOpen(true); }} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: t.lineStrong }}>
              <Icon name="plus" size={20} color={t.azzurroText} /><Txt style={{ fontFamily: font.black, color: t.azzurroText }}>Proponi una quest</Txt>
            </Pressable>
          </Section>
        </Animated.View>

        <Section title="Nel gruppo">
          <View>
            {state.feed.map((f, i) => {
              const m = state.members.find(x => x.id === f.who);
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < state.feed.length - 1 ? 1 : 0, borderColor: t.line }}>
                  <Avatar name={m?.name ?? '?'} color={m?.color ?? 'azzurro'} size={36} />
                  <Txt style={{ flex: 1, fontSize: 15, lineHeight: 20 }}><Txt style={{ fontFamily: font.bold, fontSize: 15 }}>{name(f.who)}</Txt> {verbFix(f.who, f.text)}</Txt>
                  <Txt v="caption" muted>{ago(f.at)}</Txt>
                </View>
              );
            })}
          </View>
        </Section>
      </ScrollView>

      <QuestSheet quest={current} onClose={() => setOpen(null)} />
      <GroupSheet open={groupOpen} onClose={() => setGroupOpen(false)} />
      <ProposeSheet open={proposeOpen} onClose={() => setProposeOpen(false)} onDone={() => { setProposeOpen(false); fx.toast('Quest proposta. Ora il gruppo la vede.', 'plus'); }} />
    </>
  );
}

function KingBanner() {
  const t = useTheme();
  const { state } = useStore();
  const k = state!.king!;
  const king = state!.members.find(m => m.id === k.memberId);
  const opt = k.outing ? state!.outingOptions[k.outing.k] : null;
  return (
    <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="crown" size={16} color={t.sole} /><Txt v="label" color={t.soleText}>{k.memberId === state!.me ? `Hai vinto ${state!.month.prevName}` : `${king?.name} ha vinto ${state!.month.prevName}`}</Txt>
      </View>
      <Txt v="heading">{k.outing ? `${opt?.label}: ${k.outing.v}` : k.memberId === state!.me ? 'Scegli una cosa della prossima uscita dalla Classifica.' : `${king?.name} sta scegliendo una cosa della prossima uscita.`}</Txt>
    </View>
  );
}

function GroupSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const fx = useFx();
  const { state, signOut } = useStore();
  const [confirm, setConfirm] = useState(false);
  if (!state) return null;
  const invite = `Entra nel nostro gruppo «${state.group.name}» su Side Friends. Codice: ${state.group.code}`;
  return (
    <Sheet open={open} onClose={() => { setConfirm(false); onClose(); }}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{state.group.name}</Txt>
      <View style={{ backgroundColor: t.nuvola, borderRadius: radius.md, padding: 16, gap: 10, alignItems: 'center' }}>
        <Txt v="label" muted>Codice d’invito</Txt>
        <Txt selectable style={{ fontFamily: font.display, fontSize: 34, letterSpacing: 6 }}>{state.group.code}</Txt>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Button style={{ flex: 1 }} kind="ghost" icon="copy" title="Copia" onPress={async () => { await Clipboard.setStringAsync(state.group.code); fx.toast('Codice copiato.', 'copy'); }} />
          {Platform.OS !== 'web' ? <Button style={{ flex: 1 }} icon="share" title="Invia" onPress={() => Share.share({ message: invite })} /> : null}
        </View>
      </View>
      <Txt v="caption" muted>{`${state.members.length} ${state.members.length === 1 ? 'persona' : 'persone'} · ognuno ha il suo colore`}</Txt>
      <View style={{ gap: 8 }}>
        {state.members.map(m => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: t.nuvola }}>
            <Avatar name={m.name} color={m.color} size={36} />
            <Txt v="heading" style={{ flex: 1 }}>{m.id === state.me ? `${m.name} (tu)` : m.name}</Txt>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: fill(t, m.color) }} />
          </View>
        ))}
      </View>
      {confirm ? (
        <View style={{ gap: 10 }}>
          <Txt muted>Se esci, su questo telefono perdi l’accesso al gruppo. Per rientrare ti serve di nuovo il codice, e ripartiresti come un nuovo membro.</Txt>
          <Button kind="danger" title="Esci dal gruppo" onPress={async () => { try { await api.leave(); } catch {} onClose(); signOut(); }} />
          <Button kind="ghost" title="Resta" onPress={() => setConfirm(false)} />
        </View>
      ) : <Button kind="ghost" title="Esci dal gruppo" onPress={() => setConfirm(true)} />}
    </Sheet>
  );
}

function ProposeSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useTheme();
  const { refresh } = useStore();
  const [title, setTitle] = useState('');
  const [pts, setPts] = useState(30);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError('');
    try { await api.propose(title, pts); await refresh(); setTitle(''); onDone(); tap('success'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Errore'); }
    finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>Proponi una quest</Txt>
      <Txt muted>Vale per tutto il mese e la vedono tutti nel gruppo. Massimo 3 a testa al mese.</Txt>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>Cosa bisogna fare?</Txt>
        <TextInput value={title} onChangeText={setTitle} maxLength={70} placeholder="Es. Fai un picnic in centro" placeholderTextColor={t.inkMuted}
          style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>Quanto vale?</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[20, 30, 50].map(n => (
            <Pressable key={n} onPress={() => { tap(); setPts(n); }} accessibilityRole="button" accessibilityState={{ selected: pts === n }}
              style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: pts === n ? t.azzurro : t.line, backgroundColor: pts === n ? t.azzurroSoft : t.ground }}>
              <Txt style={{ fontFamily: font.black, color: pts === n ? t.azzurroText : t.ink }}>{`${n} pt`}</Txt>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <Button title={busy ? 'Un attimo…' : 'Proponi al gruppo'} disabled={busy || title.trim().length < 4} onPress={submit} />
    </Sheet>
  );
}
