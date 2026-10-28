import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { api, GroupState, mediaUrl } from '../lib/api';
import { fmtNum, useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { fill, font, radius, Theme, useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { ProofMedia } from './Media';
import { Sheet, useFx } from './overlays';
import { ErrorLine } from './QuestSheet';
import { Avatar, Button, Chip, Txt, tap } from './ui';

// The winner of last month holds four powers for this month, each usable once:
// one thing of the next hangout, the theme of the month, a special quest for a friend, and a veto.
const monthOf = (key: string, months: string[]) => months[Number(key.split('-')[1]) - 1];
const input = (t: Theme) => ({
  fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line,
  borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12
});
type Power = 'outing' | 'theme' | 'special' | 'veto';

function PowerRow({ icon, label, value, action, onPress }: { icon: string; label: string; value: string | null; action: string | null; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <View style={{ backgroundColor: t.ground, borderRadius: radius.sm, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: value ? t.sole : t.nuvola, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={value ? t.onColor : t.inkMuted} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="label" muted>{label}</Txt>
          {value ? <Txt v="heading">{value}</Txt> : <Txt muted>{tr.notYet}</Txt>}
        </View>
      </View>
      {!value && action ? <Button kind="sole" title={action} onPress={onPress} /> : null}
    </View>
  );
}

export function KingCard({ state }: { state: GroupState }) {
  const t = useTheme();
  const { t: tr, lang } = useI18n();
  const [open, setOpen] = useState<Power | null>(null);
  const king = state.king!;
  const kingMember = state.members.find(m => m.id === king.memberId);
  if (!kingMember) return null;
  const isKing = king.memberId === state.me;
  const nameOf = (id: string) => (id === state.me ? tr.you : state.members.find(m => m.id === id)?.name ?? tr.someone);
  const opt = king.outing ? tr.outing[king.outing.k] : null;
  const close = () => setOpen(null);
  return (
    <View style={{ backgroundColor: t.soleSoft, borderRadius: radius.md, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="crown" size={16} color={t.sole} /><Txt v="label" color={t.soleText}>{tr.winnerOf(monthOf(king.month, tr.months))}</Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={kingMember.name} color={kingMember.color} size={44} />
        <View style={{ flex: 1 }}>
          <Txt v="title">{tr.wonMonth(isKing, kingMember.name, monthOf(king.month, tr.months))}</Txt>
          <Txt v="caption" muted>{`${fmtNum(king.pts, lang)} pt`}</Txt>
        </View>
      </View>
      <View>
        <Txt v="title">{isKing ? tr.kingPowers : tr.powersOf(kingMember.name)}</Txt>
        {isKing ? <Txt v="caption" muted>{tr.kingPowersSub}</Txt> : null}
      </View>
      <PowerRow icon="fork" label={tr.powerOuting} value={king.outing ? `${opt?.label ?? tr.choiceLabel}: ${king.outing.v}` : null}
        action={isKing ? tr.chooseOuting : null} onPress={() => setOpen('outing')} />
      <PowerRow icon="palette" label={tr.powerTheme} value={king.theme?.text ?? null} action={isKing ? tr.chooseTheme : null} onPress={() => setOpen('theme')} />
      <PowerRow icon="star" label={tr.powerSpecial} value={king.special ? tr.specialFor(nameOf(king.special.to), king.special.title, king.special.pts) : null}
        action={isKing ? tr.giveSpecial : null} onPress={() => setOpen('special')} />
      <PowerRow icon="veto" label={tr.powerVeto} value={king.veto ? tr.vetoUsed(nameOf(king.veto.to), king.veto.questTitle, king.veto.status === 'approved') : null}
        action={isKing && !king.vetoUsed ? tr.useVeto : null} onPress={() => setOpen('veto')} />
      {king.outing ? <Txt v="caption" muted>{tr.restByGroup}</Txt> : null}

      <OutingSheet open={open === 'outing'} onClose={close} />
      <ThemeSheet open={open === 'theme'} onClose={close} />
      <SpecialSheet open={open === 'special'} onClose={close} state={state} />
      <VetoSheet open={open === 'veto'} onClose={close} state={state} />
    </View>
  );
}

// Runs one power, then refreshes the group and celebrates.
function usePower(onClose: () => void) {
  const { t: tr } = useI18n();
  const fx = useFx();
  const { refresh } = useStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>, toast: string, icon = 'crown') => {
    setBusy(true); setError('');
    try { await action(); await refresh(); onClose(); fx.confetti(); tap('success'); fx.toast(toast, icon); }
    catch (e) { setError(e instanceof Error ? e.message : tr.genericError); }
    finally { setBusy(false); }
  };
  return { error, busy, run };
}

function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? t.soleShade : t.line, backgroundColor: on ? t.sole : t.ground }}>
      <Txt style={{ fontFamily: font.bold, fontSize: 15, color: on ? t.onColor : t.ink }}>{label}</Txt>
    </Pressable>
  );
}

function OutingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [k, setK] = useState<string | null>(null);
  const [v, setV] = useState('');
  const { error, busy, run } = usePower(onClose);
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.chooseOuting}</Txt>
      <Txt muted>{tr.outingSub}</Txt>
      {Object.entries(tr.outing).map(([key, o]) => (
        <View key={key} style={{ gap: 8 }}>
          <Txt v="heading" style={{ fontSize: 15 }}>{o.label}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {o.opts.map(opt => <Choice key={opt} label={opt} on={k === key && v === opt} onPress={() => { setK(key); setV(opt); }} />)}
          </View>
        </View>
      ))}
      {k ? (
        <View style={{ gap: 6 }}>
          <Txt v="heading" style={{ fontSize: 15 }}>{tr.canWrite(tr.outing[k].label)}</Txt>
          <TextInput value={v} onChangeText={setV} maxLength={60} placeholderTextColor={t.inkMuted} placeholder={tr.outingPh} style={input(t)} />
        </View>
      ) : null}
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="sole" title={busy ? tr.wait : tr.confirmChoice} disabled={busy || !k || !v.trim()} onPress={() => run(() => api.outing(k!, v), tr.choiceToast)} />
    </Sheet>
  );
}

function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [text, setText] = useState('');
  const { error, busy, run } = usePower(onClose);
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.themeTitle}</Txt>
      <Txt muted>{tr.themeSub}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tr.themeOpts.map(o => <Choice key={o} label={o} on={text === o} onPress={() => setText(o)} />)}
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.themeWrite}</Txt>
        <TextInput value={text} onChangeText={setText} maxLength={40} placeholderTextColor={t.inkMuted} placeholder={tr.themePh} style={input(t)} />
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="sole" title={busy ? tr.wait : tr.themeConfirm} disabled={busy || text.trim().length < 3} onPress={() => run(() => api.theme(text), tr.themeToast, 'palette')} />
    </Sheet>
  );
}

function SpecialSheet({ open, onClose, state }: { open: boolean; onClose: () => void; state: GroupState }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [to, setTo] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [pts, setPts] = useState(30);
  const { error, busy, run } = usePower(onClose);
  const friends = state.members.filter(m => m.id !== state.me);
  const who = friends.find(m => m.id === to);
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.specialTitle}</Txt>
      <Txt muted>{tr.specialSub}</Txt>
      <View style={{ gap: 8 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.specialWho}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {friends.map(m => {
            const on = to === m.id;
            return (
              <Pressable key={m.id} onPress={() => { tap(); setTo(m.id); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 14, borderRadius: radius.full, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? fill(t, m.color) : t.line, backgroundColor: on ? t.nuvola : t.ground }}>
                <Avatar name={m.name} color={m.color} size={28} />
                <Txt style={{ fontFamily: font.bold, fontSize: 15 }}>{m.name}</Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.specialWhat}</Txt>
        <TextInput value={title} onChangeText={setTitle} maxLength={70} placeholderTextColor={t.inkMuted} placeholder={tr.specialPh} style={input(t)} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="heading" style={{ fontSize: 15 }}>{tr.howMuch}</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[20, 30, 50].map(n => (
            <Pressable key={n} onPress={() => { tap(); setPts(n); }} accessibilityRole="button" accessibilityState={{ selected: pts === n }}
              style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: pts === n ? t.sole : t.line, backgroundColor: pts === n ? t.soleSoft : t.ground }}>
              <Txt style={{ fontFamily: font.black, color: pts === n ? t.soleText : t.ink }}>{`+${n}`}</Txt>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="sole" icon="star" title={busy ? tr.wait : tr.specialSend} disabled={busy || !to || title.trim().length < 4}
        onPress={() => run(() => api.special(to!, title, pts), tr.specialToast(who?.name ?? ''), 'star')} />
    </Sheet>
  );
}

function VetoSheet({ open, onClose, state }: { open: boolean; onClose: () => void; state: GroupState }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [pick, setPick] = useState<string | null>(null);
  const { error, busy, run } = usePower(onClose);
  const list = state.king?.vetoable ?? [];
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.vetoTitle}</Txt>
      <Txt muted>{tr.vetoSub}</Txt>
      {list.length ? <Txt v="heading" style={{ fontSize: 15 }}>{tr.vetoPick}</Txt> : (
        <View style={{ backgroundColor: t.nuvola, borderRadius: radius.md, padding: 14 }}><Txt muted>{tr.vetoEmpty}</Txt></View>
      )}
      <View style={{ gap: 8 }}>
        {list.map(p => {
          const m = state.members.find(x => x.id === p.memberId);
          const on = pick === p.id;
          return (
            <Pressable key={p.id} onPress={() => { tap(); setPick(p.id); }} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? t.sole : t.line, backgroundColor: on ? t.soleSoft : t.ground }}>
              <View style={{ width: 56, height: 70, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: t.nuvola }}>
                <ProofMedia uri={mediaUrl(p.media)} type={p.type} controls={false} autoPlay={false} style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Txt v="heading" numberOfLines={2}>{p.questTitle}</Txt>
                <Txt v="caption" muted>{m?.name ?? tr.someone}</Txt>
                <View style={{ flexDirection: 'row' }}>
                  <Chip label={tr.vetoFlip(p.status === 'approved')} tone={p.status === 'approved' ? 'done' : 'pending'} />
                </View>
              </View>
              {on ? <Icon name="check" size={22} color={t.soleText} /> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <ErrorLine text={error} /> : null}
      {list.length ? <Button kind="sole" icon="veto" title={busy ? tr.wait : tr.vetoConfirm} disabled={busy || !pick} onPress={() => run(() => api.veto(pick!), tr.vetoToast, 'veto')} /> : null}
    </Sheet>
  );
}
