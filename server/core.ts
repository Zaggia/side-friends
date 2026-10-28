import { getStore } from '@netlify/blobs';
import type { MessageKey } from './messages.ts';

// Data lives in two Blobs stores. Every key is written by one person for one fact
// (an account, a member, a proof, a vote), so nothing is a shared counter: points, ranks
// and winners are computed from proofs and votes on each read.
//   data:  accounts/{aid} usernames/{name} sessions/{tokenHash} accountGroups/{aid}/{gid}
//          loginFails/{name}
//          codes/{CODE} groups/{gid} members/{gid}/{mid} proofs/{gid}/{pid}
//          votes/{gid}/{pid}/{mid} accepts/{gid}/{mid}/{qid}
//          proposals/{gid}/{id}
//          outings|themes|specials|vetoes/{gid}/{month}   (the king's powers, one each per month)
//          push/{aid}/{deviceId} config/vapid sent/{gid}/{what}   (notifications)
//   media: {gid}/{pid}/{chunk}
export const data = () => getStore({ name: 'sf-data', consistency: 'strong' });
export const media = () => getStore({ name: 'sf-media', consistency: 'strong' });

export type Account = { id: string; username: string; name: string; salt: string; iterations: number; passHash: string; createdAt: string };
export type Session = { accountId: string; createdAt: string };
export type Group = { id: string; name: string; code: string; createdAt: string };
// tokenHash only on members created before accounts existed (one key per phone).
export type Member = { id: string; name: string; joinedAt: string; accountId?: string; tokenHash?: string };
export type Link = { memberId: string; joinedAt: string };

export class HttpError extends Error { constructor(public status: number, public key: MessageKey) { super(key); } }
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
export const fail = (status: number, key: MessageKey): never => { throw new HttpError(status, key); };

const hex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
export const rid = (bytes = 16) => hex(crypto.getRandomValues(new Uint8Array(bytes)));
export async function sha256(s: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
export const cleanName = (s: unknown, max = 24) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export async function listJSON<T>(prefix: string): Promise<T[]> {
  const s = data();
  const { blobs } = await s.list({ prefix });
  const rows = (await Promise.all(blobs.map(b => s.get(b.key, { type: 'json' })))) as (T | null)[];
  return rows.filter((r): r is T => r !== null);
}

/* ---------- passwords and sessions ---------- */
export const PBKDF2_ITERATIONS = 210000;
export async function hashPassword(password: string, salt: string, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = new Uint8Array(salt.match(/../g)!.map(h => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256));
}
export function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
// A session token is "s." + 64 hex characters; only its hash is stored.
export async function newSession(accountId: string) {
  const token = rid(32);
  await data().setJSON(`sessions/${await sha256(token)}`, { accountId, createdAt: new Date().toISOString() } satisfies Session);
  return `s.${token}`;
}
const bearer = (req: Request) => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

export async function authAccount(req: Request): Promise<{ account: Account; tokenHash: string }> {
  const b = bearer(req);
  if (!b.startsWith('s.')) fail(401, 'auth_missing');
  const tokenHash = await sha256(b.slice(2));
  const s = data();
  const session = await s.get(`sessions/${tokenHash}`, { type: 'json' }) as Session | null;
  if (!session) fail(401, 'auth_invalid');
  const account = await s.get(`accounts/${session!.accountId}`, { type: 'json' }) as Account | null;
  if (!account) fail(401, 'auth_invalid');
  return { account: account!, tokenHash };
}

// The member behind a request: an account plus the group it names in x-group,
// or (older phones) a "group.member.secret" key.
export async function auth(req: Request): Promise<{ group: Group; member: Member; account: Account | null }> {
  const b = bearer(req);
  const s = data();
  if (b.startsWith('s.')) {
    const { account } = await authAccount(req);
    const gid = (req.headers.get('x-group') || '').replace(/[^a-f0-9]/g, '');
    if (!gid) fail(400, 'no_group');
    const link = await s.get(`accountGroups/${account.id}/${gid}`, { type: 'json' }) as Link | null;
    if (!link) fail(403, 'not_in_group');
    const [group, member] = await Promise.all([
      s.get(`groups/${gid}`, { type: 'json' }) as Promise<Group | null>,
      s.get(`members/${gid}/${link!.memberId}`, { type: 'json' }) as Promise<Member | null>
    ]);
    if (!group || !member) fail(403, 'not_in_group');
    return { group: group!, member: member!, account };
  }
  return { ...(await legacyAuth(b)), account: null };
}
export async function legacyAuth(key: string) {
  const [gid, mid, token] = key.split('.');
  if (!gid || !mid || !token) fail(401, 'auth_missing');
  const s = data();
  const [group, member] = await Promise.all([
    s.get(`groups/${gid}`, { type: 'json' }) as Promise<Group | null>,
    s.get(`members/${gid}/${mid}`, { type: 'json' }) as Promise<Member | null>
  ]);
  if (!group || !member || !member.tokenHash || !sameHash(member.tokenHash, await sha256(token))) fail(401, 'auth_invalid');
  return { group: group!, member: member! };
}
