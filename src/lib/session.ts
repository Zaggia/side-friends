import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// What this device remembers: the account's session token ("s.…"), the group on screen,
// and, when notifications are on, this device's id on the server.
// Phones from before accounts may still hold an old "group.member.secret" key.
const AUTH = 'side-friends-auth';
const GROUP = 'side-friends-group';
const PUSH = 'side-friends-push';
const NUDGE = 'side-friends-push-nudge';
const cache: Record<string, string | null | undefined> = {};

async function read(key: string): Promise<string | null> {
  if (cache[key] !== undefined) return cache[key]!;
  try {
    cache[key] = Platform.OS === 'web' ? globalThis.localStorage?.getItem(key) ?? null : await SecureStore.getItemAsync(key);
  } catch {
    cache[key] = null;
  }
  return cache[key]!;
}
async function write(key: string, value: string | null) {
  cache[key] = value;
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(key, value); else globalThis.localStorage?.removeItem(key);
    } else if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {}
}

export const getAuth = () => read(AUTH);
export const setAuth = (v: string | null) => write(AUTH, v);
export const getGroup = () => read(GROUP);
export const setGroup = (v: string | null) => write(GROUP, v);
export const getPushId = () => read(PUSH);
export const setPushId = (v: string | null) => write(PUSH, v);
// Whether the "turn on notifications" card was put away.
export const getNudged = async () => (await read(NUDGE)) === '1';
export const setNudged = () => write(NUDGE, '1');
export const isLegacyKey = (k: string | null) => !!k && !k.startsWith('s.') && k.split('.').length === 3;
