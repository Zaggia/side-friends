import type { Config, Context } from '@netlify/functions';
import { pickLang } from '../../server/quests.ts';
import { message } from '../../server/messages.ts';
import { authAccount, data, fail, HttpError, json, sha256 } from '../../server/core.ts';
import { type Device, vapidKeys } from '../../server/notify.ts';

// Turning notifications on and off for one device of the signed-in account.
async function register(req: Request) {
  const { account } = await authAccount(req);
  const body = await req.json().catch(() => ({}));
  const lang = pickLang(req.headers.get('x-lang'));
  let device: Device;
  if (body.kind === 'web') {
    const sub = body.sub;
    const ok = sub && typeof sub.endpoint === 'string' && /^https:\/\//.test(sub.endpoint) && sub.endpoint.length < 1000 &&
      typeof sub.keys?.p256dh === 'string' && typeof sub.keys?.auth === 'string';
    if (!ok) fail(400, 'push_bad');
    const clean = { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh).slice(0, 200), auth: String(sub.keys.auth).slice(0, 100) } };
    device = { id: (await sha256(clean.endpoint)).slice(0, 20), kind: 'web', lang, sub: clean, at: new Date().toISOString() };
  } else if (body.kind === 'expo') {
    const token = String(body.token || '');
    if (!/^Expo(nent)?PushToken\[[\w-]+\]$/.test(token)) fail(400, 'push_bad');
    device = { id: (await sha256(token)).slice(0, 20), kind: 'expo', lang, token, at: new Date().toISOString() };
  } else return fail(400, 'push_bad');
  await data().setJSON(`push/${account.id}/${device!.id}`, device!);
  return json({ deviceId: device!.id });
}
async function unregister(req: Request, id: string) {
  const { account } = await authAccount(req);
  await data().delete(`push/${account.id}/${id.replace(/[^a-f0-9]/g, '')}`);
  return json({ ok: true });
}

export default async (req: Request, _context: Context) => {
  const lang = pickLang(req.headers.get('x-lang'));
  const parts = new URL(req.url).pathname.replace(/^\/api\/push\/?/, '').split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && parts[0] === 'key') return json({ publicKey: (await vapidKeys()).publicKey });
    if (req.method === 'POST' && parts[0] === 'devices') return await register(req);
    if (req.method === 'DELETE' && parts[0] === 'devices' && parts[1]) return await unregister(req, parts[1]);
    return json({ error: message(lang, 'not_found'), code: 'not_found' }, 404);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: message(lang, e.key), code: e.key }, e.status);
    console.error(e);
    return json({ error: message(lang, 'server'), code: 'server' }, 500);
  }
};

export const config: Config = { path: '/api/push/*' };
