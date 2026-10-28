import { useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { radius, useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { Sheet, useFx } from './overlays';
import { ErrorLine } from './QuestSheet';
import { Button, Txt, tap } from './ui';

// Asks once, then removes you from the group and brings you back to the start.
export function LeaveSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const fx = useFx();
  const { state, leave } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!state) return null;
  const go = async () => {
    setBusy(true); setError('');
    try {
      await leave();
      tap('warning');
      fx.toast(tr.leftToast, 'x');
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.genericError);
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.fragolaSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={34} color={t.fragolaText} />
        </View>
        <Txt v="display" style={{ fontSize: 22, lineHeight: 28, textAlign: 'center' }}>{`${tr.leaveGroup}: ${state.group.name}`}</Txt>
      </View>
      <View style={{ backgroundColor: t.nuvola, borderRadius: radius.md, padding: 14 }}>
        <Txt muted>{tr.leaveWarn}</Txt>
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <Button kind="danger" title={busy ? tr.wait : tr.leaveGroup} disabled={busy} onPress={go} />
      <Button kind="ghost" title={tr.stay} disabled={busy} onPress={onClose} />
    </Sheet>
  );
}
