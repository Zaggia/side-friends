import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api, ApiError, GroupState } from './api';
import { getAuth, setAuth } from './session';

type Ctx = {
  ready: boolean;
  signedIn: boolean;
  state: GroupState | null;
  error: string | null;
  refresh: () => Promise<void>;
  signIn: (auth: string) => Promise<void>;
  signOut: () => Promise<void>;
  leave: () => Promise<void>;
  left: boolean;
};
const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => useContext(StoreCtx)!;

// Keeps the group's state fresh: on open, every 20 s while the app is in front, and after each action.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<GroupState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current || !(await getAuth())) return;
    busy.current = true;
    try {
      setState(await api.state());
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { await setAuth(null); setSignedIn(false); setState(null); }
      else setError(e instanceof Error ? e.message : 'Errore di rete.');
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const a = await getAuth();
      setSignedIn(!!a);
      if (a) await refresh();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let timer: ReturnType<typeof setInterval> | null = setInterval(refresh, 20000);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') { refresh(); if (!timer) timer = setInterval(refresh, 20000); }
      else if (timer) { clearInterval(timer); timer = null; }
    });
    return () => { if (timer) clearInterval(timer); sub.remove(); };
  }, [signedIn]);

  const signIn = useCallback(async (auth: string) => {
    await setAuth(auth);
    setSignedIn(true);
    await refresh();
  }, [refresh]);
  const signOut = useCallback(async () => {
    await setAuth(null);
    setSignedIn(false);
    setState(null);
  }, []);

  // Leaving removes this member on the server, then forgets the key on this phone.
  const leave = useCallback(async () => {
    await api.leave();
    await setAuth(null);
    setLeft(true);
    setSignedIn(false);
    setState(null);
  }, []);

  return <StoreCtx.Provider value={{ ready, signedIn, state, error, refresh, signIn, signOut, leave, left }}>{children}</StoreCtx.Provider>;
}

export function useMember(id?: string | null) {
  const { state } = useStore();
  return state?.members.find(m => m.id === id) ?? null;
}
