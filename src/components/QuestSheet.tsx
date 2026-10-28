import { useEffect, useState } from 'react';
import { Modal, Platform, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { api, Quest } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { font, radius, useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { ProofMedia } from './Media';
import { Confetti, Sheet, useFx } from './overlays';
import { AvatarStack, Button, QuestIcon, SPRING, Txt, tap } from './ui';

const MAX_SECONDS = 60;
const MAX_BYTES = 60 * 1024 * 1024;
type Picked = { uri: string; type: 'image' | 'video'; mime: string; seconds: number | null };

export function QuestSheet({ quest, onClose }: { quest: Quest | null; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { state, refresh } = useStore();
  const fx = useFx();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ quest: Quest; media: Picked } | null>(null);
  const q = quest;

  useEffect(() => { setPicked(null); setNote(''); setError(''); setProgress(null); }, [quest?.id]);

  const accept = async () => {
    if (!q) return;
    setBusy(true);
    try { await api.accept(q.id); await refresh(); tap('success'); fx.toast(tr.acceptedToast, 'bolt'); }
    catch (e) { setError(e instanceof Error ? e.message : tr.genericError); }
    finally { setBusy(false); }
  };

  const pick = async (camera: boolean) => {
    if (!q) return;
    setError('');
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') { setError(camera ? tr.permCamera : tr.permLibrary); return; }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: q.video ? ['videos'] : ['images', 'videos'],
      quality: 0.7,
      videoMaxDuration: MAX_SECONDS,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_960x540
    };
    const res = camera && Platform.OS !== 'web' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const type = a.type === 'video' ? 'video' : 'image';
    if (q.video && type !== 'video') { setError(tr.videoRequired); return; }
    const seconds = a.duration ? a.duration / 1000 : null;
    if (seconds && seconds > MAX_SECONDS + 0.5) { setError(tr.videoTooLong(Math.round(seconds), MAX_SECONDS)); return; }
    if (a.fileSize && a.fileSize > MAX_BYTES) { setError(tr.fileTooBig); return; }
    setPicked({ uri: a.uri, type, mime: a.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'), seconds });
  };

  const send = async () => {
    if (!q || !picked) return;
    setBusy(true); setError(''); setProgress(0);
    try {
      await api.uploadProof({ questId: q.id, uri: picked.uri, type: picked.type, mime: picked.mime, note, onProgress: setProgress });
      setSent({ quest: q, media: picked });
      onClose();
      tap('success');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.uploadFailed);
      tap('warning');
    } finally { setBusy(false); setProgress(null); }
  };

  const others = (q?.doneBy || []).map(id => state?.members.find(m => m.id === id)).filter(Boolean) as { name: string; color: string }[];
  const by = q?.by ? state?.members.find(m => m.id === q.by) : null;

  return (
    <>
      <Sheet open={!!q} onClose={onClose}>
        {q ? (picked ? (
          <>
            <Txt v="display" style={{ fontSize: 22, lineHeight: 28 }}>{tr.checkProof}</Txt>
            <View>
              <ProofMedia uri={picked.uri} type={picked.type} style={{ width: '100%', aspectRatio: 4 / 5, maxHeight: 420, borderRadius: radius.md }} />
              <View style={{ position: 'absolute', left: 10, top: 10, flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: t.ground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full }}>
                <Icon name={picked.type === 'video' ? 'video' : 'image'} size={14} color={t.ink} />
                <Txt v="caption" style={{ fontFamily: font.black }}>{picked.type === 'video' ? `${tr.video}${picked.seconds && picked.seconds >= 1 ? ' · ' + Math.round(picked.seconds) + ' s' : ''}` : tr.photo}</Txt>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Txt v="heading" style={{ fontSize: 15 }}>{tr.addComment}</Txt>
              <TextInput value={note} onChangeText={setNote} maxLength={140} multiline placeholder={tr.optional} placeholderTextColor={t.inkMuted}
                style={{ fontFamily: font.body, fontSize: 16, color: t.ink, backgroundColor: t.nuvola, borderWidth: 2, borderColor: t.line, borderRadius: radius.md, padding: 12, minHeight: 60 }} />
            </View>
            {progress !== null ? <Progress value={progress} /> : null}
            {error ? <ErrorLine text={error} /> : null}
            <Button title={busy ? tr.sending(Math.round((progress ?? 0) * 100)) : tr.sendToGroup} disabled={busy} onPress={send} />
            <Button title={tr.pickAnother} kind="ghost" disabled={busy} onPress={() => setPicked(null)} />
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <QuestIcon icon={q.icon} color={q.kind === 'idea' ? 'lilla' : q.kind === 'group' ? 'menta' : q.kind === 'special' ? 'sole' : 'azzurro'} size={88} />
              {q.kind === 'idea' ? <Txt v="label" muted>{tr.ideaLabel}</Txt> : q.kind === 'group' ? <Txt v="label" muted>{tr.proposedBy(by?.name ?? tr.someoneInGroup)}</Txt> : q.kind === 'special' ? <Txt v="label" muted>{tr.specialBy(by?.name ?? tr.someoneInGroup)}</Txt> : null}
              <Txt v="display" style={{ fontSize: 22, lineHeight: 28, textAlign: 'center' }}>{q.title}</Txt>
              <Txt muted style={{ textAlign: 'center', maxWidth: 340 }}>{q.desc || (q.kind === 'special' ? tr.specialFrom(by?.name ?? tr.someoneInGroup) : tr.groupQuestDesc)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Fact big={`+${q.pts}`} small={tr.points} color={t.soleText} />
              <Fact big={q.kind === 'group' || q.kind === 'special' ? tr.endOfMonth : tr.sunday} small={tr.deadline} />
              <Fact big={q.video ? tr.video : tr.photoOrVideo} small={tr.proofLabel} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {others.length ? <AvatarStack people={others} size={26} /> : null}
              <Txt v="caption" muted>{others.length ? tr.alreadyDoneBy(others.map(o => o.name).join(', ')) : tr.nobodyYet}</Txt>
            </View>
            {q.rejected && q.state !== 'pending' ? <ErrorLine text={tr.rejectedNote} /> : null}
            {error ? <ErrorLine text={error} /> : null}
            {q.state === 'new' ? <Button title={busy ? tr.wait : tr.accept} disabled={busy} onPress={accept} />
              : q.state === 'active' ? (
                <>
                  <Button title={q.video ? tr.recordVideo : tr.shootOrRecord} icon="camera" onPress={() => pick(true)} />
                  <Button title={tr.fromGallery} kind="ghost" icon="image" onPress={() => pick(false)} />
                  <Txt v="caption" muted style={{ textAlign: 'center' }}>{tr.videoUpTo(MAX_SECONDS)}</Txt>
                </>
              ) : q.state === 'pending' ? <Button title={tr.groupVoting} disabled />
              : <Button title={tr.questDone} icon="check" disabled />}
          </>
        )) : null}
      </Sheet>
      <Celebrate sent={sent} onClose={() => setSent(null)} />
    </>
  );
}

function Fact({ big, small, color }: { big: string; small: string; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.nuvola, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 2 }}>
      <Txt numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: font.displayBold, fontSize: 15, color: color ?? t.ink }}>{big}</Txt>
      <Txt v="caption" muted style={{ fontSize: 12 }}>{small}</Txt>
    </View>
  );
}
export function ErrorLine({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: t.fragolaSoft, padding: 12, borderRadius: radius.md }}>
      <Icon name="x" size={18} color={t.fragolaText} /><Txt style={{ flex: 1, color: t.fragolaText }}>{text}</Txt>
    </View>
  );
}
function Progress({ value }: { value: number }) {
  const t = useTheme();
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(value, { duration: 300 }); }, [value]);
  const style = useAnimatedStyle(() => ({ width: `${Math.max(4, w.value * 100)}%` }));
  return (
    <View style={{ height: 16, borderRadius: 8, backgroundColor: t.nuvola, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 8, backgroundColor: t.azzurro }, style]} />
    </View>
  );
}

function Celebrate({ sent, onClose }: { sent: { quest: Quest; media: Picked } | null; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const s = useSharedValue(0), up = useSharedValue(0);
  useEffect(() => {
    if (!sent) return;
    s.value = 0; up.value = 0;
    s.value = withDelay(120, withSpring(1, SPRING.bouncy));
    up.value = withDelay(300, withSpring(1, SPRING.soft));
  }, [sent]);
  const check = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * -45}deg` }] }));
  const rise = useAnimatedStyle(() => ({ opacity: up.value, transform: [{ translateY: (1 - up.value) * 24 }] }));
  if (!sent) return null;
  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.ground, justifyContent: 'center', padding: 24, gap: 24 }}>
        <Animated.View style={[{ alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: t.azzurroShade, paddingBottom: 8 }, check]}>
          <View style={{ flex: 1, borderRadius: 60, backgroundColor: t.azzurro, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={60} color={t.onColor} /></View>
        </Animated.View>
        <Animated.View style={[{ gap: 10, alignItems: 'center' }, rise]}>
          <Txt v="display" style={{ textAlign: 'center' }}>{tr.proofSent}</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>{tr.proofSentSub(sent.quest.pts)}</Txt>
          <ProofMedia uri={sent.media.uri} type={sent.media.type} controls={false} style={{ width: 140, height: 175, borderRadius: radius.md, transform: [{ rotate: '-4deg' }], borderWidth: 3, borderColor: t.ground }} />
        </Animated.View>
        <Button title={tr.continue} onPress={onClose} />
      </View>
      <Confetti />
    </Modal>
  );
}
