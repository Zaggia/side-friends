import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import type { PushDevice } from './api';
import type { PushOpen, PushSupport } from './push';

// Notifications on phones, through Expo's push service. They need the installed app
// (a build with an EAS project id); Expo Go can't receive them on Android.
export type { PushOpen, PushSupport } from './push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false })
});

const projectId = (): string | undefined => Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export async function pushSupport(): Promise<PushSupport> {
  if (!projectId() || (Platform.OS === 'android' && isRunningInExpoGo())) return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  return p.granted || p.canAskAgain ? 'ok' : 'denied';
}

export async function pushSubscribe(_publicKey: () => Promise<string>, ask: boolean): Promise<PushDevice | null> {
  if ((await pushSupport()) !== 'ok') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Side Friends', importance: Notifications.AndroidImportance.HIGH });
  }
  let p = await Notifications.getPermissionsAsync();
  if (!p.granted && ask) p = await Notifications.requestPermissionsAsync();
  if (!p.granted) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: projectId() })).data;
  return { kind: 'expo', token };
}

export async function pushUnsubscribe() {}

export function onPushOpen(cb: (o: PushOpen) => void) {
  const handle = (r: Notifications.NotificationResponse | null) => {
    const d = r?.notification.request.content.data as Partial<PushOpen> | undefined;
    if (d?.groupId && d.tab) cb({ groupId: d.groupId, tab: d.tab });
  };
  Notifications.getLastNotificationResponseAsync().then(r => { handle(r); Notifications.clearLastNotificationResponseAsync(); }).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
