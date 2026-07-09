const webpush = require('web-push');
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ ok: false, error: 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY fehlen in den Vercel-Umgebungsvariablen.' });
  }

  webpush.setVapidDetails(
    'mailto:' + (process.env.CONTACT_EMAIL || 'test@example.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { von, bis } = req.body || {};
  const list = (await redis.get('subscriptions')) || [];

  let body = 'Der PC ist jetzt frei.';
  if (von && bis) body = `Der PC ist von ${von} bis ${bis} Uhr frei.`;
  else if (von) body = `Der PC ist ab ${von} Uhr frei.`;

  const payload = JSON.stringify({ title: 'PC ist frei', body });

  let sent = 0;
  const stillValid = [];
  for (const sub of list) {
    try {
      await webpush.sendNotification(sub, payload);
      stillValid.push(sub);
      sent++;
    } catch (err) {
      // Abo ist abgelaufen/ungueltig -> wird nicht wieder aufgenommen
    }
  }
  await redis.set('subscriptions', stillValid);

  res.status(200).json({ ok: true, sent });
};
