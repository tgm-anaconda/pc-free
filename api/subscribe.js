const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const subscription = req.body;
  const list = (await redis.get('subscriptions')) || [];

  if (!list.some((s) => s.endpoint === subscription.endpoint)) {
    list.push(subscription);
    await redis.set('subscriptions', list);
  }

  res.status(201).json({ ok: true });
};
