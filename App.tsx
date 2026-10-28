import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useFonts, Unbounded_700Bold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { StoreProvider, useStore } from './src/lib/store';
import { LangProvider, useI18n } from './src/lib/i18n';
import { LanguageScreen } from './src/components/Language';
import { font, radius, useTheme } from './src/lib/theme';
import { FxProvider } from './src/components/overlays';
import { Icon, Mark } from './src/components/Icon';
import { Button, SPRING, Txt, tap } from './src/components/ui';
import { Welcome } from './src/screens/Welcome';
import { QuestScreen } from './src/screens/QuestScreen';
import { VoteScreen } from './src/screens/VoteScreen';
import { RankScreen } from './src/screens/RankScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type Tab = 'quest' | 'vota' | 'classifica' | 'profilo';
const TABS: { id: Tab; icon: string }[] = [
  { id: 'quest', icon: 'quest' },
  { id: 'vota', icon: 'vote' },
  { id: 'classifica', icon: 'podium' },
  { id: 'profilo', icon: 'user' }
];

export default function App() {
  const [loaded] = useFonts({ Unbounded_700Bold, Unbounded_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <LangProvider>
        <StoreProvider>
          <FxProvider>{loaded ? <Root /> : <Splash />}</FxProvider>
        </StoreProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}

function Splash() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ground, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <Mark size={110} colors={[t.azzurro, t.sole, t.fragola]} />
      <ActivityIndicator color={t.azzurro} />
    </View>
  );
}

function Root() {
  const { ready, signedIn, state, error, refresh, left } = useStore();
  const { ready: langReady, chosen, lang, t: tr } = useI18n();
  const t = useTheme();
  // Quest titles come from the server in the chosen language: reload them when it changes.
  useEffect(() => { if (signedIn) refresh(); }, [lang]);
  if (!langReady || !ready || (signedIn && !state && !error)) return <Splash />;
  if (!chosen) return <LanguageScreen />;
  if (!signedIn) return <Welcome skipIntro={left} />;
  if (!state) {
    return (
      <View style={{ flex: 1, backgroundColor: t.ground, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <Mark size={80} colors={[t.azzurro, t.sole, t.fragola]} />
        <Txt v="title" style={{ textAlign: 'center' }}>{tr.loadFail}</Txt>
        <Txt muted style={{ textAlign: 'center' }}>{error}</Txt>
        <Button title={tr.retry} icon="refresh" onPress={refresh} />
      </View>
    );
  }
  return <Main />;
}

function Main() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('quest');
  const x = useSharedValue(0), o = useSharedValue(1);
  const go = (next: Tab) => {
    if (next === tab) return;
    const dir = TABS.findIndex(i => i.id === next) > TABS.findIndex(i => i.id === tab) ? 1 : -1;
    x.value = dir * 24; o.value = 0;
    x.value = withSpring(0, SPRING.snappy); o.value = withTiming(1, { duration: 180 });
    setTab(next);
  };
  const screen = useAnimatedStyle(() => ({ flex: 1, opacity: o.value, transform: [{ translateX: x.value }] }));
  const top = insets.top;
  return (
    <View style={{ flex: 1, backgroundColor: t.ground }}>
      <Animated.View style={screen}>
        {tab === 'quest' ? <QuestScreen topInset={top} /> : tab === 'vota' ? <VoteScreen topInset={top} /> : tab === 'classifica' ? <RankScreen topInset={top} /> : <ProfileScreen topInset={top} />}
      </Animated.View>
      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: t.line, backgroundColor: t.ground, paddingTop: 6, paddingBottom: Math.max(8, insets.bottom), paddingHorizontal: 8 }}>
        {TABS.map(i => <TabButton key={i.id} item={i} active={tab === i.id} badge={i.id === 'vota' ? state?.toVote.length ?? 0 : 0} onPress={() => go(i.id)} />)}
      </View>
    </View>
  );
}

function TabButton({ item, active, badge, onPress }: { item: { id: Tab; icon: string }; active: boolean; badge: number; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const label = tr.tabs[item.id];
  const s = useSharedValue(1);
  useEffect(() => { if (active) s.value = withSequence(withTiming(0.8, { duration: 70 }), withSpring(1, SPRING.bouncy)); }, [active]);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const color = active ? t.azzurroText : t.inkMuted;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 }}>
      <Animated.View style={[{ width: 56, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: active ? t.azzurro : 'transparent', backgroundColor: active ? t.azzurroSoft : 'transparent' }, pop]}>
        <Icon name={item.icon} size={24} color={color} />
      </Animated.View>
      <Txt style={{ fontFamily: font.black, fontSize: 11, lineHeight: 14, color }}>{label}</Txt>
      {badge > 0 ? (
        <View style={{ position: 'absolute', top: 0, left: '55%', minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: t.fragola, borderWidth: 2, borderColor: t.ground, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontFamily: font.black, fontSize: 11, lineHeight: 14, color: t.onColor }}>{String(badge)}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}
