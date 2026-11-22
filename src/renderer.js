'use strict';
let mode = 'offline';
const $ = (id) => document.getElementById(id);

function setMode(m) {
  mode = m;
  $('tab-offline').classList.toggle('active', m === 'offline');
  $('tab-ms').classList.toggle('active', m === 'microsoft');
  $('user-row').style.display = m === 'offline' ? 'block' : 'none';
}
$('tab-offline').onclick = () => setMode('offline');
$('tab-ms').onclick = () => setMode('microsoft');
$('folder').onclick = (e) => { e.preventDefault(); window.api.openFolder(); };
$('toggle-log').onclick = (e) => { e.preventDefault(); $('log').hidden = !$('log').hidden; };

window.api.init().then((st) => {
  $('name').textContent = st.name;
  document.title = st.name;
  const s = st.settings || {};
  if (s.username) $('username').value = s.username;
  if (s.ram) $('ram').value = String(s.ram);
  if (s.mode) setMode(s.mode);
});
window.api.on('status', (s) => {
  $('status').textContent = s.text;
  $('fill').style.width = (s.pct || 0) + '%';
});
window.api.on('log', (m) => {
  const l = $('log');
  l.textContent += m + '\n';
  if (l.textContent.length > 20000) l.textContent = l.textContent.slice(-10000);
  l.scrollTop = l.scrollHeight;
});
window.api.on('closed', (code) => {
  $('play').disabled = false;
  $('status').textContent = 'Minecraft est fermé (code ' + code + ').';
});
$('play').onclick = async () => {
  $('error').textContent = '';
  $('play').disabled = true;
  const r = await window.api.play({ mode, username: $('username').value, ram: $('ram').value });
  if (!r.ok) {
    $('error').textContent = r.error;
    $('play').disabled = false;
    $('status').textContent = 'Échec.';
  }
};
