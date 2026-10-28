import type { Config } from '@netlify/functions';
import { data, type Group, listJSON } from '../../server/core.ts';
import { kingOf, loadGame, monthInfo, monthKey, weekNumber } from '../../server/game.ts';
import { monthName, notify } from '../../server/notify.ts';

// Runs every morning. On Monday it tells each group the new quests are out;
// on the 1st it announces last month's winner. sent/{gid}/{what} makes sure each goes out once.
const once = async (key: string) => (await data().set(key, new Date().toISOString(), { onlyIfNew: true })).modified;

export default async () => { await remind(new Date()); };

async function remind(now: Date) {
  const { day, dow } = monthInfo(now);
  if (dow !== 0 && day !== 1) return;
  const month = monthKey(now), week = weekNumber(now);
  for (const group of await listJSON<Group>('groups/')) {
    try {
      const g = await loadGame(group.id);
      if (!g.members.length) continue;
      if (dow === 0 && await once(`sent/${group.id}/week-${week}`)) {
        await notify(group, g.members, g.ids, 'quest', t => t.week());
      }
      const king = day === 1 ? kingOf(g, month) : null;
      if (king && await once(`sent/${group.id}/crown-${month}`)) {
        const name = g.members.find(m => m.id === king.memberId)!.name;
        await notify(group, g.members, g.ids.filter(id => id !== king.memberId), 'classifica', (t, lang) => t.crowned(name, monthName(lang, king.month)));
        await notify(group, g.members, [king.memberId], 'classifica', (t, lang) => t.crownedMe(monthName(lang, king.month)));
      }
    } catch (e) {
      console.error('reminders', group.id, e);
    }
  }
}

// 07:00 UTC is 8 or 9 in the morning in Italy.
export const config: Config = { schedule: '0 7 * * *' };
