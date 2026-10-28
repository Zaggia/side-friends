import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, mediaUrl, ToVote } from '../lib/api';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon, Mark } from '../components/Icon';
import { ProofMedia } from '../components/Media';
import { useFx } from '../components/overlays';
import { Avatar, Button, SPRING, Txt, tap } from '../components/ui';

function Card({ p, top, request, onVote }: { p: ToVote; top: boolean; request: boolean | null; onVote: (ok: boolean) => void }) {
  const t = useTheme();
  const { state } = useStore();
  const who = state!.members.find(m => m.id === p.memberId);
  const x = useSharedValue(0), y = useSharedValue(0);
  const W = Dimensions.get('window').width;

  const fling = (ok: boolean) => {
    x.value = withTiming(ok ? W * 1.4 : -W * 1.4, { duration: 320, easing: Easing.out(Easing.quad) }, d => { if (d) runOnJS(onVote)(ok); });
    y.value = withTiming(40, { duration: 320 });
  };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => top && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => { x.value = g.dx; y.value = g.dy * 0.3; },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 110 || Math.abs(g.vx) > 0.8) { tap('medium'); fling(g.dx > 0); }
      else { x.value = withSpring(0, SPRING.bouncy); y.value = withSpring(0, SPRING.bouncy); }
    }
  }), [top]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${x.value / 18}deg` }, { scale: top ? 1 : 0.94 }]
  }));
  const yes = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, 90], [0, 1], 'clamp') }));
  const no = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-90, 0], [1, 0], 'clamp') }));
  useEffect(() => { if (request !== null) fling(request); }, [request]);
  const [full, setFull] = useState(false);

  return (
    <Animated.View {...(top ? pan.panHandlers : {})} style={[{ position: 'absolute', inset: 0, top: top ? 0 : 14, borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 6, borderColor: t.line, backgroundColor: t.ground, overflow: 'hidden' }, style]}>
      <View style={{ flex: 1 }}>
        <ProofMedia uri={mediaUrl(p.media)} type={p.type} controls={false} autoPlay={top} style={{ width: '100%', height: '100%' }} />
        {p.type === 'video' && top ? (
          <Pressable onPress={() => setFull(true)} style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.ground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full }}>
            <Icon name="play" size={14} color={t.ink} /><Txt v="caption" style={{ fontFamily: font.black }}>Guarda con audio</Txt>
          </Pressable>
        ) : null}
        <Animated.View style={[{ position: 'absolute', left: 20, top: 28, transform: [{ rotate: '-12deg' }], borderWidth: 4, borderColor: t.azzurroText, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: t.ground }, yes]}>
          <Txt style={{ fontFamily: font.display, fontSize: 26, color: t.azzurroText }}>VALE</Txt>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', right: 20, top: 28, transform: [{ rotate: '12deg' }], borderWidth: 4, borderColor: t.fragolaText, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: t.ground }, no]}>
          <Txt style={{ fontFamily: font.display, fontSize: 26, color: t.fragolaText }}>NON VALE</Txt>
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <Avatar name={who?.name ?? '?'} color={who?.color ?? 'azzurro'} />
        <View style={{ flex: 1 }}>
          <Txt v="heading" numberOfLines={2}>{`${who?.name ?? 'Qualcuno'} · ${p.questTitle}`}</Txt>
          <Txt v="caption" muted numberOfLines={2}>{p.note ? `«${p.note}» · ` : ''}{`+${p.pts} pt se vale`}</Txt>
        </View>
      </View>
      <Modal visible={full} animationType="slide" onRequestClose={() => setFull(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {full ? <FullVideo uri={mediaUrl(p.media)} /> : null}
          <Pressable onPress={() => setFull(false)} accessibilityLabel="Chiudi" style={{ position: 'absolute', top: 50, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} color="#0e1b33" />
          </Pressable>
        </View>
      </Modal>
    </Animated.View>
  );
}

function FullVideo({ uri }: { uri: string }) {
  // Full screen with sound and the system controls.
  const player = useVideoPlayer(uri, pl => { pl.loop = true; pl.muted = false; pl.play(); });
  return <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />;
}

export function VoteScreen({ topInset }: { topInset: number }) {
  const t = useTheme();
  const fx = useFx();
  const insets = useSafeAreaInsets();
  const { state, refresh } = useStore();
  const [gone, setGone] = useState<string[]>([]);
  const [request, setRequest] = useState<{ id: string; ok: boolean } | null>(null);
  if (!state) return null;
  const queue = state.toVote.filter(p => !gone.includes(p.id));

  const vote = async (p: ToVote, ok: boolean) => {
    setGone(g => [...g, p.id]);
    setRequest(null);
    const who = state.members.find(m => m.id === p.memberId)?.name ?? 'Qualcuno';
    fx.toast(ok ? `Hai votato: vale. ${who} prende +${p.pts} pt se il gruppo è d’accordo.` : 'Hai votato: non vale.', ok ? 'check' : 'x');
    try { await api.vote(p.id, ok ? 'yes' : 'no'); } catch (e) { fx.toast(e instanceof Error ? e.message : 'Voto non registrato.', 'x'); }
    refresh();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingHorizontal: 16, paddingBottom: 24, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center', flexGrow: 1 }}>
      <View>
        <Txt v="display">Da votare</Txt>
        <Txt muted>Guarda le prove degli amici e decidi se valgono.</Txt>
      </View>
      {queue.length ? (
        <>
          <View style={{ height: Math.min(520, Dimensions.get('window').height - topInset - insets.bottom - 300) }}>
            {queue.slice(0, 2).reverse().map((p, i, arr) => (
              <Card key={p.id} p={p} top={i === arr.length - 1} request={request?.id === p.id ? request.ok : null} onVote={ok => vote(p, ok)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32 }}>
            <RoundButton icon="x" label="Non vale" color={t.fragolaText} bg={t.ground} edge={t.line} onPress={() => !request && setRequest({ id: queue[0].id, ok: false })} />
            <RoundButton icon="check" label="Vale" color={t.onColor} bg={t.azzurro} edge={t.azzurroShade} onPress={() => !request && setRequest({ id: queue[0].id, ok: true })} />
          </View>
          <Txt v="caption" muted style={{ textAlign: 'center' }}>Trascina la prova a destra se vale, a sinistra se no.</Txt>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 48 }}>
          <Mark size={96} colors={[t.azzurro, t.sole, t.fragola]} />
          <Txt v="title" style={{ fontSize: 20 }}>Hai votato tutto</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 280 }}>Quando qualcuno carica una nuova prova te la trovi qui.</Txt>
        </View>
      )}
    </ScrollView>
  );
}

function RoundButton({ icon, label, color, bg, edge, onPress }: { icon: string; label: string; color: string; bg: string; edge: string; onPress: () => void }) {
  const d = useSharedValue(0);
  const t = useTheme();
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: d.value * 5 }] }));
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityLabel={label} onPressIn={() => { d.value = withTiming(1, { duration: 60 }); }} onPressOut={() => { d.value = withSpring(0, SPRING.snappy); }} onPress={() => { tap('medium'); onPress(); }} style={{ width: 72, height: 77 }}>
        <View style={{ position: 'absolute', top: 5, width: 72, height: 72, borderRadius: 36, backgroundColor: edge }} />
        <Animated.View style={[{ width: 72, height: 72, borderRadius: 36, backgroundColor: bg, borderWidth: 2, borderColor: bg === t.ground ? t.line : bg, alignItems: 'center', justifyContent: 'center' }, face]}>
          <Icon name={icon} size={32} color={color} />
        </Animated.View>
      </Pressable>
      <Txt style={{ fontFamily: font.black, fontSize: 13 }}>{label}</Txt>
    </View>
  );
}
