import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { IDEAS, LIST, OUTING_KEYS, pickLang, questText, weekQuests, type Lang, type QuestDef } from '../../server/quests.ts';
import { message, type MessageKey } from '../../server/messages.ts';

// Data lives in two Blobs stores. Every key is written by one person for one fact
// (a member, a proof, a vote), so nothing is a shared counter: points, ranks and
// winners are computed from proofs and votes on each read.
//   data:  codes/{CODE} groups/{gid} members/{gid}/{mid} proofs/{gid}/{pid}
//          votes/{gid}/{pid}/{mid} accepts/{gid}/{mid}/{qid}
//          outings/{gid}/{month} proposals/{gid}/{id}
//   media: {gid}/{pid}/{chunk}
// Someone who leaves a group is removed from members/; everything they wrote stays,
// but only current members' proofs and votes count.
const data = () => getStore({ name: 'sf-data', consistency: 'strong' });
const media = () => getStore({ name: 'sf-media', consistency: 'strong' });

const CHUNK = 3 * 1024 * 1024; // keeps each request and response under the function payload limit
const MAX_MEDIA = 60 * 1024 * 1024;
const COLORS = ['azzurro', 'sole', 'fragola', 'menta', 'lilla'];
const TZ = 'Europe/Rome';

type Group = { id: string; name: string; code: string; createdAt: string };
type Member = { id: string; name: string; joinedAt: string; tokenHash: string };
type Proof = {
  id: string; memberId: string; questId: string; questTitle: string; pts: number; icon: string;
  week: string; month: string; type: 'image' | 'video'; mime: string; size: number; chunks: number;
  note: string; createdAt: string; complete: boolean;
};
type Vote = { v: 'yes' | 'no'; at: string };
type Proposal = { id: string; memberId: string; title: string; pts: number; createdAt: string; month: string };
type Outing = { memberId: string; k: string; v: string; at: string };

class HttpError extends Error { constructor(public status: number, public key: MessageKey) { super(key); } }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const fail = (status: number, key: MessageKey): never => { throw new HttpError(status, key); };

const rid = (bytes = 16) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), b => b.toString(16).padStart(2, '0')).join('');
async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
}
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => A[b % A.length]).join('');
}
const cleanName = (s: unknown, max = 24) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/* ---------- dates in Italian time ---------- */
function romeParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day };
}
const monthKey = (d = new Date()) => { const p = romeParts(d); return `${p.y}-${String(p.m).padStart(2, '0')}`; };
function prevMonth(key: string) { const [y, m] = key.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; }
// Monday-based week number counted from a fixed Monday, in Rome's calendar.
function weekNumber(d = new Date()) {
  const p = romeParts(d);
  const days = Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
  return Math.floor((days - 4) / 7); // 1970-01-05 was a Monday (day 4)
}
function monthInfo(d = new Date()) {
  const p = romeParts(d);
  const days = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const dow = (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7; // 0 = Monday
  return { day: p.d, days, daysToMonday: 7 - dow };
}

/* ---------- loading ---------- */
async function listJSON<T>(prefix: string): Promise<T[]> {
  const s = data();
  const { blobs } = await s.list({ prefix });
  const rows = (await Promise.all(blobs.map(b => s.get(b.key, { type: 'json' })))) as (T | null)[];
  return rows.filter((r): r is T => r !== null);
}
async function listVotes(gid: string) {
  const s = data();
  const { blobs } = await s.list({ prefix: `votes/${gid}/` });
  const out: Record<string, Record<string, Vote>> = {};
  await Promise.all(blobs.map(async b => {
    const [, , pid, mid] = b.key.split('/');
    const v = await s.get(b.key, { type: 'json' }) as Vote | null;
    if (v) (out[pid] ??= {})[mid] = v;
  }));
  return out;
}
async function auth(req: Request) {
  const h = req.headers.get('authorization') || '';
  const [gid, mid, token] = h.replace(/^Bearer\s+/i, '').split('.');
  if (!gid || !mid || !token) fail(401, 'auth_missing');
  const s = data();
  const [group, member] = await Promise.all([
    s.get(`groups/${gid}`, { type: 'json' }) as Promise<Group | null>,
    s.get(`members/${gid}/${mid}`, { type: 'json' }) as Promise<Member | null>
  ]);
  if (!group || !member || member.tokenHash !== await sha256(token)) fail(401, 'auth_invalid');
  return { group: group!, member: member! };
}

/* ---------- rules ---------- */
// A proof needs at least half of the other members to say "vale", and more yes than no.
// With nobody else in the group it counts straight away, so one person can try the app alone.
function verdict(p: Proof, votes: Record<string, Vote> | undefined, memberIds: string[]) {
  const others = memberIds.filter(id => id !== p.memberId);
  const vs = Object.entries(votes || {}).filter(([mid]) => others.includes(mid)).map(([, v]) => v.v);
  const yes = vs.filter(v => v === 'yes').length, no = vs.length - yes;
  const need = Math.ceil(others.length / 2);
  if (others.length === 0) return { status: 'approved' as const, yes, no, need };
  if (yes >= need && yes > no) return { status: 'approved' as const, yes, no, need };
  if (no >= need && no >= yes) return { status: 'rejected' as const, yes, no, need };
  if (vs.length === others.length) return { status: (yes > no ? 'approved' : 'rejected') as 'approved' | 'rejected', yes, no, need };
  return { status: 'pending' as const, yes, no, need };
}
function standings(month: string, members: Member[], proofs: Proof[], votes: Record<string, Record<string, Vote>>) {
  const ids = members.map(m => m.id);
  const pts: Record<string, number> = {}, count: Record<string, number> = {};
  ids.forEach(id => { pts[id] = 0; count[id] = 0; });
  for (const p of proofs) {
    if (p.month !== month || !p.complete || !(p.memberId in pts)) continue;
    if (verdict(p, votes[p.id], ids).status === 'approved') { pts[p.memberId] += p.pts; count[p.memberId] += 1; }
  }
  const order = [...ids].sort((a, b) => pts[b] - pts[a] || count[b] - count[a] ||
    members.find(m => m.id === a)!.joinedAt.localeCompare(members.find(m => m.id === b)!.joinedAt));
  return { pts, count, order };
}
type Def = { title: string; pts: number; icon: string; video: boolean; kind: 'list' | 'idea' | 'group' };
// questId is "L:{week}:{id}", "I:{week}:{id}" or "P:{proposalId}".
function questDefFor(group: Group, questId: string, proposals: Proposal[]): Def | null {
  const [kind, wk, id] = questId.split(':');
  if (kind === 'P') { const p = proposals.find(x => x.id === wk); return p ? { title: p.title, pts: p.pts, icon: 'star', video: false, kind: 'group' } : null; }
  const def = (kind === 'L' ? LIST : IDEAS).find(q => q.id === id);
  if (!def || Number(wk) !== weekNumber()) return null;
  const drawn = weekQuests(group.id, Number(wk));
  if (![...drawn.list, ...drawn.ideas].includes(def)) return null;
  return { title: questText(def, 'it').title, pts: def.pts, icon: def.icon, video: !!def.video, kind: kind === 'L' ? 'list' : 'idea' };
}
// A proof's quest title in the reader's language (proposals keep the words their author wrote).
function titleFor(questId: string, lang: Lang, fallback: string) {
  const [kind, , id] = questId.split(':');
  const def = kind === 'L' ? LIST.find(q => q.id === id) : kind === 'I' ? IDEAS.find(q => q.id === id) : null;
  return def ? questText(def, lang).title : fallback;
}

/* ---------- routes ---------- */
async function createGroup(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name), groupName = cleanName(body.groupName, 32);
  if (!name) fail(400, 'name_required');
  if (!groupName) fail(400, 'group_name_required');
  const s = data();
  const gid = rid(8);
  let code = '';
  for (let i = 0; i < 5 && !code; i++) {
    const c = newCode();
    if ((await s.set(`codes/${c}`, gid, { onlyIfNew: true })).modified) code = c;
  }
  if (!code) fail(500, 'code_failed');
  const group: Group = { id: gid, name: groupName, code, createdAt: new Date().toISOString() };
  await s.setJSON(`groups/${gid}`, group);
  return json(await addMember(group, name), 201);
}
async function joinGroup(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name);
  const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!name) fail(400, 'name_required');
  if (code.length !== 6) fail(400, 'code_length');
  const s = data();
  const gid = await s.get(`codes/${code}`);
  if (!gid) fail(404, 'code_unknown');
  const group = await s.get(`groups/${gid}`, { type: 'json' }) as Group;
  const members = await listJSON<Member>(`members/${gid}/`);
  if (members.length >= 20) fail(400, 'group_full');
  return json(await addMember(group, name), 201);
}
async function addMember(group: Group, name: string) {
  const mid = rid(8), token = rid(24);
  const member: Member = { id: mid, name, joinedAt: new Date().toISOString(), tokenHash: await sha256(token) };
  await data().setJSON(`members/${group.id}/${mid}`, member);
  return { auth: `${group.id}.${mid}.${token}`, groupId: group.id, memberId: mid };
}

async function state(req: Request, lang: Lang) {
  const { group, member } = await auth(req);
  const gid = group.id;
  const [members, allProofs, votes, allProposals, accepts, outingNow] = await Promise.all([
    listJSON<Member>(`members/${gid}/`),
    listJSON<Proof>(`proofs/${gid}/`),
    listVotes(gid),
    listJSON<Proposal>(`proposals/${gid}/`),
    data().list({ prefix: `accepts/${gid}/${member.id}/` }),
    data().get(`outings/${gid}/${monthKey()}`, { type: 'json' }) as Promise<Outing | null>
  ]);
  members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const ids = members.map(m => m.id);
  const isMember = (id: string) => ids.includes(id);
  const proofs = allProofs.filter(p => isMember(p.memberId));
  const proposals = allProposals.filter(p => isMember(p.memberId));
  const color = (id: string) => COLORS[Math.max(0, ids.indexOf(id)) % COLORS.length];
  const month = monthKey(), last = prevMonth(month), week = weekNumber();
  const now = standings(month, members, proofs, votes);
  const before = standings(last, members, proofs, votes);
  const king = before.order.length && before.pts[before.order[0]] > 0 ? before.order[0] : null;
  const accepted = new Set(accepts.blobs.map(b => b.key.split('/').slice(3).join('/')));

  const done = proofs.filter(p => p.complete);
  const statusOf = (p: Proof) => verdict(p, votes[p.id], ids);
  const mine = (qid: string) => done.filter(p => p.memberId === member.id && p.questId === qid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const questView = (q: { title: string; desc: string; pts: number; icon: string; video?: boolean }, qid: string, kind: string) => {
    const p = mine(qid);
    const st = p ? statusOf(p).status : null;
    return {
      id: qid, kind, title: q.title, desc: q.desc, pts: q.pts, icon: q.icon, video: !!q.video,
      state: st === 'approved' ? 'done' : st === 'pending' ? 'pending' : accepted.has(qid) ? 'active' : 'new',
      rejected: st === 'rejected',
      doneBy: [...new Set(done.filter(x => x.questId === qid && x.memberId !== member.id && statusOf(x).status === 'approved').map(x => x.memberId))]
    };
  };
  const view = (q: QuestDef, qid: string, kind: string) => questView({ ...questText(q, lang), pts: q.pts, icon: q.icon, video: q.video }, qid, kind);
  const drawn = weekQuests(gid, week);
  const quests = [
    ...drawn.list.map(q => view(q, `L:${week}:${q.id}`, 'list')),
    ...drawn.ideas.map(q => view(q, `I:${week}:${q.id}`, 'idea')),
    ...proposals.filter(p => p.month === month).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(p => ({ ...questView({ title: p.title, desc: '', pts: p.pts, icon: 'star' }, `P:${p.id}`, 'group'), by: p.memberId }))
  ];
  const title = (p: Proof) => titleFor(p.questId, lang, p.questTitle);

  const toVote = done.filter(p => p.memberId !== member.id && !votes[p.id]?.[member.id] && statusOf(p).status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(p => ({ id: p.id, memberId: p.memberId, questTitle: title(p), pts: p.pts, icon: p.icon, type: p.type, note: p.note, createdAt: p.createdAt, media: `/api/media/${gid}/${p.id}` }));

  // Events, in the order they happened; the app writes the sentences in the reader's language.
  type Event = { who: string; kind: 'proof' | 'done' | 'proposal' | 'join'; quest?: string; pts?: number; media?: string; at: string };
  const feed: Event[] = [
    ...done.flatMap(p => {
      const items: Event[] = [{ who: p.memberId, kind: 'proof', quest: title(p), media: p.type, at: p.createdAt }];
      if (statusOf(p).status === 'approved') {
        const lastVote = Object.values(votes[p.id] || {}).map(x => x.at).sort().pop() || p.createdAt;
        items.push({ who: p.memberId, kind: 'done', quest: title(p), pts: p.pts, at: lastVote > p.createdAt ? lastVote : p.createdAt });
      }
      return items;
    }),
    ...proposals.map(p => ({ who: p.memberId, kind: 'proposal' as const, quest: p.title, at: p.createdAt })),
    ...members.map(m => ({ who: m.id, kind: 'join' as const, at: m.joinedAt }))
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);

  const titles: Record<string, string[]> = {};
  for (const m of [...new Set(proofs.map(p => p.month))].filter(m => m < month).sort()) {
    const st = standings(m, members, proofs, votes);
    const w = st.order[0];
    if (w && st.pts[w] > 0) (titles[w] ??= []).push(m);
  }

  return json({
    me: member.id,
    group: { id: gid, name: group.name, code: group.code },
    members: members.map(m => ({ id: m.id, name: m.name, color: color(m.id), pts: now.pts[m.id], quests: now.count[m.id], wins: titles[m.id] || [], joinedAt: m.joinedAt })),
    month: { key: month, ...monthInfo(), ranking: now.order },
    week: { number: week, daysToNext: monthInfo().daysToMonday },
    quests,
    toVote,
    feed,
    king: king ? { memberId: king, month: last, pts: before.pts[king], outing: outingNow } : null,
    myProofs: done.filter(p => p.memberId === member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
      .map(p => ({ id: p.id, questTitle: title(p), type: p.type, status: statusOf(p).status, media: `/api/media/${gid}/${p.id}`, createdAt: p.createdAt }))
  });
}

async function accept(req: Request) {
  const { group, member } = await auth(req);
  const { questId } = await req.json().catch(() => ({}));
  const proposals = await listJSON<Proposal>(`proposals/${group.id}/`);
  if (!questId || !questDefFor(group, String(questId), proposals)) fail(400, 'quest_gone');
  await data().setJSON(`accepts/${group.id}/${member.id}/${questId}`, { at: new Date().toISOString() });
  return json({ ok: true });
}

async function startProof(req: Request) {
  const { group, member } = await auth(req);
  const body = await req.json().catch(() => ({}));
  const questId = String(body.questId || '');
  const proposals = await listJSON<Proposal>(`proposals/${group.id}/`);
  const def = questDefFor(group, questId, proposals);
  if (!def) fail(400, 'quest_gone');
  const type = body.type === 'video' ? 'video' : 'image';
  if (def!.video && type !== 'video') fail(400, 'video_required');
  const mime = String(body.mime || (type === 'video' ? 'video/mp4' : 'image/jpeg')).slice(0, 60);
  if (!/^(image|video)\/[\w.+-]+$/.test(mime)) fail(400, 'bad_format');
  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) fail(400, 'empty_file');
  if (size > MAX_MEDIA) fail(413, 'too_big');
  const existing = (await listJSON<Proof>(`proofs/${group.id}/`)).find(p => p.memberId === member.id && p.questId === questId && p.complete);
  if (existing) {
    const votes = await listVotes(group.id);
    const members = await listJSON<Member>(`members/${group.id}/`);
    if (verdict(existing, votes[existing.id], members.map(m => m.id)).status !== 'rejected') fail(409, 'already_sent');
  }
  const pid = rid(12);
  const proof: Proof = {
    id: pid, memberId: member.id, questId, questTitle: def!.title, pts: def!.pts, icon: def!.icon,
    week: String(weekNumber()), month: monthKey(), type, mime, size, chunks: Math.ceil(size / CHUNK),
    note: cleanName(body.note, 140), createdAt: new Date().toISOString(), complete: false
  };
  await data().setJSON(`proofs/${group.id}/${pid}`, proof);
  return json({ proofId: pid, chunkSize: CHUNK, chunks: proof.chunks }, 201);
}
async function uploadChunk(req: Request, pid: string, index: number) {
  const { group, member } = await auth(req);
  const proof = await data().get(`proofs/${group.id}/${pid}`, { type: 'json' }) as Proof | null;
  if (!proof || proof.memberId !== member.id) fail(404, 'proof_missing');
  if (proof!.complete) fail(409, 'proof_closed');
  if (!(index >= 0 && index < proof!.chunks)) fail(400, 'bad_piece');
  const buf = await req.arrayBuffer();
  const expected = index === proof!.chunks - 1 ? proof!.size - CHUNK * index : CHUNK;
  if (buf.byteLength !== expected) fail(400, 'short_piece');
  await media().set(`${group.id}/${pid}/${index}`, buf);
  return json({ ok: true });
}
async function completeProof(req: Request, pid: string) {
  const { group, member } = await auth(req);
  const s = data();
  const proof = await s.get(`proofs/${group.id}/${pid}`, { type: 'json' }) as Proof | null;
  if (!proof || proof.memberId !== member.id) fail(404, 'proof_missing');
  const { blobs } = await media().list({ prefix: `${group.id}/${pid}/` });
  if (blobs.length !== proof!.chunks) fail(400, 'incomplete');
  proof!.complete = true;
  await s.setJSON(`proofs/${group.id}/${pid}`, proof);
  return json({ ok: true });
}

async function serveMedia(req: Request, gid: string, pid: string) {
  const proof = await data().get(`proofs/${gid}/${pid}`, { type: 'json' }) as Proof | null;
  if (!proof || !proof.complete) return new Response('Not found', { status: 404 });
  const m = media();
  const headers = { 'content-type': proof.mime, 'accept-ranges': 'bytes', 'cache-control': 'private, max-age=31536000, immutable' };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, proof.size - Number(range[2]));
    let end = range[1] && range[2] ? Number(range[2]) : proof.size - 1;
    if (start >= proof.size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${proof.size}` } });
    const idx = Math.floor(start / CHUNK);
    end = Math.min(end, proof.size - 1, (idx + 1) * CHUNK - 1); // one stored piece per response
    const piece = await m.get(`${gid}/${pid}/${idx}`, { type: 'arrayBuffer' });
    if (!piece) return new Response('Not found', { status: 404 });
    const body = piece.slice(start - idx * CHUNK, end - idx * CHUNK + 1);
    return new Response(body, { status: 206, headers: { ...headers, 'content-range': `bytes ${start}-${end}/${proof.size}`, 'content-length': String(body.byteLength) } });
  }
  if (proof.chunks === 1) {
    const whole = await m.get(`${gid}/${pid}/0`, { type: 'arrayBuffer' });
    return whole ? new Response(whole, { headers: { ...headers, 'content-length': String(proof.size) } }) : new Response('Not found', { status: 404 });
  }
  const stream = new ReadableStream({
    async start(ctl) {
      for (let i = 0; i < proof.chunks; i++) {
        const piece = await m.get(`${gid}/${pid}/${i}`, { type: 'arrayBuffer' });
        if (!piece) { ctl.error(new Error('missing piece')); return; }
        ctl.enqueue(new Uint8Array(piece));
      }
      ctl.close();
    }
  });
  return new Response(stream, { headers: { ...headers, 'content-length': String(proof.size) } });
}

async function vote(req: Request) {
  const { group, member } = await auth(req);
  const { proofId, v } = await req.json().catch(() => ({}));
  if (v !== 'yes' && v !== 'no') fail(400, 'bad_vote');
  const proof = await data().get(`proofs/${group.id}/${proofId}`, { type: 'json' }) as Proof | null;
  if (!proof || !proof.complete) fail(404, 'proof_missing');
  if (proof!.memberId === member.id) fail(400, 'own_vote');
  const { modified } = await data().setJSON(`votes/${group.id}/${proofId}/${member.id}`, { v, at: new Date().toISOString() } satisfies Vote, { onlyIfNew: true });
  if (!modified) fail(409, 'voted');
  return json({ ok: true });
}

async function setOuting(req: Request) {
  const { group, member } = await auth(req);
  const { k, v } = await req.json().catch(() => ({}));
  if (!(OUTING_KEYS as readonly string[]).includes(k)) fail(400, 'outing_kind');
  const value = cleanName(v, 60);
  if (!value) fail(400, 'outing_value');
  const res = await (await state(new Request(req.url, { headers: req.headers }), 'it')).json();
  if (!res.king || res.king.memberId !== member.id) fail(403, 'not_king');
  const { modified } = await data().setJSON(`outings/${group.id}/${monthKey()}`, { memberId: member.id, k, v: value, at: new Date().toISOString() } satisfies Outing, { onlyIfNew: true });
  if (!modified) fail(409, 'outing_done');
  return json({ ok: true });
}

async function propose(req: Request) {
  const { group, member } = await auth(req);
  const body = await req.json().catch(() => ({}));
  const title = cleanName(body.title, 70);
  const pts = [20, 30, 50].includes(Number(body.pts)) ? Number(body.pts) : 30;
  if (title.length < 4) fail(400, 'proposal_short');
  const month = monthKey();
  const mineThisMonth = (await listJSON<Proposal>(`proposals/${group.id}/`)).filter(p => p.memberId === member.id && p.month === month);
  if (mineThisMonth.length >= 3) fail(400, 'proposal_limit');
  const id = rid(6);
  await data().setJSON(`proposals/${group.id}/${id}`, { id, memberId: member.id, title, pts, createdAt: new Date().toISOString(), month } satisfies Proposal);
  return json({ ok: true, id }, 201);
}

// Leaving deletes the member record and this phone's quest acceptances; the key stops working.
async function leave(req: Request) {
  const { group, member } = await auth(req);
  const s = data();
  const { blobs } = await s.list({ prefix: `accepts/${group.id}/${member.id}/` });
  await Promise.all(blobs.map(b => s.delete(b.key)));
  await s.delete(`members/${group.id}/${member.id}`);
  return json({ ok: true });
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const lang = pickLang(req.headers.get('x-lang') || req.headers.get('accept-language'));
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = `${req.method} ${parts[0] || ''}`;
  try {
    switch (route) {
      case 'POST groups': return await createGroup(req);
      case 'POST join': return await joinGroup(req);
      case 'GET state': return await state(req, lang);
      case 'POST accept': return await accept(req);
      case 'POST votes': return await vote(req);
      case 'POST outing': return await setOuting(req);
      case 'POST proposals': return await propose(req);
      case 'POST leave': return await leave(req);
      case 'POST proofs':
        if (parts.length === 1) return await startProof(req);
        if (parts[2] === 'complete') return await completeProof(req, parts[1]);
        break;
      case 'PUT proofs':
        if (parts[2] === 'chunk') return await uploadChunk(req, parts[1], Number(parts[3]));
        break;
      case 'GET media':
        if (parts.length === 3) return await serveMedia(req, parts[1], parts[2]);
        break;
    }
    return json({ error: message(lang, 'not_found'), code: 'not_found' }, 404);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: message(lang, e.key), code: e.key }, e.status);
    console.error(e);
    return json({ error: message(lang, 'server'), code: 'server' }, 500);
  }
};

export const config: Config = { path: '/api/*' };
