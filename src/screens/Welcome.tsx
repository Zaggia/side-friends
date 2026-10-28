import { useEffect, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, type ScrollViewInstance, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon, Mark } from '../components/Icon';
import { Button, QuestIcon, SPRING, Txt, tap } from '../components/ui';

const SLIDES = [
  { h: 'Benvenuto in Side Friends', p: 'Le side quest del tuo gruppo di amici. Ogni amico ha il suo colore.' },
  { h: 'Completa le quest', p: 'Ogni settimana escono 5 quest. Falle davvero e carica una foto o un video come prova.' },
  { h: 'Vinci il mese', p: 'Il gruppo vota le prove e tu sali in classifica. Chi vince il mese sceglie una cosa della prossima uscita.' }
];

function Pop({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const s = useSharedValue(0);
  useEffect(() => { s.value = withDelay(delay, withSpring(1, SPRING.bouncy)); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function Welcome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useStore();
  const [step, setStep] = useState<'intro' | 'name' | 'create' | 'join'>('intro');
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  const W = Math.min(Dimensions.get('window').width, 520);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== page) { setPage(i); tap(); }
  };
  const next = () => {
    if (page < SLIDES.length - 1) { scroller.current?.scrollTo({ x: (page + 1) * W, animated: true }); setPage(page + 1); }
    else setStep('name');
  };
  const submit = async () => {
    setError(''); setBusy(true);
    try {
      const res = step === 'create' ? await api.createGroup(name, groupName) : await api.join(name, code);
      tap('success');
      await signIn(res.auth);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qualcosa è andato storto.');
      tap('warning');
    } finally { setBusy(false); }
  };

  const input = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput placeholderTextColor={t.inkMuted} {...props}
      style={{ fontFamily: font.semibold, fontSize: 18, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14 }} />
  );

  if (step === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: t.ground, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16, alignItems: 'center' }}>
        <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} onScroll={Platform.OS === 'web' ? onScroll : undefined} scrollEventThrottle={64} style={{ width: W, flex: 1 }}>
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: W, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              {i === page || i === 0 ? (
                <Pop key={page === i ? 'on' : 'off'} delay={80}>
                  {i === 0 ? <Mark size={150} colors={[t.azzurro, t.sole, t.fragola]} />
                    : i === 1 ? <QuestIcon icon="camera" color="azzurro" size={120} />
                    : <QuestIcon icon="crown" color="sole" size={120} />}
                </Pop>
              ) : <View style={{ height: 150 }} />}
              <Txt v="display" style={{ textAlign: 'center', fontSize: 28 }}>{s.h}</Txt>
              <Txt muted style={{ textAlign: 'center', fontSize: 17, lineHeight: 24, maxWidth: 320 }}>{s.p}</Txt>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 16 }}>
          {SLIDES.map((_, i) => <View key={i} style={{ width: i === page ? 28 : 10, height: 10, borderRadius: 5, backgroundColor: i === page ? t.azzurro : t.line }} />)}
        </View>
        <View style={{ width: W, paddingHorizontal: 16 }}>
          <Button title={page === SLIDES.length - 1 ? 'Iniziamo' : 'Avanti'} onPress={next} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.ground }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 20, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center' }}><Mark size={72} colors={[t.azzurro, t.sole, t.fragola]} /></View>
        {step === 'name' ? (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>Come ti chiami?</Txt>
            <Txt muted style={{ textAlign: 'center' }}>È il nome che vedranno i tuoi amici.</Txt>
            {input({ value: name, onChangeText: setName, placeholder: 'Il tuo nome', autoFocus: true, maxLength: 24, autoCapitalize: 'words', returnKeyType: 'next' })}
            <Button title="Crea un gruppo" icon="plus" disabled={!name.trim()} onPress={() => { setError(''); setStep('create'); }} />
            <Button title="Entra con un codice" kind="ghost" disabled={!name.trim()} onPress={() => { setError(''); setStep('join'); }} />
          </>
        ) : step === 'create' ? (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>Nuovo gruppo</Txt>
            <Txt muted style={{ textAlign: 'center' }}>Dopo ti do un codice da mandare agli amici.</Txt>
            {input({ value: groupName, onChangeText: setGroupName, placeholder: 'Es. I Soliti', autoFocus: true, maxLength: 32, onSubmitEditing: submit })}
            <Button title={busy ? 'Creo il gruppo…' : 'Crea il gruppo'} disabled={busy || !groupName.trim()} onPress={submit} />
            <Button title="Indietro" kind="ghost" onPress={() => setStep('name')} />
          </>
        ) : (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>Entra nel gruppo</Txt>
            <Txt muted style={{ textAlign: 'center' }}>Chiedi il codice di 6 caratteri a chi ha creato il gruppo.</Txt>
            {input({ value: code, onChangeText: s => setCode(s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)), placeholder: 'ABC123', autoFocus: true, autoCapitalize: 'characters', autoCorrect: false, onSubmitEditing: submit })}
            <Button title={busy ? 'Entro…' : 'Entra'} disabled={busy || code.length !== 6} onPress={submit} />
            <Button title="Indietro" kind="ghost" onPress={() => setStep('name')} />
          </>
        )}
        {error ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: t.fragolaSoft, padding: 12, borderRadius: radius.md }}>
            <Icon name="x" size={18} color={t.fragolaText} /><Txt style={{ flex: 1, color: t.fragolaText }}>{error}</Txt>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
