import { useEffect, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, type ScrollViewInstance, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon, Mark } from '../components/Icon';
import { Button, QuestIcon, SPRING, Txt, tap } from '../components/ui';

function Pop({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const s = useSharedValue(0);
  useEffect(() => { s.value = withDelay(delay, withSpring(1, SPRING.bouncy)); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function Field({ label, hint, secure, ...props }: React.ComponentProps<typeof TextInput> & { label: string; hint?: string; secure?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [shown, setShown] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt v="heading" style={{ fontSize: 15 }}>{label}</Txt>
      <View>
        <TextInput placeholderTextColor={t.inkMuted} secureTextEntry={secure && !shown} {...props}
          style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, paddingRight: secure ? 96 : 16 }} />
        {secure ? (
          <Pressable onPress={() => setShown(s => !s)} accessibilityRole="button" style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10 }}>
            <Txt style={{ fontFamily: font.black, fontSize: 14, color: t.azzurroText }}>{shown ? tr.hide : tr.show}</Txt>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Txt v="caption" muted>{hint}</Txt> : null}
    </View>
  );
}

export function ErrorBox({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: t.fragolaSoft, padding: 12, borderRadius: radius.md }}>
      <Icon name="x" size={18} color={t.fragolaText} /><Txt style={{ flex: 1, color: t.fragolaText }}>{text}</Txt>
    </View>
  );
}

// Intro, then an account: sign up or sign in. A phone with an old one-phone key goes straight to sign-up.
export function Welcome() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const insets = useSafeAreaInsets();
  const { signUp, logIn, legacy } = useStore();
  const [step, setStep] = useState<'intro' | 'choose' | 'signup' | 'login'>(legacy ? 'signup' : 'intro');
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  const W = Math.min(Dimensions.get('window').width, 520);
  const slides = tr.slides;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== page) { setPage(i); tap(); }
  };
  const next = () => {
    if (page < slides.length - 1) { scroller.current?.scrollTo({ x: (page + 1) * W, animated: true }); setPage(page + 1); }
    else setStep('choose');
  };
  const go = (s: typeof step) => { setError(''); setStep(s); };
  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (step === 'signup') await signUp(username, name, password);
      else await logIn(username, password);
      tap('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.genericError);
      tap('warning');
      setBusy(false);
    }
  };
  const cleanUser = (s: string) => s.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);

  if (step === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: t.ground, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16, alignItems: 'center' }}>
        <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} onScroll={Platform.OS === 'web' ? onScroll : undefined} scrollEventThrottle={64} style={{ width: W, flex: 1 }}>
          {slides.map(([h, p], i) => (
            <View key={i} style={{ width: W, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              {i === page || i === 0 ? (
                <Pop key={page === i ? 'on' : 'off'} delay={80}>
                  {i === 0 ? <Mark size={150} colors={[t.azzurro, t.sole, t.fragola]} />
                    : i === 1 ? <QuestIcon icon="camera" color="azzurro" size={120} />
                    : <QuestIcon icon="crown" color="sole" size={120} />}
                </Pop>
              ) : <View style={{ height: 150 }} />}
              <Txt v="display" style={{ textAlign: 'center', fontSize: 28 }}>{h}</Txt>
              <Txt muted style={{ textAlign: 'center', fontSize: 17, lineHeight: 24, maxWidth: 320 }}>{p}</Txt>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 16 }}>
          {slides.map((_, i) => <View key={i} style={{ width: i === page ? 28 : 10, height: 10, borderRadius: 5, backgroundColor: i === page ? t.azzurro : t.line }} />)}
        </View>
        <View style={{ width: W, paddingHorizontal: 16 }}>
          <Button title={page === slides.length - 1 ? tr.start : tr.next} onPress={next} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.ground }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 18, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center' }}><Mark size={72} colors={[t.azzurro, t.sole, t.fragola]} /></View>
        {step === 'choose' ? (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>{tr.accountTitle}</Txt>
            <Txt muted style={{ textAlign: 'center' }}>{tr.accountSub}</Txt>
            <Button title={tr.createAccount} icon="plus" onPress={() => go('signup')} />
            <Button title={tr.haveAccount} kind="ghost" onPress={() => go('login')} />
          </>
        ) : step === 'signup' ? (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>{legacy ? tr.legacyTitle : tr.signupTitle}</Txt>
            {legacy ? <Txt muted style={{ textAlign: 'center' }}>{tr.legacySub}</Txt> : null}
            <Field label={tr.nameLabel} hint={tr.nameHint} value={name} onChangeText={setName} placeholder={tr.namePh} maxLength={24} autoCapitalize="words" autoComplete="name" textContentType="givenName" />
            <Field label={tr.usernameLabel} hint={tr.usernameHint} value={username} onChangeText={s => setUsername(cleanUser(s))} placeholder={tr.usernamePh} autoCapitalize="none" autoCorrect={false} autoComplete="username-new" textContentType="username" />
            <Field label={tr.passwordLabel} hint={tr.passwordHint} value={password} onChangeText={setPassword} secure autoCapitalize="none" autoCorrect={false} autoComplete="password-new" textContentType="newPassword" onSubmitEditing={submit} />
            {error ? <ErrorBox text={error} /> : null}
            <Button title={busy ? tr.signingUp : tr.signupBtn} disabled={busy || !name.trim() || username.length < 3 || password.length < 8} onPress={submit} />
            <Button title={tr.toLogin} kind="ghost" disabled={busy} onPress={() => go('login')} />
          </>
        ) : (
          <>
            <Txt v="display" style={{ textAlign: 'center' }}>{tr.loginTitle}</Txt>
            <Txt muted style={{ textAlign: 'center' }}>{tr.loginSub}</Txt>
            <Field label={tr.usernameLabel} value={username} onChangeText={s => setUsername(cleanUser(s))} placeholder={tr.usernamePh} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" />
            <Field label={tr.passwordLabel} value={password} onChangeText={setPassword} secure autoCapitalize="none" autoCorrect={false} autoComplete="password" textContentType="password" onSubmitEditing={submit} />
            {error ? <ErrorBox text={error} /> : null}
            <Button title={busy ? tr.loggingIn : tr.loginBtn} disabled={busy || !username || !password} onPress={submit} />
            <Button title={tr.toSignup} kind="ghost" disabled={busy} onPress={() => go('signup')} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Create a group or join one with a code. Used after signing up and from the group switcher.
export function GroupSetup({ onDone, compact }: { onDone?: (name: string, created: boolean) => void; compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { createGroup, joinGroup, me } = useStore();
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (mode === 'create') { await createGroup(groupName); onDone?.(groupName.trim(), true); }
      else { await joinGroup(code); onDone?.(code, false); }
      tap('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.genericError);
      tap('warning');
    } finally { setBusy(false); }
  };
  return (
    <View style={{ gap: 18 }}>
      {!compact ? <View style={{ alignItems: 'center' }}><Mark size={72} colors={[t.azzurro, t.sole, t.fragola]} /></View> : null}
      {mode === 'pick' ? (
        <>
          <Txt v="display" style={{ textAlign: compact ? 'left' : 'center', fontSize: compact ? 22 : 30, lineHeight: compact ? 28 : 34 }}>{compact ? tr.addGroup : tr.groupSetupTitle}</Txt>
          <Txt muted style={{ textAlign: compact ? 'left' : 'center' }}>{me && !compact ? `@${me.account.username} · ` : ''}{tr.groupSetupSub}</Txt>
          <Button title={tr.createGroup} icon="plus" onPress={() => setMode('create')} />
          <Button title={tr.joinWithCode} kind="ghost" onPress={() => setMode('join')} />
        </>
      ) : mode === 'create' ? (
        <>
          <Txt v="display" style={{ textAlign: compact ? 'left' : 'center', fontSize: compact ? 22 : 30, lineHeight: compact ? 28 : 34 }}>{tr.newGroup}</Txt>
          <Txt muted style={{ textAlign: compact ? 'left' : 'center' }}>{tr.newGroupSub}</Txt>
          <Field label={tr.newGroup} value={groupName} onChangeText={setGroupName} placeholder={tr.groupPh} maxLength={32} onSubmitEditing={submit} />
          {error ? <ErrorBox text={error} /> : null}
          <Button title={busy ? tr.creating : tr.createIt} disabled={busy || !groupName.trim()} onPress={submit} />
          <Button title={tr.back} kind="ghost" onPress={() => { setError(''); setMode('pick'); }} />
        </>
      ) : (
        <>
          <Txt v="display" style={{ textAlign: compact ? 'left' : 'center', fontSize: compact ? 22 : 30, lineHeight: compact ? 28 : 34 }}>{tr.joinTitle}</Txt>
          <Txt muted style={{ textAlign: compact ? 'left' : 'center' }}>{tr.joinSub}</Txt>
          <Field label={tr.inviteCode} value={code} onChangeText={s => setCode(s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="ABC123" autoCapitalize="characters" autoCorrect={false} onSubmitEditing={submit} />
          {error ? <ErrorBox text={error} /> : null}
          <Button title={busy ? tr.joining : tr.join} disabled={busy || code.length !== 6} onPress={submit} />
          <Button title={tr.back} kind="ghost" onPress={() => { setError(''); setMode('pick'); }} />
        </>
      )}
    </View>
  );
}

// Full screen for an account with no group yet.
export function GroupSetupScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useI18n();
  const { logOut } = useStore();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.ground }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 18, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <GroupSetup />
        <Pressable onPress={() => { tap(); logOut(); }} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10 }}>
          <Txt style={{ fontFamily: font.bold, color: t.inkMuted }}>{tr.logOut}</Txt>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
