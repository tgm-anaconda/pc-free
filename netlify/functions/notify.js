const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY fehlen in den Netlify-Umgebungsvariablen.' }),
    };
  }

  webpush.setVapidDetails(
    'mailto:' + (process.env.CONTACT_EMAIL || 'test@example.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { von, bis } = JSON.parse(event.body || '{}');
  const store = getStore('subscriptions');
  const list = (await store.get('list', { type: 'json' })) || [];

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
  await store.setJSON('list', stillValid);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, sent }),
  };
};
