const statusEl = document.getElementById('status');
const btn = document.getElementById('sendBtn');

btn.addEventListener('click', async () => {
  const von = document.getElementById('von').value;
  const bis = document.getElementById('bis').value;

  btn.disabled = true;
  statusEl.textContent = 'Sende...';

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ von, bis }),
    });
    const data = await res.json();

    if (data.sent > 0) {
      statusEl.textContent = 'Nachricht gesendet!';
    } else {
      statusEl.textContent = 'Gesendet, aber noch niemand hat Benachrichtigungen aktiviert.';
    }
  } catch (err) {
    statusEl.textContent = 'Fehler: ' + err.message;
  } finally {
    btn.disabled = false;
  }
});
