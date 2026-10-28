import type { Config, Context } from '@netlify/functions';
import { pickLang } from '../../server/quests.ts';
import { message } from '../../server/messages.ts';
import {
  type Account, authAccount, data, fail, hashPassword, HttpError, json, legacyAuth, type Link, listJSON, type Member,
  newSession, PBKDF2_ITERATIONS, rid, sameHash, cleanName, type Group
} from '../../server/core.ts';

// Accounts: a username and a password, so the same person can sign in on any device
// and keep every group they belong to.
const USERNAME = /^[a-z0-9._]{3,20}$/;
const MAX_FAILS = 10, LOCK_MINUTES = 15;
type Fails = { n: number; until: string | null };

const normalize = (u: unknown) => (typeof u === 'string' ? u.trim().toLowerCase() : '');

async function signup(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = normalize(body.username);
  const name = cleanName(body.name);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name) fail(400, 'name_required');
  if (!USERNAME.test(username)) fail(400, 'username_invalid');
  if (password.length < 8 || password.length > 200) fail(400, 'password_short');
  // A phone from before accounts existed can bring its group along.
  const legacyKey = req.headers.get('x-legacy');
  const legacy = legacyKey ? await legacyAuth(legacyKey).catch(() => null) : null;

  const s = data();
  const id = rid(8);
  if (!(await s.set(`usernames/${username}`, id, { onlyIfNew: true })).modified) fail(409, 'username_taken');
  const salt = rid(16);
  const account: Account = { id, username, name, salt, iterations: PBKDF2_ITERATIONS, passHash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
  await s.setJSON(`accounts/${id}`, account);
  if (legacy) {
    const member: Member = { ...legacy.member, accountId: id };
    delete member.tokenHash;
    await s.setJSON(`members/${legacy.group.id}/${member.id}`, member);
    await s.setJSON(`accountGroups/${id}/${legacy.group.id}`, { memberId: member.id, joinedAt: member.joinedAt } satisfies Link);
  }
  return json({ token: await newSession(id), linkedGroup: legacy?.group.id ?? null }, 201);
}

async function login(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = normalize(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) fail(400, 'login_failed');
  const s = data();
  const fails = (await s.get(`loginFails/${username}`, { type: 'json' }) as Fails | null) ?? { n: 0, until: null };
  if (fails.until && new Date(fails.until) > new Date()) fail(429, 'login_locked');
  const id = await s.get(`usernames/${username}`);
  const account = id ? await s.get(`accounts/${id}`, { type: 'json' }) as Account | null : null;
  // Hash even when the username doesn't exist, so both answers take the same time.
  const hash = await hashPassword(password, account?.salt ?? '00'.repeat(16), account?.iterations ?? PBKDF2_ITERATIONS);
  if (!account || !sameHash(hash, account.passHash)) {
    const n = fails.n + 1;
    await s.setJSON(`loginFails/${username}`, { n: n >= MAX_FAILS ? 0 : n, until: n >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null } satisfies Fails);
    fail(401, n >= MAX_FAILS ? 'login_locked' : 'login_failed');
  }
  if (fails.n) await s.delete(`loginFails/${username}`);
  return json({ token: await newSession(account!.id) });
}

async function logout(req: Request) {
  const { tokenHash } = await authAccount(req);
  await data().delete(`sessions/${tokenHash}`);
  return json({ ok: true });
}

// Who is signed in, and every group they belong to.
async function me(req: Request) {
  const { account } = await authAccount(req);
  const s = data();
  const { blobs } = await s.list({ prefix: `accountGroups/${account.id}/` });
  const groups = (await Promise.all(blobs.map(async b => {
    const gid = b.key.split('/')[2];
    const [group, link] = await Promise.all([s.get(`groups/${gid}`, { type: 'json' }) as Promise<Group | null>, s.get(b.key, { type: 'json' }) as Promise<Link | null>]);
    if (!group || !link) return null;
    const members = await listJSON<Member>(`members/${gid}/`);
    if (!members.some(m => m.id === link.memberId)) return null;
    return { id: group.id, name: group.name, code: group.code, members: members.length, joinedAt: link.joinedAt };
  }))).filter(Boolean).sort((a, b) => a!.joinedAt.localeCompare(b!.joinedAt));
  return json({ account: { id: account.id, username: account.username, name: account.name }, groups });
}

export default async (req: Request, _context: Context) => {
  const lang = pickLang(req.headers.get('x-lang') || req.headers.get('accept-language'));
  const route = `${req.method} ${new URL(req.url).pathname.replace(/^\/api\/auth\/?/, '')}`;
  try {
    switch (route) {
      case 'POST signup': return await signup(req);
      case 'POST login': return await login(req);
      case 'POST logout': return await logout(req);
      case 'GET me': return await me(req);
    }
    return json({ error: message(lang, 'not_found'), code: 'not_found' }, 404);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: message(lang, e.key), code: e.key }, e.status);
    console.error(e);
    return json({ error: message(lang, 'server'), code: 'server' }, 500);
  }
};

// Sign-in attempts are limited per address on top of the per-account lock.
export const config: Config = {
  path: '/api/auth/*',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
