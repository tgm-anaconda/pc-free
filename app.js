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

    const subscriptionText = JSON.stringify(subscription);
    document.getElementById('subscriptionBox').value = subscriptionText;
    document.getElementById('subscriptionWrap').style.display = 'block';

    statusEl.textContent = 'Fast fertig! Kopiere den Text unten und schick ihn an die Person, die die Sende-Seite einrichtet.';
    btn.disabled = true;
  } catch (err) {
    statusEl.textContent = 'Fehler: ' + err.message;
  }
}

btn.addEventListener('click', subscribe);

document.getElementById('copyBtn').addEventListener('click', async () => {
  const box = document.getElementById('subscriptionBox');
  box.select();
  try {
    await navigator.clipboard.writeText(box.value);
    statusEl.textContent = 'In die Zwischenablage kopiert!';
  } catch (err) {
    statusEl.textContent = 'Kopieren nicht moeglich, bitte den Text manuell markieren.';
  }
});
