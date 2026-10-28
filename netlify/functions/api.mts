import type { Config, Context } from '@netlify/functions';
import { IDEAS, LIST, OUTING_KEYS, pickLang, questText, weekQuests, type Lang, type QuestDef } from '../../server/quests.ts';
import { message } from '../../server/messages.ts';
import {
  auth, authAccount, cleanName, data, fail, type Group, HttpError, json, type Link, listJSON, media, type Member, rid
} from '../../server/core.ts';
import {
  type Game, kingOf, loadGame, monthInfo, monthKey, type Outing, prevMonth, type Proof, type Special, standings,
  type Theme, verdict, type Veto, type Vote, weekNumber
} from '../../server/game.ts';
import { notify, outingWords } from '../../server/notify.ts';

// The group API. Storage layout and sign-in live in server/core.ts, the rules in server/game.ts,
// accounts in auth.mts and notification settings in push.mts.
// Someone who leaves a group is removed from members/; everything they wrote stays,
// but only current members' proofs and votes count.
const CHUNK = 3 * 1024 * 1024; // keeps each request and response under the function payload limit
const MAX_MEDIA = 60 * 1024 * 1024;
const COLORS = ['azzurro', 'sole', 'fragola', 'menta', 'lilla'];
const QUEST_PTS = [20, 30, 50];

type Proposal = { id: string; memberId: string; title: string; pts: number; createdAt: string; month: string };
// Notifications go out after the response, so nobody waits for them.
type Later = (p: Promise<unknown>) => void;

function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => A[b % A.length]).join('');
}
const getJSON = <T,>(key: string) => data().get(key, { type: 'json' }) as Promise<T | null>;

type Def = { title: string; pts: number; icon: string; video: boolean; kind: 'list' | 'idea' | 'group' | 'special' };
// questId is "L:{week}:{id}", "I:{week}:{id}", "P:{proposalId}" or "S:{month}" (the king's special quest).
function questDefFor(group: Group, member: Member, questId: string, proposals: Proposal[], special: Special | null): Def | null {
  const [kind, wk, id] = questId.split(':');
  if (kind === 'P') { const p = proposals.find(x => x.id === wk); return p ? { title: p.title, pts: p.pts, icon: 'star', video: false, kind: 'group' } : null; }
  if (kind === 'S') return special && wk === monthKey() && special.to === member.id ? { title: special.title, pts: special.pts, icon: 'crown', video: false, kind: 'special' } : null;
  const def = (kind === 'L' ? LIST : IDEAS).find(q => q.id === id);
  if (!def || Number(wk) !== weekNumber()) return null;
  const drawn = weekQuests(group.id, Number(wk));
  if (![...drawn.list, ...drawn.ideas].includes(def)) return null;
  return { title: questText(def, 'it').title, pts: def.pts, icon: def.icon, video: !!def.video, kind: kind === 'L' ? 'list' : 'idea' };
}
// A proof's quest title in the reader's language (proposals and special quests keep their author's words).
function titleFor(questId: string, lang: Lang, fallback: string) {
  const [kind, , id] = questId.split(':');
  const def = kind === 'L' ? LIST.find(q => q.id === id) : kind === 'I' ? IDEAS.find(q => q.id === id) : null;
  return def ? questText(def, lang).title : fallback;
}
const nameOf = (g: Game, id: string) => g.members.find(m => m.id === id)?.name ?? '';
const others = (g: Game, id: string) => g.ids.filter(x => x !== id);

// The king's powers for this month: each one can be used once.
async function powers(gid: string, month = monthKey()) {
  const [outing, theme, special, veto] = await Promise.all([
    getJSON<Outing>(`outings/${gid}/${month}`),
    getJSON<Theme>(`themes/${gid}/${month}`),
    getJSON<Special>(`specials/${gid}/${month}`),
    getJSON<Veto>(`vetoes/${gid}/${month}`)
  ]);
  return { outing, theme, special, veto };
}
async function requireKing(group: Group, member: Member) {
  const g = await loadGame(group.id);
  const king = kingOf(g);
  if (!king || king.memberId !== member.id) fail(403, 'not_king');
  return g;
}

/* ---------- routes ---------- */
async function createGroup(req: Request) {
  const { account } = await authAccount(req);
  const body = await req.json().catch(() => ({}));
  const groupName = cleanName(body.groupName, 32);
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
  await addMember(group, account.id, account.name);
  return json({ groupId: gid }, 201);
}
async function joinGroup(req: Request, later: Later) {
  const { account } = await authAccount(req);
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) fail(400, 'code_length');
  const s = data();
  const gid = await s.get(`codes/${code}`);
  if (!gid) fail(404, 'code_unknown');
  const group = await s.get(`groups/${gid}`, { type: 'json' }) as Group;
  const members = await listJSON<Member>(`members/${gid}/`);
  // Already in (from another device, say): nothing to add.
  const link = await s.get(`accountGroups/${account.id}/${gid}`, { type: 'json' }) as Link | null;
  if (link && members.some(m => m.id === link.memberId)) return json({ groupId: gid });
  if (members.length >= 20) fail(400, 'group_full');
  await addMember(group, account.id, account.name);
  later(notify(group, members, members.map(m => m.id), 'quest', t => t.join(account.name)));
  return json({ groupId: gid }, 201);
}
async function addMember(group: Group, accountId: string, name: string) {
  const s = data();
  const member: Member = { id: rid(8), name, joinedAt: new Date().toISOString(), accountId };
  await s.setJSON(`members/${group.id}/${member.id}`, member);
  await s.setJSON(`accountGroups/${accountId}/${group.id}`, { memberId: member.id, joinedAt: member.joinedAt } satisfies Link);
}

async function state(req: Request, lang: Lang) {
  const { group, member } = await auth(req);
  const gid = group.id;
  const month = monthKey(), last = prevMonth(month), week = weekNumber();
  const [g, allProposals, accepts, pw] = await Promise.all([
    loadGame(gid),
    listJSON<Proposal>(`proposals/${gid}/`),
    data().list({ prefix: `accepts/${gid}/${member.id}/` }),
    powers(gid, month)
  ]);
  const { members, ids, proofs } = g;
  const proposals = allProposals.filter(p => ids.includes(p.memberId));
  const color = (id: string) => COLORS[Math.max(0, ids.indexOf(id)) % COLORS.length];
  const now = standings(month, g);
  const king = kingOf(g, month);
  const accepted = new Set(accepts.blobs.map(b => b.key.split('/').slice(3).join('/')));
  // With nobody crowned there are no powers to show; a special quest for someone who left is gone.
  const mine = king ? pw : { outing: null, theme: null, special: null, veto: null };
  const special = mine.special && ids.includes(mine.special.to) ? mine.special : null;

  const done = proofs.filter(p => p.complete);
  const statusOf = (p: Proof) => verdict(p, g);
  const title = (p: Proof) => titleFor(p.questId, lang, p.questTitle);
  const latestMine = (qid: string) => done.filter(p => p.memberId === member.id && p.questId === qid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const questView = (q: { title: string; desc: string; pts: number; icon: string; video?: boolean }, qid: string, kind: string) => {
    const p = latestMine(qid);
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
    ...(special && special.to === member.id ? [{ ...questView({ title: special.title, desc: '', pts: special.pts, icon: 'crown' }, `S:${month}`, 'special'), by: special.memberId }] : []),
    ...drawn.list.map(q => view(q, `L:${week}:${q.id}`, 'list')),
    ...drawn.ideas.map(q => view(q, `I:${week}:${q.id}`, 'idea')),
    ...proposals.filter(p => p.month === month).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(p => ({ ...questView({ title: p.title, desc: '', pts: p.pts, icon: 'star' }, `P:${p.id}`, 'group'), by: p.memberId }))
  ];

  const toVote = done.filter(p => p.memberId !== member.id && !g.votes[p.id]?.[member.id] && statusOf(p).status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(p => ({ id: p.id, memberId: p.memberId, questTitle: title(p), pts: p.pts, icon: p.icon, type: p.type, note: p.note, createdAt: p.createdAt, media: `/api/media/${gid}/${p.id}` }));

  const vetoed = mine.veto ? done.find(p => p.id === mine.veto!.proofId) : undefined;
  // Events, in the order they happened; the app writes the sentences in the reader's language.
  type Event = { who: string; kind: 'proof' | 'done' | 'proposal' | 'join' | 'theme' | 'special' | 'veto' | 'outing'; quest?: string; pts?: number; media?: string; to?: string; text?: string; k?: string; status?: string; at: string };
  const feed: Event[] = [
    ...done.flatMap(p => {
      const items: Event[] = [{ who: p.memberId, kind: 'proof', quest: title(p), media: p.type, at: p.createdAt }];
      if (statusOf(p).status === 'approved' && !statusOf(p).vetoed) {
        const lastVote = Object.values(g.votes[p.id] || {}).map(x => x.at).sort().pop() || p.createdAt;
        items.push({ who: p.memberId, kind: 'done', quest: title(p), pts: p.pts, at: lastVote > p.createdAt ? lastVote : p.createdAt });
      }
      return items;
    }),
    ...proposals.map(p => ({ who: p.memberId, kind: 'proposal' as const, quest: p.title, at: p.createdAt })),
    ...members.map(m => ({ who: m.id, kind: 'join' as const, at: m.joinedAt })),
    ...(mine.theme ? [{ who: mine.theme.memberId, kind: 'theme' as const, text: mine.theme.text, at: mine.theme.at }] : []),
    ...(special ? [{ who: special.memberId, kind: 'special' as const, to: special.to, quest: special.title, at: special.at }] : []),
    ...(mine.veto && vetoed ? [{ who: mine.veto.memberId, kind: 'veto' as const, to: vetoed.memberId, quest: title(vetoed), status: mine.veto.status, at: mine.veto.at }] : []),
    ...(mine.outing ? [{ who: mine.outing.memberId, kind: 'outing' as const, k: mine.outing.k, text: mine.outing.v, at: mine.outing.at }] : [])
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);

  const titles: Record<string, string[]> = {};
  for (const m of [...new Set(proofs.map(p => p.month))].filter(m => m < month).sort()) {
    const st = standings(m, g);
    const w = st.order[0];
    if (w && st.pts[w] > 0) (titles[w] ??= []).push(m);
  }

  // The king picks the proof to veto from this month's judged proofs of the others.
  const vetoable = king?.memberId === member.id && !mine.veto
    ? done.filter(p => p.month === month && p.memberId !== member.id && statusOf(p).status !== 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
      .map(p => ({ id: p.id, memberId: p.memberId, questTitle: title(p), pts: p.pts, type: p.type, status: statusOf(p).status, media: `/api/media/${gid}/${p.id}` }))
    : [];

  return json({
    me: member.id,
    group: { id: gid, name: group.name, code: group.code },
    members: members.map(m => ({ id: m.id, name: m.name, color: color(m.id), pts: now.pts[m.id], quests: now.count[m.id], wins: titles[m.id] || [], joinedAt: m.joinedAt })),
    month: { key: month, ...monthInfo(), ranking: now.order },
    week: { number: week, daysToNext: monthInfo().daysToMonday },
    quests,
    toVote,
    feed,
    king: king ? {
      memberId: king.memberId, month: last, pts: king.pts,
      outing: mine.outing,
      theme: mine.theme ? { text: mine.theme.text, at: mine.theme.at } : null,
      special: special ? { to: special.to, title: special.title, pts: special.pts, at: special.at } : null,
      veto: mine.veto && vetoed ? { proofId: vetoed.id, to: vetoed.memberId, questTitle: title(vetoed), status: mine.veto.status, at: mine.veto.at } : null,
      vetoUsed: !!mine.veto,
      vetoable
    } : null,
    myProofs: done.filter(p => p.memberId === member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
      .map(p => ({ id: p.id, questTitle: title(p), type: p.type, status: statusOf(p).status, vetoed: statusOf(p).vetoed, media: `/api/media/${gid}/${p.id}`, createdAt: p.createdAt }))
  });
}

async function accept(req: Request) {
  const { group, member } = await auth(req);
  const { questId } = await req.json().catch(() => ({}));
  const [proposals, special] = await Promise.all([listJSON<Proposal>(`proposals/${group.id}/`), getJSON<Special>(`specials/${group.id}/${monthKey()}`)]);
  if (!questId || !questDefFor(group, member, String(questId), proposals, special)) fail(400, 'quest_gone');
  await data().setJSON(`accepts/${group.id}/${member.id}/${questId}`, { at: new Date().toISOString() });
  return json({ ok: true });
}

async function startProof(req: Request) {
  const { group, member } = await auth(req);
  const body = await req.json().catch(() => ({}));
  const questId = String(body.questId || '');
  const [proposals, special] = await Promise.all([listJSON<Proposal>(`proposals/${group.id}/`), getJSON<Special>(`specials/${group.id}/${monthKey()}`)]);
  const def = questDefFor(group, member, questId, proposals, special);
  if (!def) fail(400, 'quest_gone');
  const type = body.type === 'video' ? 'video' : 'image';
  if (def!.video && type !== 'video') fail(400, 'video_required');
  const mime = String(body.mime || (type === 'video' ? 'video/mp4' : 'image/jpeg')).slice(0, 60);
  if (!/^(image|video)\/[\w.+-]+$/.test(mime)) fail(400, 'bad_format');
  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) fail(400, 'empty_file');
  if (size > MAX_MEDIA) fail(413, 'too_big');
  // A new proof is allowed only after every earlier one for this quest was judged "non vale".
  const g = await loadGame(group.id);
  const earlier = g.proofs.filter(p => p.memberId === member.id && p.questId === questId && p.complete);
  if (earlier.some(p => verdict(p, g).status !== 'rejected')) fail(409, 'already_sent');
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
  const proof = await getJSON<Proof>(`proofs/${group.id}/${pid}`);
  if (!proof || proof.memberId !== member.id) fail(404, 'proof_missing');
  if (proof!.complete) fail(409, 'proof_closed');
  if (!(index >= 0 && index < proof!.chunks)) fail(400, 'bad_piece');
  const buf = await req.arrayBuffer();
  const expected = index === proof!.chunks - 1 ? proof!.size - CHUNK * index : CHUNK;
  if (buf.byteLength !== expected) fail(400, 'short_piece');
  await media().set(`${group.id}/${pid}/${index}`, buf);
  return json({ ok: true });
}
async function completeProof(req: Request, pid: string, later: Later) {
  const { group, member } = await auth(req);
  const s = data();
  const proof = await getJSON<Proof>(`proofs/${group.id}/${pid}`);
  if (!proof || proof.memberId !== member.id) fail(404, 'proof_missing');
  if (proof!.complete) return json({ ok: true });
  const { blobs } = await media().list({ prefix: `${group.id}/${pid}/` });
  if (blobs.length !== proof!.chunks) fail(400, 'incomplete');
  proof!.complete = true;
  await s.setJSON(`proofs/${group.id}/${pid}`, proof);
  const members = await listJSON<Member>(`members/${group.id}/`);
  later(notify(group, members, members.map(m => m.id).filter(id => id !== member.id), 'vota',
    (t, lang) => t.proof(member.name, titleFor(proof!.questId, lang, proof!.questTitle))));
  return json({ ok: true });
}

async function serveMedia(req: Request, gid: string, pid: string) {
  const proof = await getJSON<Proof>(`proofs/${gid}/${pid}`);
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

async function vote(req: Request, later: Later) {
  const { group, member } = await auth(req);
  const { proofId, v } = await req.json().catch(() => ({}));
  if (v !== 'yes' && v !== 'no') fail(400, 'bad_vote');
  const g = await loadGame(group.id);
  const proof = g.proofs.find(p => p.id === proofId);
  if (!proof || !proof.complete) fail(404, 'proof_missing');
  if (proof!.memberId === member.id) fail(400, 'own_vote');
  const before = verdict(proof!, g).status;
  const cast: Vote = { v, at: new Date().toISOString() };
  const { modified } = await data().setJSON(`votes/${group.id}/${proofId}/${member.id}`, cast, { onlyIfNew: true });
  if (!modified) fail(409, 'voted');
  // The vote that settles the proof tells its owner how it went.
  const after = verdict(proof!, { ...g, votes: { ...g.votes, [proof!.id]: { ...g.votes[proof!.id], [member.id]: cast } } }).status;
  if (before === 'pending' && after !== 'pending') {
    later(notify(group, g.members, [proof!.memberId], 'profilo', (t, lang) => {
      const q = titleFor(proof!.questId, lang, proof!.questTitle);
      return after === 'approved' ? t.approved(q, proof!.pts) : t.rejected(q);
    }));
  }
  return json({ ok: true });
}

/* ---------- the king's powers ---------- */
async function setOuting(req: Request, later: Later) {
  const { group, member } = await auth(req);
  const { k, v } = await req.json().catch(() => ({}));
  if (!(OUTING_KEYS as readonly string[]).includes(k)) fail(400, 'outing_kind');
  const value = cleanName(v, 60);
  if (!value) fail(400, 'outing_value');
  const g = await requireKing(group, member);
  const { modified } = await data().setJSON(`outings/${group.id}/${monthKey()}`, { memberId: member.id, k, v: value, at: new Date().toISOString() } satisfies Outing, { onlyIfNew: true });
  if (!modified) fail(409, 'outing_done');
  later(notify(group, g.members, others(g, member.id), 'classifica', (t, lang) => t.outing(member.name, outingWords(lang, k), value)));
  return json({ ok: true });
}
async function setTheme(req: Request, later: Later) {
  const { group, member } = await auth(req);
  const { text } = await req.json().catch(() => ({}));
  const value = cleanName(text, 40);
  if (value.length < 3) fail(400, 'theme_short');
  const g = await requireKing(group, member);
  const { modified } = await data().setJSON(`themes/${group.id}/${monthKey()}`, { memberId: member.id, text: value, at: new Date().toISOString() } satisfies Theme, { onlyIfNew: true });
  if (!modified) fail(409, 'theme_done');
  later(notify(group, g.members, others(g, member.id), 'quest', t => t.theme(member.name, value)));
  return json({ ok: true });
}
async function setSpecial(req: Request, later: Later) {
  const { group, member } = await auth(req);
  const body = await req.json().catch(() => ({}));
  const title = cleanName(body.title, 70);
  const pts = QUEST_PTS.includes(Number(body.pts)) ? Number(body.pts) : 30;
  if (title.length < 4) fail(400, 'proposal_short');
  const g = await requireKing(group, member);
  const to = String(body.to || '');
  if (to === member.id || !g.ids.includes(to)) fail(400, 'special_target');
  const special: Special = { memberId: member.id, to, title, pts, at: new Date().toISOString() };
  const { modified } = await data().setJSON(`specials/${group.id}/${monthKey()}`, special, { onlyIfNew: true });
  if (!modified) fail(409, 'special_done');
  later(notify(group, g.members, [to], 'quest', t => t.special(member.name, title, pts)));
  return json({ ok: true }, 201);
}
// The veto turns the group's verdict on one of this month's proofs the other way round.
async function useVeto(req: Request, later: Later) {
  const { group, member } = await auth(req);
  const { proofId } = await req.json().catch(() => ({}));
  const g = await requireKing(group, member);
  const month = monthKey();
  const proof = g.proofs.find(p => p.id === proofId);
  const base = proof ? verdict(proof, g, { ignoreVeto: true }).status : 'pending';
  if (!proof || !proof.complete || proof.month !== month || proof.memberId === member.id || base === 'pending') fail(400, 'veto_proof');
  const status = base === 'approved' ? 'rejected' : 'approved';
  const { modified } = await data().setJSON(`vetoes/${group.id}/${month}`, { memberId: member.id, proofId: proof!.id, status, at: new Date().toISOString() } satisfies Veto, { onlyIfNew: true });
  if (!modified) fail(409, 'veto_done');
  later(notify(group, g.members, [proof!.memberId], 'profilo', (t, lang) => t.veto(member.name, titleFor(proof!.questId, lang, proof!.questTitle), status === 'approved')));
  return json({ ok: true, status });
}

async function propose(req: Request) {
  const { group, member } = await auth(req);
  const body = await req.json().catch(() => ({}));
  const title = cleanName(body.title, 70);
  const pts = QUEST_PTS.includes(Number(body.pts)) ? Number(body.pts) : 30;
  if (title.length < 4) fail(400, 'proposal_short');
  const month = monthKey();
  const mineThisMonth = (await listJSON<Proposal>(`proposals/${group.id}/`)).filter(p => p.memberId === member.id && p.month === month);
  if (mineThisMonth.length >= 3) fail(400, 'proposal_limit');
  const id = rid(6);
  await data().setJSON(`proposals/${group.id}/${id}`, { id, memberId: member.id, title, pts, createdAt: new Date().toISOString(), month } satisfies Proposal);
  return json({ ok: true, id }, 201);
}

// Leaving deletes the member record, its quest acceptances and the account's link to the group.
async function leave(req: Request) {
  const { group, member, account } = await auth(req);
  const s = data();
  const { blobs } = await s.list({ prefix: `accepts/${group.id}/${member.id}/` });
  await Promise.all(blobs.map(b => s.delete(b.key)));
  await s.delete(`members/${group.id}/${member.id}`);
  if (account) await s.delete(`accountGroups/${account.id}/${group.id}`);
  return json({ ok: true });
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const lang = pickLang(req.headers.get('x-lang') || req.headers.get('accept-language'));
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = `${req.method} ${parts[0] || ''}`;
  const later: Later = p => { if (typeof context?.waitUntil === 'function') context.waitUntil(p); };
  try {
    switch (route) {
      case 'POST groups': return await createGroup(req);
      case 'POST join': return await joinGroup(req, later);
      case 'GET state': return await state(req, lang);
      case 'POST accept': return await accept(req);
      case 'POST votes': return await vote(req, later);
      case 'POST outing': return await setOuting(req, later);
      case 'POST theme': return await setTheme(req, later);
      case 'POST special': return await setSpecial(req, later);
      case 'POST veto': return await useVeto(req, later);
      case 'POST proposals': return await propose(req);
      case 'POST leave': return await leave(req);
      case 'POST proofs':
        if (parts.length === 1) return await startProof(req);
        if (parts[2] === 'complete') return await completeProof(req, parts[1], later);
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

export const config: Config = { path: '/api/*', excludedPath: ['/api/auth/*', '/api/push/*'] };
