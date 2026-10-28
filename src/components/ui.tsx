import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { fill, font, radius, shade, useTheme } from '../lib/theme';
import { Icon } from './Icon';

export const SPRING = { snappy: { damping: 26, stiffness: 380, mass: 1 }, bouncy: { damping: 13, stiffness: 240, mass: 1 }, soft: { damping: 20, stiffness: 170, mass: 1 } };

export function tap(kind: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

type Variant = 'display' | 'title' | 'score' | 'heading' | 'body' | 'caption' | 'label';
const TYPE: Record<Variant, TextStyle> = {
  display: { fontFamily: font.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.3 },
  title: { fontFamily: font.displayBold, fontSize: 18, lineHeight: 24 },
  score: { fontFamily: font.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  heading: { fontFamily: font.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 23 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.black, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' }
};
export function Txt({ v = 'body', muted, color, style, ...rest }: TextProps & { v?: Variant; muted?: boolean; color?: string }) {
  const t = useTheme();
  return <Text {...rest} style={[TYPE[v], { color: color ?? (muted ? t.inkMuted : t.ink) }, style]} />;
}

// Duolingo-style button: a thick bottom edge that collapses when pressed.
export function Button({ title, onPress, kind = 'primary', icon, disabled, style }: {
  title: string; onPress?: () => void; kind?: 'primary' | 'sole' | 'ghost' | 'danger'; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const down = useSharedValue(0);
  const bg = disabled ? t.nuvola : kind === 'primary' ? t.azzurro : kind === 'sole' ? t.sole : kind === 'danger' ? t.fragola : t.ground;
  const edge = disabled ? t.line : kind === 'primary' ? t.azzurroShade : kind === 'sole' ? t.soleShade : kind === 'danger' ? t.fragolaShade : t.line;
  const fg = disabled ? t.inkMuted : kind === 'ghost' ? t.ink : t.onColor;
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * 4 }] }));
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPressIn={() => { down.value = withTiming(1, { duration: 60 }); }}
      onPressOut={() => { down.value = withSpring(0, SPRING.snappy); }}
      onPress={() => { tap(); onPress?.(); }}
      style={[{ alignSelf: 'stretch', paddingBottom: 4 }, style]}
    >
      <View style={[StyleSheet.absoluteFill, { top: 4, borderRadius: radius.full, backgroundColor: edge }]} />
      <Animated.View style={[styles.btn, { backgroundColor: bg, borderColor: kind === 'ghost' ? t.line : bg }, face]}>
        {icon ? <Icon name={icon} size={20} color={fg} /> : null}
        <Txt style={{ fontFamily: font.black, fontSize: 16, color: fg }}>{title}</Txt>
      </Animated.View>
    </Pressable>
  );
}

// A pressable card with the same collapsing bottom edge.
export function PressCard({ children, onPress, style, bg }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; bg?: string }) {
  const t = useTheme();
  const down = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * 3 }] }));
  return (
    <Pressable
      onPressIn={() => { down.value = withTiming(1, { duration: 60 }); }}
      onPressOut={() => { down.value = withSpring(0, SPRING.snappy); }}
      onPress={() => { tap(); onPress?.(); }}
      style={{ paddingBottom: 3 }}
    >
      <View style={[StyleSheet.absoluteFill, { top: 3, borderRadius: radius.md, backgroundColor: t.line }]} />
      <Animated.View style={[{ backgroundColor: bg ?? t.ground, borderWidth: 2, borderColor: t.line, borderRadius: radius.md }, style, face]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Avatar({ name, color, size = 40, ring }: { name: string; color: string; size?: number; ring?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fill(t, color), alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: t.ground }}>
      <Text style={{ fontFamily: font.display, fontSize: size * 0.38, color: t.onColor }}>{(name[0] || '?').toUpperCase()}</Text>
    </View>
  );
}
export function AvatarStack({ people, size = 28 }: { people: { name: string; color: string }[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((p, i) => <View key={i} style={{ marginLeft: i ? -size * 0.35 : 0 }}><Avatar name={p.name} color={p.color} size={size} ring /></View>)}
    </View>
  );
}

export function QuestIcon({ icon, color, size = 52 }: { icon: string; color: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: shade(t, color), paddingBottom: size * 0.08 }}>
      <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: fill(t, color), alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={size * 0.5} color={t.onColor} />
      </View>
    </View>
  );
}

export function Chip({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'active' | 'pending' | 'done' | 'sole'; icon?: string }) {
  const t = useTheme();
  const map = { neutral: [t.nuvola, t.inkMuted], active: [t.azzurroSoft, t.azzurroText], pending: [t.fragolaSoft, t.fragolaText], done: [t.azzurro, t.onColor], sole: [t.soleSoft, t.soleText] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full }}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Text style={{ fontFamily: font.black, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Txt v="title">{title}</Txt>{right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: radius.full, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 }
});
