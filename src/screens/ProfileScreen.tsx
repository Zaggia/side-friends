import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { mediaUrl } from '../lib/api';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon } from '../components/Icon';
import { ProofMedia } from '../components/Media';
import { Avatar, Chip, Section, Txt } from '../components/ui';

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][m - 1] + ' ' + y;
};

export function ProfileScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const { state } = useStore();
  const [open, setOpen] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  if (!state) return null;
  const me = state.members.find(m => m.id === state.me)!;
  const approved = state.myProofs.filter(p => p.status === 'approved').length;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <Animated.View entering={FadeInDown.springify().damping(18)} style={{ alignItems: 'center', gap: 10 }}>
        <Avatar name={me.name} color={me.color} size={96} />
        <Txt v="display" style={{ fontSize: 26 }}>{me.name}</Txt>
        {me.wins.length ? <Chip tone="sole" icon="crown" label={`Re di ${monthLabel(me.wins[me.wins.length - 1]).split(' ')[0].toLowerCase()}`} /> : null}
        <Txt v="caption" muted>{`Nel gruppo ${state.group.name}`}</Txt>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[[me.pts.toLocaleString('it-IT'), 'Punti del mese'], [String(approved), 'Prove valide'], [String(me.wins.length), me.wins.length === 1 ? 'Trofeo' : 'Trofei']].map(([b, s]) => (
          <View key={s} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
            <Txt style={{ fontFamily: font.display, fontSize: 22 }}>{b}</Txt>
            <Txt v="caption" muted style={{ fontSize: 12, fontFamily: font.bold }}>{s}</Txt>
          </View>
        ))}
      </View>

      <Section title="Le tue prove" right={state.myProofs.length ? <Txt v="caption" muted>{`${state.myProofs.length}`}</Txt> : undefined}>
        {state.myProofs.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {state.myProofs.map(p => (
              <Pressable key={p.id} onPress={() => setOpen({ uri: mediaUrl(p.media), type: p.type })} style={{ width: '31.5%', aspectRatio: 4 / 5, borderRadius: radius.sm, overflow: 'hidden' }}>
                <ProofMedia uri={mediaUrl(p.media)} type={p.type} controls={false} autoPlay={false} style={{ width: '100%', height: '100%' }} />
                <View style={{ position: 'absolute', left: 6, bottom: 6 }}>
                  <Chip label={p.status === 'approved' ? 'Vale' : p.status === 'pending' ? 'Al voto' : 'Non vale'} tone={p.status === 'approved' ? 'done' : p.status === 'pending' ? 'active' : 'pending'} />
                </View>
                {p.type === 'video' ? <View style={{ position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: t.ground, alignItems: 'center', justifyContent: 'center' }}><Icon name="play" size={12} color={t.ink} /></View> : null}
              </Pressable>
            ))}
          </View>
        ) : <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: t.nuvola }}><Txt muted style={{ textAlign: 'center' }}>Le foto e i video che carichi per le quest finiscono qui.</Txt></View>}
      </Section>

      <Section title="Bacheca trofei">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {[...me.wins].reverse().map((w, i) => (
            <Animated.View key={w} entering={ZoomIn.delay(100 + i * 80).springify()} style={{ width: 112, padding: 14, alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.sole, alignItems: 'center', justifyContent: 'center' }}><Icon name="trophy" size={28} color={t.onColor} /></View>
              <Txt style={{ fontFamily: font.bold, fontSize: 13, textAlign: 'center' }}>{monthLabel(w)}</Txt>
            </Animated.View>
          ))}
          <View style={{ width: 112, padding: 14, alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: t.line }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.nuvola, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={26} color={t.inkMuted} /></View>
            <Txt style={{ fontFamily: font.bold, fontSize: 13, textAlign: 'center', color: t.inkMuted }}>{`${state.month.name[0].toUpperCase() + state.month.name.slice(1)}?`}</Txt>
          </View>
        </ScrollView>
      </Section>

      <Modal visible={!!open} animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {open ? <ProofMedia uri={open.uri} type={open.type} controls style={{ flex: 1 }} /> : null}
          <Pressable onPress={() => setOpen(null)} accessibilityLabel="Chiudi" style={{ position: 'absolute', top: 50, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} color="#0e1b33" />
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}
