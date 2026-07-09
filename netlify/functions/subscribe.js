const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const subscription = JSON.parse(event.body);
  const store = getStore('subscriptions');
  const list = (await store.get('list', { type: 'json' })) || [];

  if (!list.some((s) => s.endpoint === subscription.endpoint)) {
    list.push(subscription);
    await store.setJSON('list', list);
  }

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
