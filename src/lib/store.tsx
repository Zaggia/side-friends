import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api, ApiError, GroupState, Me } from './api';
import { onPushOpen, pushSubscribe, pushSupport, pushUnsubscribe, type PushSupport } from './push';
import { getAuth, getGroup, getPushId, isLegacyKey, setAuth, setGroup, setPushId } from './session';

export type Tab = 'quest' | 'vota' | 'classifica' | 'profilo';
const TABS: Tab[] = ['quest', 'vota', 'classifica', 'profilo'];
// Why notifications couldn't be turned on; the screen says it in the reader's language.
export type PushProblem = Exclude<PushSupport, 'ok'> | 'failed';
export class PushError extends Error { constructor(public reason: PushProblem) { super(reason); } }

type Ctx = {
  ready: boolean;
  me: Me | null;              // the signed-in account and its groups
  groupId: string | null;     // the group on screen
  legacy: string | null;      // an old one-phone key that still needs an account
  state: GroupState | null;
  error: string | null;
  refresh: () => Promise<void>;
  signUp: (username: string, name: string, password: string) => Promise<void>;
  logIn: (username: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  switchGroup: (id: string) => Promise<void>;
  leave: () => Promise<void>;
  boot: () => Promise<void>;
  pushOn: boolean;            // notifications are on for this device
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  syncPush: () => Promise<void>;
  openTab: Tab | null;        // a tab a notification asked to open
  takeTab: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => useContext(StoreCtx)!;

// Signs in, keeps the account's groups, and keeps the group on screen fresh:
// on open, every 20 s while the app is in front, and after each action.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<string | null>(null);
  const [state, setState] = useState<GroupState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [openTab, setOpenTab] = useState<Tab | null>(null);
  const busy = useRef(false);

  const forget = useCallback(async () => {
    await setAuth(null); await setGroup(null); await setPushId(null);
    setMe(null); setGroupId(null); setState(null); setPushOn(false);
  }, []);

  // Picks the group to show: the one remembered on this device if still ours, else the first.
  const choose = useCallback(async (m: Me, prefer?: string | null) => {
    const remembered = prefer ?? (await getGroup());
    const id = m.groups.some(g => g.id === remembered) ? remembered! : m.groups[0]?.id ?? null;
    await setGroup(id);
    setGroupId(id);
    return id;
  }, []);

  const loadMe = useCallback(async (prefer?: string | null) => {
    const m = await api.me();
    setMe(m);
    return choose(m, prefer);
  }, [choose]);

  const refresh = useCallback(async () => {
    if (busy.current || !(await getAuth()) || !(await getGroup())) return;
    busy.current = true;
    try {
      setState(await api.state());
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else if (e instanceof ApiError && e.code === 'not_in_group') { setState(null); await loadMe(null).catch(() => {}); }
      else setError(e instanceof Error ? e.message : 'Error');
    } finally {
      busy.current = false;
    }
  }, [forget, loadMe]);

  // On open: an old one-phone key asks for an account; a session loads the account and its groups.
  const boot = useCallback(async () => {
    setError(null);
    const key = await getAuth();
    setPushOn(!!(await getPushId()));
    if (isLegacyKey(key)) setLegacy(key);
    else if (key) {
      try { await loadMe(); }
      catch (e) { if (e instanceof ApiError && e.status === 401) await forget(); else setError(e instanceof Error ? e.message : 'Error'); }
    }
    setReady(true);
  }, [loadMe, forget]);
  useEffect(() => { boot(); }, []);

  // Notifications. The server keeps one entry per device, in the device's language.
  const registerPush = useCallback(async (ask: boolean) => {
    const device = await pushSubscribe(async () => (await api.pushKey()).publicKey, ask);
    if (!device) return false;
    const { deviceId } = await api.pushOn(device);
    await setPushId(deviceId);
    setPushOn(true);
    return true;
  }, []);
  const enablePush = useCallback(async () => {
    const before = await pushSupport();
    if (before !== 'ok') throw new PushError(before);
    // The browser's push service or our server can fail even with permission given.
    let ok = false;
    try { ok = await registerPush(true); } catch { throw new PushError('failed'); }
    if (ok) return;
    // Asked and not allowed (a dismissed prompt counts as no).
    const after = await pushSupport();
    throw new PushError(after === 'ok' ? 'denied' : after);
  }, [registerPush]);
  const disablePush = useCallback(async () => {
    const id = await getPushId();
    if (id) await api.pushOff(id).catch(() => {});
    await pushUnsubscribe();
    await setPushId(null);
    setPushOn(false);
  }, []);
  // On open and on a language change: refreshes this device's entry, or drops it if permission was taken away.
  const syncPush = useCallback(async () => {
    if (!(await getAuth()) || !(await getPushId())) return;
    try { if (!(await registerPush(false))) { await setPushId(null); setPushOn(false); } } catch {}
  }, [registerPush]);
  useEffect(() => { if (me) syncPush(); }, [me?.account.id]);

  // Opening a notification shows its group and tab.
  useEffect(() => onPushOpen(async o => {
    if (TABS.includes(o.tab as Tab)) setOpenTab(o.tab as Tab);
    if (o.groupId !== (await getGroup())) { await setGroup(o.groupId); setGroupId(o.groupId); }
  }), []);
  const takeTab = useCallback(() => setOpenTab(null), []);

  useEffect(() => { if (groupId) { setState(null); refresh(); } }, [groupId]);

  useEffect(() => {
    if (!me || !groupId) return;
    let timer: ReturnType<typeof setInterval> | null = setInterval(refresh, 20000);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') { refresh(); if (!timer) timer = setInterval(refresh, 20000); }
      else if (timer) { clearInterval(timer); timer = null; }
    });
    return () => { if (timer) clearInterval(timer); sub.remove(); };
  }, [me, groupId]);

  const start = useCallback(async (token: string, prefer?: string | null) => {
    await setAuth(token);
    setLegacy(null);
    await loadMe(prefer);
  }, [loadMe]);

  const signUp = useCallback(async (username: string, name: string, password: string) => {
    // An old one-phone key comes along, so its group stays this person's.
    const res = await api.signup(username, name, password, legacy);
    await start(res.token, res.linkedGroup);
  }, [legacy, start]);
  const logIn = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    await start(res.token);
  }, [start]);
  const logOut = useCallback(async () => {
    await disablePush();
    try { await api.logout(); } catch {}
    await forget();
  }, [forget, disablePush]);

  const createGroup = useCallback(async (name: string) => { const r = await api.createGroup(name); await loadMe(r.groupId); }, [loadMe]);
  const joinGroup = useCallback(async (code: string) => { const r = await api.join(code); await loadMe(r.groupId); }, [loadMe]);
  const switchGroup = useCallback(async (id: string) => { await setGroup(id); setGroupId(id); }, []);
  // Leaving removes this member on the server; the account stays, with its other groups.
  const leave = useCallback(async () => {
    await api.leave();
    await setGroup(null);
    setState(null);
    await loadMe(null);
  }, [loadMe]);

  return (
    <StoreCtx.Provider value={{ ready, me, groupId, legacy, state, error, refresh, signUp, logIn, logOut, createGroup, joinGroup, switchGroup, leave, boot, pushOn, enablePush, disablePush, syncPush, openTab, takeTab }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useMember(id?: string | null) {
  const { state } = useStore();
  return state?.members.find(m => m.id === id) ?? null;
}
