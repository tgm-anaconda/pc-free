const statusEl = document.getElementById('status');
const btn = document.getElementById('enableBtn');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    statusEl.textContent = 'Push-Benachrichtigungen werden auf diesem Geraet/Browser nicht unterstuetzt.';
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      statusEl.textContent = 'Benachrichtigungen wurden nicht erlaubt.';
      return;
    }

    const keyRes = await fetch('/api/vapid-key');
    const { publicKey } = await keyRes.json();

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    statusEl.textContent = 'Fertig! Du bekommst jetzt Bescheid, wenn der PC frei ist.';
    btn.disabled = true;
  } catch (err) {
    statusEl.textContent = 'Fehler: ' + err.message;
  }
}

btn.addEventListener('click', subscribe);
