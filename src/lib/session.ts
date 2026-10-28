import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The member's key ("group.member.secret") is the only login: kept in the phone's keychain,
// or in localStorage on the web.
const KEY = 'side-friends-auth';
let cached: string | null | undefined;

export async function getAuth(): Promise<string | null> {
  if (cached !== undefined) return cached;
  try {
    cached = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
  } catch {
    cached = null;
  }
  return cached;
}
export async function setAuth(value: string | null) {
  cached = value;
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(KEY, value); else globalThis.localStorage?.removeItem(KEY);
    } else if (value) await SecureStore.setItemAsync(KEY, value);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {}
}
