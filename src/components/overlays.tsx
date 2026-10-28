import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { SPRING, Txt } from './ui';

/* ---------- bottom sheet: slides up on a spring, drag down to close ---------- */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const H = Dimensions.get('window').height;
  const y = useSharedValue(H);
  const fade = useSharedValue(0);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = H; fade.value = 0;
      y.value = withSpring(0, SPRING.snappy);
      fade.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: 200 });
      y.value = withTiming(H, { duration: 240, easing: Easing.in(Easing.cubic) }, done => { if (done) runOnJS(setMounted)(false); });
    }
  }, [open]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => { y.value = g.dy > 0 ? g.dy : g.dy / 6; },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120 || g.vy > 0.9) onClose();
      else y.value = withSpring(0, SPRING.bouncy);
    }
  }), [onClose]);

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const back = useAnimatedStyle(() => ({ opacity: fade.value }));
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.backdrop }, back]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Chiudi" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View style={[{ backgroundColor: t.ground, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '90%', width: '100%', maxWidth: 520, alignSelf: 'center' }, sheet]}>
          <View {...pan.panHandlers} style={{ paddingTop: 10, paddingBottom: 6, alignItems: 'center' }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.lineStrong }} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(24, insets.bottom + 12), gap: 18 }}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- toasts and confetti, available everywhere ---------- */
type ToastMsg = { id: number; text: string; icon: string };
const FxCtx = createContext<{ toast: (text: string, icon?: string) => void; confetti: () => void }>({ toast: () => {}, confetti: () => {} });
export const useFx = () => useContext(FxCtx);

export function FxProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const [burst, setBurst] = useState(0);
  const n = useRef(0);
  const toast = useCallback((text: string, icon = 'star') => setMsg({ id: ++n.current, text, icon }), []);
  const confetti = useCallback(() => setBurst(b => b + 1), []);
  return (
    <FxCtx.Provider value={{ toast, confetti }}>
      {children}
      {burst > 0 ? <Confetti key={burst} /> : null}
      {msg ? <Toast key={msg.id} msg={msg} onDone={() => setMsg(m => (m && m.id === msg.id ? null : m))} /> : null}
    </FxCtx.Provider>
  );
}

function Toast({ msg, onDone }: { msg: ToastMsg; onDone: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-160);
  useEffect(() => {
    y.value = withSpring(0, SPRING.bouncy);
    const id = setTimeout(() => { y.value = withTiming(-160, { duration: 260 }, d => { if (d) runOnJS(onDone)(); }); }, 3200);
    return () => clearTimeout(id);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[{ position: 'absolute', left: 12, right: 12, top: insets.top + 8, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.ink, maxWidth: 520, alignSelf: 'center' }, style]}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.sole, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={msg.icon} size={18} color={t.onColor} />
      </View>
      <Txt style={{ flex: 1, color: t.ground, fontFamily: 'Figtree_700Bold', fontSize: 15, lineHeight: 20 }}>{msg.text}</Txt>
    </Animated.View>
  );
}

// Pills and discs in the friend colours, thrown up from the middle of the screen.
export function Confetti() {
  const t = useTheme();
  const { width, height } = Dimensions.get('window');
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    color: [t.azzurro, t.sole, t.fragola, t.menta, t.lilla][i % 5],
    pill: i % 2 === 0, dx: (Math.random() - 0.5) * width * 1.1, up: height * (0.25 + Math.random() * 0.25),
    rot: (Math.random() - 0.5) * 720, delay: Math.random() * 120, size: 7 + Math.random() * 6
  })), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <Piece key={i} p={p} x0={width / 2} y0={height * 0.45} fall={height} />)}
    </View>
  );
}
function Piece({ p, x0, y0, fall }: { p: { color: string; pill: boolean; dx: number; up: number; rot: number; delay: number; size: number }; x0: number; y0: number; fall: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withDelay(p.delay, withTiming(1, { duration: 2200, easing: Easing.linear })); }, []);
  const style = useAnimatedStyle(() => {
    const s = k.value;
    // a throw: up fast, then gravity
    const y = y0 - p.up * 4 * s + (p.up * 4 + fall * 0.9) * s * s;
    return { opacity: s < 0.8 ? 1 : (1 - s) * 5, transform: [{ translateX: x0 + p.dx * s }, { translateY: y }, { rotate: `${p.rot * s}deg` }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: p.pill ? p.size * 0.8 : p.size, height: p.pill ? p.size * 2.2 : p.size, borderRadius: p.size, backgroundColor: p.color }, style]} />;
}
