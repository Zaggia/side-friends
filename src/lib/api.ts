import { Platform } from 'react-native';
import { getAuth } from './session';
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
  constructor(public status: number, message: string) { super(message); }
}

async function call<T>(method: string, path: string, body?: unknown, raw?: Blob): Promise<T> {
  const auth = await getAuth();
  const headers: Record<string, string> = { 'x-lang': currentLang() };
  if (auth) headers.authorization = `Bearer ${auth}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (raw) headers['content-type'] = 'application/octet-stream';
  let res: Response;
  try {
    res = await fetch(API_BASE + '/api/' + path, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, NET_ERROR[currentLang()]);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || NET_ERROR[currentLang()]);
  return data as T;
}

export type Member = { id: string; name: string; color: string; pts: number; quests: number; wins: string[]; joinedAt: string };
export type Quest = {
  id: string; kind: 'list' | 'idea' | 'group'; title: string; desc: string; pts: number; icon: string; video: boolean;
  state: 'new' | 'active' | 'pending' | 'done'; rejected: boolean; doneBy: string[]; by?: string;
};
export type ToVote = { id: string; memberId: string; questTitle: string; pts: number; icon: string; type: 'image' | 'video'; note: string; createdAt: string; media: string };
export type FeedItem = { who: string; kind: 'proof' | 'done' | 'proposal' | 'join'; quest?: string; pts?: number; media?: 'image' | 'video'; at: string };
export type Outing = { memberId: string; k: string; v: string; at: string };
export type GroupState = {
  me: string;
  group: { id: string; name: string; code: string };
  members: Member[];
  month: { key: string; day: number; days: number; daysToMonday: number; ranking: string[] };
  week: { number: number; daysToNext: number };
  quests: Quest[];
  toVote: ToVote[];
  feed: FeedItem[];
  king: { memberId: string; month: string; pts: number; outing: Outing | null } | null;
  myProofs: { id: string; questTitle: string; type: 'image' | 'video'; status: 'pending' | 'approved' | 'rejected'; media: string; createdAt: string }[];
};
type Joined = { auth: string; groupId: string; memberId: string };

export const api = {
  createGroup: (name: string, groupName: string) => call<Joined>('POST', 'groups', { name, groupName }),
  join: (name: string, code: string) => call<Joined>('POST', 'join', { name, code }),
  state: () => call<GroupState>('GET', 'state'),
  accept: (questId: string) => call('POST', 'accept', { questId }),
  vote: (proofId: string, v: 'yes' | 'no') => call('POST', 'votes', { proofId, v }),
  outing: (k: string, v: string) => call('POST', 'outing', { k, v }),
  propose: (title: string, pts: number) => call('POST', 'proposals', { title, pts }),
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
