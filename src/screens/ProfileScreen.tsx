import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { mediaUrl } from '../lib/api';
import { fmtNum, LANGS, useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { LanguageSheet } from '../components/Language';
import { LeaveSheet } from '../components/LeaveGroup';
import { ProofMedia } from '../components/Media';
import { Sheet, useFx } from '../components/overlays';
import { Button } from '../components/ui';
import { Avatar, Chip, Section, Txt, tap } from '../components/ui';
import { monthOf } from './QuestScreen';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SettingRow({ icon, label, value, danger, onPress }: { icon: string; label: string; value?: string; danger?: boolean; onPress: () => void }) {
  const t = useTheme();
  const color = danger ? t.fragolaText : t.ink;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: danger ? t.fragolaSoft : t.ground, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Txt v="heading" style={{ flex: 1, color }}>{label}</Txt>
      {value ? <Txt v="caption" muted>{value}</Txt> : null}
    </Pressable>
  );
}

export function ProfileScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const { t: tr, lang } = useI18n();
  const { state, me: account, logOut } = useStore();
  const fx = useFx();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [open, setOpen] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  if (!state) return null;
  const me = state.members.find(m => m.id === state.me)!;
  const approved = state.myProofs.filter(p => p.status === 'approved').length;
  const monthLabel = (key: string) => `${cap(monthOf(key, tr.months))} ${key.split('-')[0]}`;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <Animated.View entering={FadeInDown.springify().damping(18)} style={{ alignItems: 'center', gap: 10 }}>
        <Avatar name={me.name} color={me.color} size={96} />
        <Txt v="display" style={{ fontSize: 26 }}>{me.name}</Txt>
        {me.wins.length ? <Chip tone="sole" icon="crown" label={tr.kingOf(monthOf(me.wins[me.wins.length - 1], tr.months))} /> : null}
        <Txt v="caption" muted>{tr.groupOf(state.group.name)}</Txt>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[[fmtNum(me.pts, lang), tr.monthPoints], [String(approved), tr.validProofs], [String(me.wins.length), tr.trophies(me.wins.length)]].map(([b, s]) => (
          <View key={s} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
            <Txt style={{ fontFamily: font.display, fontSize: 22 }}>{b}</Txt>
            <Txt v="caption" muted numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 12, fontFamily: font.bold }}>{s}</Txt>
          </View>
        ))}
      </View>

      <Section title={tr.yourProofs} right={state.myProofs.length ? <Txt v="caption" muted>{String(state.myProofs.length)}</Txt> : undefined}>
        {state.myProofs.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {state.myProofs.map(p => (
              <Pressable key={p.id} onPress={() => setOpen({ uri: mediaUrl(p.media), type: p.type })} style={{ width: '31.5%', aspectRatio: 4 / 5, borderRadius: radius.sm, overflow: 'hidden' }}>
                <ProofMedia uri={mediaUrl(p.media)} type={p.type} controls={false} autoPlay={false} style={{ width: '100%', height: '100%' }} />
                <View style={{ position: 'absolute', left: 6, bottom: 6 }}>
                  <Chip label={p.status === 'approved' ? tr.statusValid : p.status === 'pending' ? tr.statusVoting : tr.statusRejected} tone={p.status === 'approved' ? 'done' : p.status === 'pending' ? 'active' : 'pending'} />
                </View>
                {p.type === 'video' ? <View style={{ position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: t.ground, alignItems: 'center', justifyContent: 'center' }}><Icon name="play" size={12} color={t.ink} /></View> : null}
              </Pressable>
            ))}
          </View>
        ) : <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: t.nuvola }}><Txt muted style={{ textAlign: 'center' }}>{tr.proofsEmpty}</Txt></View>}
      </Section>

      <Section title={tr.trophyCase}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {[...me.wins].reverse().map((w, i) => (
            <Animated.View key={w} entering={ZoomIn.delay(100 + i * 80).springify()} style={{ width: 112, padding: 14, alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.sole, alignItems: 'center', justifyContent: 'center' }}><Icon name="trophy" size={28} color={t.onColor} /></View>
              <Txt style={{ fontFamily: font.bold, fontSize: 13, textAlign: 'center' }}>{monthLabel(w)}</Txt>
            </Animated.View>
          ))}
          <View style={{ width: 112, padding: 14, alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.nuvola, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={26} color={t.inkMuted} /></View>
            <Txt style={{ fontFamily: font.bold, fontSize: 13, textAlign: 'center', color: t.inkMuted }}>{`${cap(monthOf(state.month.key, tr.months))}?`}</Txt>
          </View>
        </ScrollView>
      </Section>

      <Section title={tr.settings}>
        <View style={{ borderRadius: radius.md, backgroundColor: t.nuvola, overflow: 'hidden' }}>
          <SettingRow icon="user" label={tr.account} value={account ? `@${account.account.username}` : undefined} onPress={() => setLogoutOpen(true)} />
          <View style={{ height: 1, backgroundColor: t.line, marginLeft: 62 }} />
          <SettingRow icon="chat" label={tr.language} value={LANGS.find(l => l.code === lang)?.name} onPress={() => setLangOpen(true)} />
          <View style={{ height: 1, backgroundColor: t.line, marginLeft: 62 }} />
          <SettingRow icon="x" label={tr.leaveGroup} value={state.group.name} danger onPress={() => setLeaveOpen(true)} />
          <View style={{ height: 1, backgroundColor: t.line, marginLeft: 62 }} />
          <SettingRow icon="share" label={tr.logOut} onPress={() => setLogoutOpen(true)} />
        </View>
      </Section>

      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Avatar name={me.name} color={me.color} size={64} />
          <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{account?.account.name ?? me.name}</Txt>
          <Txt muted>{account ? `@${account.account.username}` : ''}</Txt>
        </View>
        <View style={{ backgroundColor: t.nuvola, borderRadius: radius.md, padding: 14 }}>
          <Txt muted>{tr.logOutWarn}</Txt>
        </View>
        <Button kind="danger" title={tr.logOut} onPress={async () => { setLogoutOpen(false); await logOut(); fx.toast(tr.loggedOut, 'user'); }} />
        <Button kind="ghost" title={tr.stay} onPress={() => setLogoutOpen(false)} />
      </Sheet>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <LeaveSheet open={leaveOpen} onClose={() => setLeaveOpen(false)} />

      <Modal visible={!!open} animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {open ? <ProofMedia uri={open.uri} type={open.type} controls style={{ flex: 1 }} /> : null}
          <Pressable onPress={() => setOpen(null)} accessibilityLabel={tr.close} style={{ position: 'absolute', top: 50, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} color="#0e1b33" />
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}
