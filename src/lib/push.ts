import type { PushDevice } from './api';

// Notifications in the browser (Web Push). The phone version is push.native.ts.
// The service worker, public/sw.js, shows them and opens the app on the right group and tab.
export type PushSupport = 'ok' | 'unsupported' | 'ios-home' | 'denied';
export type PushOpen = { groupId: string; tab: string };

const nav = () => (typeof navigator === 'undefined' ? null : navigator);
const isIOS = () => /iPhone|iPad|iPod/.test(nav()?.userAgent ?? '');
const standalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (nav() as { standalone?: boolean } | null)?.standalone === true);

export async function pushSupport(): Promise<PushSupport> {
  const n = nav();
  if (!n || !('serviceWorker' in n) || typeof window === 'undefined' || !('PushManager' in window) || typeof Notification === 'undefined') {
    // Safari on iPhone has push only for apps added to the Home Screen.
    return isIOS() && !standalone() ? 'ios-home' : 'unsupported';
  }
  return Notification.permission === 'denied' ? 'denied' : 'ok';
}

const keyBytes = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};

// Asks for permission when `ask` is true; otherwise only picks up a permission given before.
export async function pushSubscribe(publicKey: () => Promise<string>, ask: boolean): Promise<PushDevice | null> {
  if ((await pushSupport()) !== 'ok') return null;
  if (Notification.permission !== 'granted' && (!ask || (await Notification.requestPermission()) !== 'granted')) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const key = keyBytes(await publicKey());
  let sub = await reg.pushManager.getSubscription();
  // A subscription made with another server key can't be reused.
  const same = sub?.options.applicationServerKey && new Uint8Array(sub.options.applicationServerKey).every((b, i) => b === key[i]);
  if (sub && !same) { await sub.unsubscribe(); sub = null; }
  // The browser's push service can hang when it's unreachable: give up after 20 seconds.
  sub ??= await Promise.race([
    reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }),
    new Promise<never>((_, no) => setTimeout(() => no(new Error('push subscribe timeout')), 20000))
  ]);
  return { kind: 'web', sub: sub.toJSON() };
}

export async function pushUnsubscribe() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration('/sw.js');
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
  } catch {}
}

// Calls back when the app is opened from a notification: at launch (from the address) or while open.
export function onPushOpen(cb: (o: PushOpen) => void) {
  if (typeof window === 'undefined') return () => {};
  const q = new URLSearchParams(window.location.search);
  const g = q.get('g'), tab = q.get('tab');
  if (g && tab) {
    window.history.replaceState(null, '', window.location.pathname);
    setTimeout(() => cb({ groupId: g, tab }), 0);
  }
  const onMsg = (e: MessageEvent) => { if (e.data?.type === 'open' && e.data.groupId) cb({ groupId: e.data.groupId, tab: e.data.tab }); };
  navigator.serviceWorker?.addEventListener('message', onMsg);
  return () => navigator.serviceWorker?.removeEventListener('message', onMsg);
}
