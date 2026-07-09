const webpush = require('web-push');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return res.status(500).json({ ok: false, error: 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY fehlen in den Vercel-Umgebungsvariablen.' });
    }

    if (!process.env.PUSH_SUBSCRIPTION) {
      return res.status(500).json({ ok: false, error: 'PUSH_SUBSCRIPTION fehlt in den Vercel-Umgebungsvariablen. Erst auf der Abo-Seite "Benachrichtigungen aktivieren" ausfuehren und den kopierten Text dort eintragen.' });
    }

    let subscription;
    try {
      subscription = JSON.parse(process.env.PUSH_SUBSCRIPTION);
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'PUSH_SUBSCRIPTION ist kein gueltiges JSON: ' + err.message });
    }

    webpush.setVapidDetails(
      'mailto:' + (process.env.CONTACT_EMAIL || 'test@example.com'),
      process.env.VAPID_PUBLIC_KEY.trim(),
      process.env.VAPID_PRIVATE_KEY.trim()
    );

    const { von, bis } = req.body || {};

    let body = 'Der PC ist jetzt frei.';
    if (von && bis) body = `Der PC ist von ${von} bis ${bis} Uhr frei.`;
    else if (von) body = `Der PC ist ab ${von} Uhr frei.`;

    const payload = JSON.stringify({ title: 'PC ist frei', body });

    await webpush.sendNotification(subscription, payload);

    res.status(200).json({ ok: true, sent: 1 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
