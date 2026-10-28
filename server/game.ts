import { data, listJSON, type Member } from './core.ts';

// The rules of the game, shared by the API and the scheduled reminders:
// dates in Italian time, how a proof is judged, and how the month's ranking comes out.
const TZ = 'Europe/Rome';

export type Proof = {
  id: string; memberId: string; questId: string; questTitle: string; pts: number; icon: string;
  week: string; month: string; type: 'image' | 'video'; mime: string; size: number; chunks: number;
  note: string; createdAt: string; complete: boolean;
};
export type Vote = { v: 'yes' | 'no'; at: string };
export type Status = 'pending' | 'approved' | 'rejected';
// The king's powers, one of each per month, stored under {kind}/{gid}/{month}.
export type Outing = { memberId: string; k: string; v: string; at: string };
export type Theme = { memberId: string; text: string; at: string };
export type Special = { memberId: string; to: string; title: string; pts: number; at: string };
export type Veto = { memberId: string; proofId: string; status: 'approved' | 'rejected'; at: string };

/* ---------- dates in Italian time ---------- */
export function romeParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day };
}
export const monthKey = (d = new Date()) => { const p = romeParts(d); return `${p.y}-${String(p.m).padStart(2, '0')}`; };
export function prevMonth(key: string) { const [y, m] = key.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; }
// Monday-based week number counted from a fixed Monday, in Rome's calendar.
export function weekNumber(d = new Date()) {
  const p = romeParts(d);
  const days = Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
  return Math.floor((days - 4) / 7); // 1970-01-05 was a Monday (day 4)
}
export function monthInfo(d = new Date()) {
  const p = romeParts(d);
  const days = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const dow = (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7; // 0 = Monday
  return { day: p.d, days, dow, daysToMonday: 7 - dow };
}

/* ---------- loading ---------- */
export async function listVotes(gid: string) {
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

// Everything needed to judge proofs and rank the group. Only current members count.
export async function loadGame(gid: string) {
  const [members, allProofs, votes, vetoList] = await Promise.all([
    listJSON<Member>(`members/${gid}/`),
    listJSON<Proof>(`proofs/${gid}/`),
    listVotes(gid),
    listJSON<Veto>(`vetoes/${gid}/`)
  ]);
  members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const ids = members.map(m => m.id);
  const proofs = allProofs.filter(p => ids.includes(p.memberId));
  const vetoes: Record<string, Veto> = Object.fromEntries(vetoList.map(v => [v.proofId, v]));
  return { members, ids, proofs, votes, vetoes };
}
export type Game = Awaited<ReturnType<typeof loadGame>>;

/* ---------- rules ---------- */
// A proof needs at least half of the other members to say "vale", and more yes than no.
// With nobody else in the group it counts straight away, so one person can try the app alone.
// The king's veto overrides whatever the group decided.
export function verdict(p: Proof, g: Pick<Game, 'votes' | 'ids' | 'vetoes'>, opts: { ignoreVeto?: boolean } = {}) {
  const others = g.ids.filter(id => id !== p.memberId);
  const vs = Object.entries(g.votes[p.id] || {}).filter(([mid]) => others.includes(mid)).map(([, v]) => v.v);
  const yes = vs.filter(v => v === 'yes').length, no = vs.length - yes;
  const need = Math.ceil(others.length / 2);
  const veto = opts.ignoreVeto ? undefined : g.vetoes[p.id];
  const out = (status: Status) => ({ status, yes, no, need, vetoed: !!veto });
  if (veto) return out(veto.status);
  if (others.length === 0) return out('approved');
  if (yes >= need && yes > no) return out('approved');
  if (no >= need && no >= yes) return out('rejected');
  if (vs.length === others.length) return out(yes > no ? 'approved' : 'rejected');
  return out('pending');
}
export function standings(month: string, g: Game) {
  const pts: Record<string, number> = {}, count: Record<string, number> = {};
  g.ids.forEach(id => { pts[id] = 0; count[id] = 0; });
  for (const p of g.proofs) {
    if (p.month !== month || !p.complete) continue;
    if (verdict(p, g).status === 'approved') { pts[p.memberId] += p.pts; count[p.memberId] += 1; }
  }
  const joined = (id: string) => g.members.find(m => m.id === id)!.joinedAt;
  const order = [...g.ids].sort((a, b) => pts[b] - pts[a] || count[b] - count[a] || joined(a).localeCompare(joined(b)));
  return { pts, count, order };
}
// Last month's winner, who holds this month's powers; nobody if nobody scored.
export function kingOf(g: Game, month = monthKey()) {
  const before = standings(prevMonth(month), g);
  const id = before.order[0];
  return id && before.pts[id] > 0 ? { memberId: id, month: prevMonth(month), pts: before.pts[id] } : null;
}
