import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lang, LANGS, useI18n } from '../lib/i18n';
import { font, radius, useTheme } from '../lib/theme';
import { Icon, Mark } from './Icon';
import { Sheet } from './overlays';
import { Button, Txt, tap } from './ui';

// One row per language, named in its own language.
function LanguageList({ value, onPick }: { value: Lang; onPick: (l: Lang) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }} accessibilityRole="radiogroup">
      {LANGS.map((l, i) => {
        const on = l.code === value;
        return (
          <Animated.View key={l.code} entering={FadeInDown.delay(60 + i * 50).springify().damping(18)}>
            <Pressable onPress={() => { tap(); onPick(l.code); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={l.name}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: on ? t.azzurro : t.line, backgroundColor: on ? t.azzurroSoft : t.ground }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: on ? t.azzurro : t.nuvola, alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontFamily: font.display, fontSize: 13, color: on ? t.onColor : t.inkMuted }}>{l.code.toUpperCase()}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="heading" color={on ? t.azzurroText : t.ink}>{l.name}</Txt>
                {l.name !== l.english ? <Txt v="caption" muted>{l.english}</Txt> : null}
              </View>
              {on ? <Icon name="check" size={22} color={t.azzurroText} /> : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

// The first screen of the app: pick a language, then the intro starts in it.
export function LanguageScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { lang, setLang } = useI18n();
  const [pick, setPick] = useState<Lang>(lang);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.ground }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 20, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <Mark size={84} colors={[t.azzurro, t.sole, t.fragola]} />
        <Txt v="display" style={{ textAlign: 'center' }}>{LANG_TITLE[pick]}</Txt>
        <Txt muted style={{ textAlign: 'center' }}>{LANG_SUB[pick]}</Txt>
      </View>
      <LanguageList value={pick} onPick={setPick} />
      <Button title={CONTINUE[pick]} onPress={() => setLang(pick)} />
    </ScrollView>
  );
}

// From the profile: change language at any time.
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, setLang, t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose}>
      <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{t.language}</Txt>
      <LanguageList value={lang} onPick={async l => { await setLang(l); onClose(); }} />
    </Sheet>
  );
}

// Shown before a language is chosen, so each line follows the highlighted choice.
const LANG_TITLE: Record<Lang, string> = { it: 'Scegli la lingua', en: 'Choose your language', es: 'Elige el idioma', fr: 'Choisis ta langue', de: 'Wähl deine Sprache' };
const LANG_SUB: Record<Lang, string> = {
  it: 'Puoi cambiarla quando vuoi dal profilo.', en: 'You can change it anytime from your profile.', es: 'Puedes cambiarlo cuando quieras desde tu perfil.',
  fr: 'Tu peux la changer quand tu veux depuis ton profil.', de: 'Du kannst sie jederzeit in deinem Profil ändern.'
};
const CONTINUE: Record<Lang, string> = { it: 'Continua', en: 'Continue', es: 'Continuar', fr: 'Continuer', de: 'Weiter' };
