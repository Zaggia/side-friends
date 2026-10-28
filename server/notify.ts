import webpush from 'web-push';
import { data, listJSON, type Member } from './core.ts';
import type { Lang } from './quests.ts';

// Push notifications. Each device that turns them on is stored under push/{accountId}/{deviceId}:
// browsers get Web Push (keys made once and kept in config/vapid), phones get Expo push.
// The notification's title is the group's name, so people in several groups know which one.
export type Device = { id: string; kind: 'web' | 'expo'; lang: Lang; sub?: webpush.PushSubscription; token?: string; at: string };
export type Tab = 'quest' | 'vota' | 'classifica' | 'profilo';

const SUBJECT = 'https://side-friends.netlify.app';
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const s = data();
  const have = await s.get('config/vapid', { type: 'json' });
  if (have) return have;
  // Two first requests at once: only one pair is written, and both read it back.
  await s.setJSON('config/vapid', webpush.generateVAPIDKeys(), { onlyIfNew: true });
  return await s.get('config/vapid', { type: 'json' });
}

const OUTING_WORDS: Record<Lang, Record<string, string>> = {
  it: { eat: 'dove si mangia', do: 'cosa si fa nel weekend', film: 'cosa si vede al cinema' },
  en: { eat: 'where we eat', do: 'what we do at the weekend', film: 'what we watch at the cinema' },
  es: { eat: 'dónde se come', do: 'qué se hace el fin de semana', film: 'qué se ve en el cine' },
  fr: { eat: 'où on mange', do: 'ce qu’on fait le week-end', film: 'ce qu’on voit au cinéma' },
  de: { eat: 'wo gegessen wird', do: 'was am Wochenende gemacht wird', film: 'was im Kino geschaut wird' }
};

const TEXTS = {
  it: {
    proof: (n: string, q: string) => `${n} ha caricato una prova per «${q}». Vale o non vale?`,
    approved: (q: string, pts: number) => `La tua prova per «${q}» vale: +${pts} pt.`,
    rejected: (q: string) => `Il gruppo ha detto che la tua prova per «${q}» non vale. Puoi riprovare.`,
    veto: (k: string, q: string, ok: boolean) => `${k} ha usato il veto sulla tua prova per «${q}»: ora ${ok ? 'vale' : 'non vale'}.`,
    special: (k: string, q: string, pts: number) => `${k} ti ha dato una quest speciale: «${q}» (+${pts} pt).`,
    theme: (k: string, x: string) => `${k} ha scelto il tema del mese: «${x}».`,
    outing: (k: string, what: string, v: string) => `${k} ha scelto ${what}: ${v}.`,
    join: (n: string) => `${n} è entrato nel gruppo.`,
    week: () => 'Sono uscite le quest della settimana. Vai a vederle.',
    crowned: (n: string, m: string) => `${n} ha vinto ${m}. Questo mese sceglie una cosa dell’uscita e ha i poteri del re.`,
    crownedMe: (m: string) => `Hai vinto ${m}! Apri la Classifica per scegliere l’uscita e usare i tuoi poteri.`
  },
  en: {
    proof: (n: string, q: string) => `${n} sent proof for “${q}”. Does it count?`,
    approved: (q: string, pts: number) => `Your proof for “${q}” counts: +${pts} pt.`,
    rejected: (q: string) => `The group says your proof for “${q}” doesn’t count. You can try again.`,
    veto: (k: string, q: string, ok: boolean) => `${k} used the veto on your proof for “${q}”: now it ${ok ? 'counts' : 'doesn’t count'}.`,
    special: (k: string, q: string, pts: number) => `${k} gave you a special quest: “${q}” (+${pts} pt).`,
    theme: (k: string, x: string) => `${k} picked the theme of the month: “${x}”.`,
    outing: (k: string, what: string, v: string) => `${k} chose ${what}: ${v}.`,
    join: (n: string) => `${n} joined the group.`,
    week: () => 'This week’s quests are out. Go and have a look.',
    crowned: (n: string, m: string) => `${n} won ${m}. This month they pick one thing for the hangout and hold the king’s powers.`,
    crownedMe: (m: string) => `You won ${m}! Open the Leaderboard to pick the hangout and use your powers.`
  },
  es: {
    proof: (n: string, q: string) => `${n} ha subido una prueba para «${q}». ¿Vale o no vale?`,
    approved: (q: string, pts: number) => `Tu prueba para «${q}» vale: +${pts} pt.`,
    rejected: (q: string) => `El grupo dice que tu prueba para «${q}» no vale. Puedes volver a intentarlo.`,
    veto: (k: string, q: string, ok: boolean) => `${k} ha usado el veto en tu prueba para «${q}»: ahora ${ok ? 'vale' : 'no vale'}.`,
    special: (k: string, q: string, pts: number) => `${k} te ha dado una quest especial: «${q}» (+${pts} pt).`,
    theme: (k: string, x: string) => `${k} ha elegido el tema del mes: «${x}».`,
    outing: (k: string, what: string, v: string) => `${k} ha elegido ${what}: ${v}.`,
    join: (n: string) => `${n} ha entrado en el grupo.`,
    week: () => 'Ya han salido las quests de la semana. Échales un vistazo.',
    crowned: (n: string, m: string) => `${n} ha ganado ${m}. Este mes elige una cosa de la quedada y tiene los poderes del rey.`,
    crownedMe: (m: string) => `¡Has ganado ${m}! Abre la Clasificación para elegir la quedada y usar tus poderes.`
  },
  fr: {
    proof: (n: string, q: string) => `${n} a envoyé une preuve pour « ${q} ». Ça compte ou pas ?`,
    approved: (q: string, pts: number) => `Ta preuve pour « ${q} » compte : +${pts} pt.`,
    rejected: (q: string) => `Le groupe dit que ta preuve pour « ${q} » ne compte pas. Tu peux réessayer.`,
    veto: (k: string, q: string, ok: boolean) => `${k} a utilisé son veto sur ta preuve pour « ${q} » : maintenant elle ${ok ? 'compte' : 'ne compte pas'}.`,
    special: (k: string, q: string, pts: number) => `${k} t’a donné une quête spéciale : « ${q} » (+${pts} pt).`,
    theme: (k: string, x: string) => `${k} a choisi le thème du mois : « ${x} ».`,
    outing: (k: string, what: string, v: string) => `${k} a choisi ${what} : ${v}.`,
    join: (n: string) => `${n} a rejoint le groupe.`,
    week: () => 'Les quêtes de la semaine sont sorties. Va voir.',
    crowned: (n: string, m: string) => `${n} a gagné ${m}. Ce mois-ci, c’est à ${n} de choisir une chose de la sortie, avec les pouvoirs du roi.`,
    crownedMe: (m: string) => `Tu as gagné ${m} ! Ouvre le Classement pour choisir la sortie et utiliser tes pouvoirs.`
  },
  de: {
    proof: (n: string, q: string) => `${n} hat einen Beweis für „${q}“ hochgeladen. Zählt es oder nicht?`,
    approved: (q: string, pts: number) => `Dein Beweis für „${q}“ zählt: +${pts} P.`,
    rejected: (q: string) => `Die Gruppe sagt, dein Beweis für „${q}“ zählt nicht. Du kannst es noch mal versuchen.`,
    veto: (k: string, q: string, ok: boolean) => `${k} hat ein Veto gegen deinen Beweis für „${q}“ eingelegt: Jetzt ${ok ? 'zählt er' : 'zählt er nicht'}.`,
    special: (k: string, q: string, pts: number) => `${k} hat dir eine Spezial-Quest gegeben: „${q}“ (+${pts} P).`,
    theme: (k: string, x: string) => `${k} hat das Thema des Monats gewählt: „${x}“.`,
    outing: (k: string, what: string, v: string) => `${k} hat entschieden, ${what}: ${v}.`,
    join: (n: string) => `${n} ist der Gruppe beigetreten.`,
    week: () => 'Die Quests der Woche sind da. Schau sie dir an.',
    crowned: (n: string, m: string) => `${n} hat den ${m} gewonnen. Diesen Monat entscheidet ${n} eine Sache beim Treffen und hat die Kräfte des Königs.`,
    crownedMe: (m: string) => `Du hast den ${m} gewonnen! Öffne die Rangliste, um das Treffen zu wählen und deine Kräfte zu nutzen.`
  }
} satisfies Record<Lang, Record<string, (...a: never[]) => string>>;
export type Texts = (typeof TEXTS)['it'];
export const outingWords = (lang: Lang, k: string) => OUTING_WORDS[lang][k] ?? k;
export const monthName = (lang: Lang, key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat({ it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' }[lang], { month: 'long', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, 15));
};

type Msg = { title: string; body: string; data: { groupId: string; tab: Tab } };

// Sends one notification to each device of the given members, in each device's language.
// Failures never reach the caller; devices the push service says are gone are forgotten.
export async function notify(group: { id: string; name: string }, members: Member[], to: string[], tab: Tab, text: (t: Texts, lang: Lang) => string) {
  try {
    const accounts = [...new Set(members.filter(m => to.includes(m.id) && m.accountId).map(m => m.accountId!))];
    const devices = (await Promise.all(accounts.map(async aid => (await listJSON<Device>(`push/${aid}/`)).map(d => ({ aid, d }))))).flat();
    if (!devices.length) return;
    const msg = (d: Device): Msg => ({ title: group.name, body: text(TEXTS[d.lang] ?? TEXTS.it, d.lang), data: { groupId: group.id, tab } });
    const forget = (aid: string, d: Device) => data().delete(`push/${aid}/${d.id}`);

    const web = devices.filter(x => x.d.kind === 'web' && x.d.sub);
    if (web.length) {
      const keys = await vapidKeys();
      await Promise.all(web.map(async ({ aid, d }) => {
        try {
          await webpush.sendNotification(d.sub!, JSON.stringify(msg(d)), {
            vapidDetails: { subject: SUBJECT, publicKey: keys.publicKey, privateKey: keys.privateKey }, TTL: 60 * 60 * 24, timeout: 8000
          });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await forget(aid, d);
          else console.error('web push', code ?? e);
        }
      }));
    }

    const expo = devices.filter(x => x.d.kind === 'expo' && x.d.token);
    if (expo.length) {
      const res = await fetch(EXPO_PUSH, {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify(expo.map(({ d }) => ({ to: d.token, sound: 'default', channelId: 'default', ...msg(d) })))
      });
      const out = await res.json().catch(() => null) as { data?: { status: string; details?: { error?: string } }[] } | null;
      await Promise.all((out?.data ?? []).map((r, i) => r.details?.error === 'DeviceNotRegistered' ? forget(expo[i].aid, expo[i].d) : null));
    }
  } catch (e) {
    console.error('notify', e);
  }
}
