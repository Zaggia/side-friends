import { useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, Share, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { api, FeedItem, GroupState, Quest } from '../lib/api';
import { fmtNum, useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { fill, font, radius, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { LeaveSheet } from '../components/LeaveGroup';
import { Sheet, useFx } from '../components/overlays';
import { QuestSheet, ErrorLine } from '../components/QuestSheet';
import { GroupSetup } from './Welcome';
import { Avatar, AvatarStack, Button, Chip, PressCard, QuestIcon, SPRING, Section, Txt, tap } from '../components/ui';

export const monthOf = (key: string, months: string[]) => months[Number(key.split('-')[1]) - 1];
export const prevMonthKey = (key: string) => { const [y, m] = key.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };

export function QuestCard({ q, onPress }: { q: Quest; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const color = q.kind === 'idea' ? 'lilla' : q.kind === 'group' ? 'menta' : ['azzurro', 'fragola', 'sole'][q.id.length % 3];
  const chip = q.state === 'done' ? <Chip label={tr.chipDone} tone="done" icon="check" />
    : q.state === 'pending' ? <Chip label={tr.chipPending} tone="pending" />
    : q.state === 'active' ? <Chip label={tr.chipActive} tone="active" /> : <Chip label={tr.chipNew} />;
  return (
    <PressCard onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
      <QuestIcon icon={q.icon} color={color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="heading" style={{ color: q.state === 'done' ? t.inkMuted : t.ink }}>{q.title}</Txt>
        <Txt v="caption" muted>{tr.ptsLine(q.pts, q.video)}</Txt>
      </View>
      {chip}
    </PressCard>
  );
}

function MonthCard() {
  const t = useTheme();
  const { t: tr } = useI18n();
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
        <View style={{ flex: 1 }}>
          <Txt v="label" muted>{monthOf(s.month.key, tr.months)}</Txt>
          <Txt v="score" color={t.azzurroText} numberOfLines={1} adjustsFontSizeToFit>{tr.rankLabel(rank)}</Txt>
        </View>
        <AvatarStack people={top3} />
      </View>
      <Txt style={{ fontSize: 15 }}>
        {s.members.length === 1 ? tr.alone
          : ahead ? tr.behind(ahead.pts - me.pts + 1, ahead.name)
          : me.pts > 0 ? tr.leading : tr.noPoints}
      </Txt>
      <View>
        <View style={{ height: 16, borderRadius: 8, backgroundColor: t.ground, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', borderRadius: 8, backgroundColor: t.azzurro }, barStyle]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Txt v="caption" muted>{tr.dayOf(s.month.day, s.month.days)}</Txt>
          <Txt v="caption" muted>{tr.daysLeft(s.month.days - s.month.day)}</Txt>
        </View>
      </View>
    </View>
  );
}

function feedLine(f: FeedItem, me: boolean, tr: ReturnType<typeof useI18n>['t']) {
  if (f.kind === 'proof') return tr.feed.proof(me, f.media === 'video', f.quest ?? '');
  if (f.kind === 'done') return tr.feed.done(me, f.quest ?? '', f.pts ?? 0);
  if (f.kind === 'proposal') return tr.feed.proposal(me, f.quest ?? '');
  return tr.feed.join(me);
}
function ago(iso: string, tr: ReturnType<typeof useI18n>['t']) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return tr.ago.now;
  if (m < 60) return tr.ago.min(m);
  const h = Math.round(m / 60);
  return h < 24 ? tr.ago.h(h) : tr.ago.d(Math.round(h / 24));
}

export function QuestScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const { t: tr, lang } = useI18n();
  const fx = useFx();
  const { state, refresh } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  if (!state) return null;
  const me = state.members.find(m => m.id === state.me)!;
  const list = state.quests.filter(q => q.kind === 'list');
  const ideas = state.quests.filter(q => q.kind === 'idea');
  const group = state.quests.filter(q => q.kind === 'group');
  const week = [...list, ...ideas];
  const current = state.quests.find(q => q.id === open) ?? null;

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} tintColor={t.azzurro} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => { tap(); setGroupOpen(true); }} accessibilityRole="button" style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 12, borderRadius: radius.full, borderWidth: 2, borderColor: t.line }}>
            <AvatarStack people={state.members.slice(0, 5)} />
            <Txt numberOfLines={1} style={{ flexShrink: 1, fontFamily: font.black, fontSize: 15 }}>{state.group.name}</Txt>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: t.soleSoft }}>
            <Icon name="star" size={18} color={t.sole} />
            <Txt style={{ fontFamily: font.black, fontSize: 15, color: t.soleText }}>{fmtNum(me.pts, lang)}</Txt>
          </View>
        </View>

        <Animated.View entering={FadeInDown.springify().damping(18)}><MonthCard /></Animated.View>

        {state.king ? <KingBanner state={state} /> : null}

        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <Section title={tr.thisWeek} right={<Txt v="caption" muted>{tr.doneOf(week.filter(q => q.state === 'done').length, week.length)}</Txt>}>
            <Txt v="caption" muted style={{ marginTop: -6 }}>{tr.weekNote(state.week.daysToNext)}</Txt>
            {list.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Icon name="bolt" size={16} color={t.lilla} /><Txt v="label" muted>{tr.newIdeas}</Txt>
            </View>
            {ideas.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <Section title={tr.groupProposals}>
            {group.map(q => <QuestCard key={q.id} q={q} onPress={() => setOpen(q.id)} />)}
            <Pressable onPress={() => { tap(); setProposeOpen(true); }} accessibilityRole="button" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: t.lineStrong }}>
              <Icon name="plus" size={20} color={t.azzurroText} /><Txt style={{ fontFamily: font.black, color: t.azzurroText }}>{tr.proposeQuest}</Txt>
            </Pressable>
          </Section>
        </Animated.View>

        <Section title={tr.inGroup}>
          <View>
            {state.feed.map((f, i) => {
              const m = state.members.find(x => x.id === f.who);
              const mine = f.who === state.me;
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < state.feed.length - 1 ? 1 : 0, borderColor: t.line }}>
                  <Avatar name={m?.name ?? '?'} color={m?.color ?? 'azzurro'} size={36} />
                  <Txt style={{ flex: 1, fontSize: 15, lineHeight: 20 }}>
                    <Txt style={{ fontFamily: font.bold, fontSize: 15 }}>{mine ? tr.you : m?.name ?? tr.someone}</Txt> {feedLine(f, mine, tr)}
                  </Txt>
                  <Txt v="caption" muted>{ago(f.at, tr)}</Txt>
                </View>
              );
            })}
          </View>
        </Section>
      </ScrollView>

      <QuestSheet quest={current} onClose={() => setOpen(null)} />
      <GroupSheet open={groupOpen} onClose={() => setGroupOpen(false)}
        onLeave={() => { setGroupOpen(false); setTimeout(() => setLeaveOpen(true), 280); }}
        onAdd={() => { setGroupOpen(false); setTimeout(() => setAddOpen(true), 280); }} />
      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <GroupSetup compact onDone={() => { setAddOpen(false); }} />
      </Sheet>
      <LeaveSheet open={leaveOpen} onClose={() => setLeaveOpen(false)} />
      <ProposeSheet open={proposeOpen} onClose={() => setProposeOpen(false)} onDone={() => { setProposeOpen(false); fx.toast(tr.proposedToast, 'plus'); }} />
    </>
  );
}

function KingBanner({ state }: { state: GroupState }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const k = state.king!;
  const king = state.members.find(m => m.id === k.memberId);
  const me = k.memberId === state.me;
  const opt = k.outing ? tr.outing[k.outing.k] : null;
  return (
    <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="crown" size={16} color={t.sole} /><Txt v="label" color={t.soleText}>{tr.wonMonth(me, king?.name ?? '', monthOf(k.month, tr.months))}</Txt>
      </View>
      <Txt v="heading">{k.outing ? `${opt?.label ?? ''}: ${k.outing.v}` : me ? tr.chooseFromRank : tr.isChoosing(king?.name ?? '')}</Txt>
    </View>
  );
}

function GroupSheet({ open, onClose, onLeave, onAdd }: { open: boolean; onClose: () => void; onLeave: () => void; onAdd: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const fx = useFx();
  const { state, me, switchGroup } = useStore();
  if (!state) return null;
  const others = (me?.groups ?? []).filter(g => g.id !== state.group.id);
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{state.group.name}</Txt>
      <View style={{ backgroundColor: t.nuvola, borderRadius: radius.md, padding: 16, gap: 10, alignItems: 'center' }}>
        <Txt v="label" muted>{tr.inviteCode}</Txt>
        <Txt selectable style={{ fontFamily: font.display, fontSize: 34, letterSpacing: 6 }}>{state.group.code}</Txt>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Button style={{ flex: 1 }} kind="ghost" icon="copy" title={tr.copy} onPress={async () => { await Clipboard.setStringAsync(state.group.code); fx.toast(tr.codeCopied, 'copy'); }} />
          {Platform.OS !== 'web' ? <Button style={{ flex: 1 }} icon="share" title={tr.send} onPress={() => Share.share({ message: tr.inviteMsg(state.group.name, state.group.code) })} /> : null}
        </View>
      </View>
      <Txt v="caption" muted>{tr.peopleCount(state.members.length)}</Txt>
      <View style={{ gap: 8 }}>
        {state.members.map(m => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: t.nuvola }}>
            <Avatar name={m.name} color={m.color} size={36} />
            <Txt v="heading" style={{ flex: 1 }}>{m.id === state.me ? `${m.name} ${tr.youSuffix}` : m.name}</Txt>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: fill(t, m.color) }} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title">{tr.yourGroups}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 2, borderColor: t.azzurro, backgroundColor: t.azzurroSoft }}>
          <Icon name="users" size={20} color={t.azzurroText} />
          <Txt v="heading" style={{ flex: 1, color: t.azzurroText }}>{state.group.name}</Txt>
          <Chip label={tr.active} tone="active" icon="check" />
        </View>
        {others.map(g => (
          <Pressable key={g.id} accessibilityRole="button" onPress={() => { tap(); onClose(); switchGroup(g.id); fx.toast(tr.switchedTo(g.name), 'users'); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: t.line }}>
            <Icon name="users" size={20} color={t.ink} />
            <Txt v="heading" style={{ flex: 1 }}>{g.name}</Txt>
            <Txt v="caption" muted>{tr.peopleCount(g.members).split(' · ')[0]}</Txt>
          </Pressable>
        ))}
        <Button kind="ghost" icon="plus" title={tr.addGroup} onPress={onAdd} />
      </View>
      <Button kind="ghost" title={tr.leaveGroup} onPress={onLeave} />
    </Sheet>
  );
}

function ProposeSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { refresh } = useStore();
  const [title, setTitle] = useState('');
  const [pts, setPts] = useState(30);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError('');
    try { await api.propose(title, pts); await refresh(); setTitle(''); onDone(); tap('success'); }
    catch (e) { setError(e instanceof Error ? e.message : tr.genericError); }
    finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.proposeTitle}</Txt>
      <Txt muted>{tr.proposeSub}</Txt>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.whatToDo}</Txt>
        <TextInput value={title} onChangeText={setTitle} maxLength={70} placeholder={tr.proposePh} placeholderTextColor={t.inkMuted}
          style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.howMuch}</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[20, 30, 50].map(n => (
            <Pressable key={n} onPress={() => { tap(); setPts(n); }} accessibilityRole="button" accessibilityState={{ selected: pts === n }}
              style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: pts === n ? t.azzurro : t.line, backgroundColor: pts === n ? t.azzurroSoft : t.ground }}>
              <Txt style={{ fontFamily: font.black, color: pts === n ? t.azzurroText : t.ink }}>{`+${n}`}</Txt>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <Button title={busy ? tr.wait : tr.proposeSend} disabled={busy || title.trim().length < 4} onPress={submit} />
    </Sheet>
  );
}
