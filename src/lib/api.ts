import { Platform } from 'react-native';
import { getAuth, getGroup } from './session';
import { currentLang } from './i18n';

// On the web the app is served by the same Netlify site as the API.
// On phones it calls the deployed site; set EXPO_PUBLIC_API_URL to point elsewhere.
export const API_BASE = Platform.OS === 'web' ? '' : (process.env.EXPO_PUBLIC_API_URL || 'https://side-friends.netlify.app');
export const mediaUrl = (path: string) => API_BASE + path;

const NET_ERROR = {
  it: 'Non riesco a raggiungere il server. Controlla la connessione e riprova.',
  en: 'Can’t reach the server. Check your connection and try again.',
  es: 'No consigo conectar con el servidor. Revisa la conexión e inténtalo de nuevo.',
  fr: 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.',
  de: 'Der Server ist nicht erreichbar. Prüf deine Verbindung und versuch es noch mal.'
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

async function call<T>(method: string, path: string, body?: unknown, raw?: Blob, extra: Record<string, string> = {}): Promise<T> {
  const [auth, group] = await Promise.all([getAuth(), getGroup()]);
  const headers: Record<string, string> = { 'x-lang': currentLang(), ...extra };
  if (auth && !('authorization' in extra)) headers.authorization = `Bearer ${auth}`;
  if (headers.authorization === '') delete headers.authorization;
  if (group) headers['x-group'] = group;
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (raw) headers['content-type'] = 'application/octet-stream';
  let res: Response;
  try {
    res = await fetch(API_BASE + '/api/' + path, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, NET_ERROR[currentLang()]);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || NET_ERROR[currentLang()], data.code);
  return data as T;
}

export type Member = { id: string; name: string; color: string; pts: number; quests: number; wins: string[]; joinedAt: string };
export type Quest = {
  id: string; kind: 'list' | 'idea' | 'group' | 'special'; title: string; desc: string; pts: number; icon: string; video: boolean;
  state: 'new' | 'active' | 'pending' | 'done'; rejected: boolean; doneBy: string[]; by?: string;
};
export type ToVote = { id: string; memberId: string; questTitle: string; pts: number; icon: string; type: 'image' | 'video'; note: string; createdAt: string; media: string };
export type FeedItem = {
  who: string; kind: 'proof' | 'done' | 'proposal' | 'join' | 'theme' | 'special' | 'veto' | 'outing';
  quest?: string; pts?: number; media?: 'image' | 'video'; to?: string; text?: string; k?: string; status?: 'approved' | 'rejected'; at: string;
};
export type Outing = { memberId: string; k: string; v: string; at: string };
export type Status = 'pending' | 'approved' | 'rejected';
export type King = {
  memberId: string; month: string; pts: number;
  outing: Outing | null;
  theme: { text: string; at: string } | null;
  special: { to: string; title: string; pts: number; at: string } | null;
  veto: { proofId: string; to: string; questTitle: string; status: 'approved' | 'rejected'; at: string } | null;
  vetoUsed: boolean;
  // Only for the king: this month's judged proofs of the others.
  vetoable: { id: string; memberId: string; questTitle: string; pts: number; type: 'image' | 'video'; status: 'approved' | 'rejected'; media: string }[];
};
export type GroupState = {
  me: string;
  group: { id: string; name: string; code: string };
  members: Member[];
  month: { key: string; day: number; days: number; daysToMonday: number; ranking: string[] };
  week: { number: number; daysToNext: number };
  quests: Quest[];
  toVote: ToVote[];
  feed: FeedItem[];
  king: King | null;
  myProofs: { id: string; questTitle: string; type: 'image' | 'video'; status: Status; vetoed: boolean; media: string; createdAt: string }[];
};
export type Account = { id: string; username: string; name: string };
export type MyGroup = { id: string; name: string; code: string; members: number; joinedAt: string };
export type Me = { account: Account; groups: MyGroup[] };
export type PushDevice = { kind: 'web'; sub: unknown } | { kind: 'expo'; token: string };

export const api = {
  signup: (username: string, name: string, password: string, legacyKey?: string | null) =>
    call<{ token: string; linkedGroup: string | null }>('POST', 'auth/signup', { username, name, password }, undefined,
      legacyKey ? { 'x-legacy': legacyKey, authorization: '' } : { authorization: '' }),
  login: (username: string, password: string) => call<{ token: string }>('POST', 'auth/login', { username, password }, undefined, { authorization: '' }),
  logout: () => call('POST', 'auth/logout', {}),
  me: () => call<Me>('GET', 'auth/me'),
  createGroup: (groupName: string) => call<{ groupId: string }>('POST', 'groups', { groupName }),
  join: (code: string) => call<{ groupId: string }>('POST', 'join', { code }),
  state: () => call<GroupState>('GET', 'state'),
  accept: (questId: string) => call('POST', 'accept', { questId }),
  vote: (proofId: string, v: 'yes' | 'no') => call('POST', 'votes', { proofId, v }),
  outing: (k: string, v: string) => call('POST', 'outing', { k, v }),
  theme: (text: string) => call('POST', 'theme', { text }),
  special: (to: string, title: string, pts: number) => call('POST', 'special', { to, title, pts }),
  veto: (proofId: string) => call<{ status: 'approved' | 'rejected' }>('POST', 'veto', { proofId }),
  propose: (title: string, pts: number) => call('POST', 'proposals', { title, pts }),
  pushKey: () => call<{ publicKey: string }>('GET', 'push/key'),
  pushOn: (device: PushDevice) => call<{ deviceId: string }>('POST', 'push/devices', device),
  pushOff: (deviceId: string) => call('DELETE', `push/devices/${deviceId}`),
  leave: () => call('POST', 'leave', {}),
  async uploadProof(opts: { questId: string; uri: string; type: 'image' | 'video'; mime: string; note: string; onProgress?: (p: number) => void }) {
    // Read the whole file once, then send it in pieces small enough for the server.
    const blob = await (await fetch(opts.uri)).blob();
    const start = await call<{ proofId: string; chunkSize: number; chunks: number }>('POST', 'proofs', {
      questId: opts.questId, type: opts.type, mime: opts.mime || blob.type, size: blob.size, note: opts.note
    });
    for (let i = 0; i < start.chunks; i++) {
      const piece = blob.slice(i * start.chunkSize, Math.min(blob.size, (i + 1) * start.chunkSize));
      await call('PUT', `proofs/${start.proofId}/chunk/${i}`, undefined, piece);
      opts.onProgress?.((i + 1) / start.chunks);
    }
    await call('POST', `proofs/${start.proofId}/complete`, {});
    return start.proofId;
  }
};
