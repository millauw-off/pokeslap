'use strict';
const fs = require('fs');
const path = require('path');

/** Active les packs de ressources du manifest dans options.txt (cree le fichier si besoin). */
function enableResourcePacks(gameDir, names) {
  if (!names || !names.length) return;
  const file = path.join(gameDir, 'options.txt');
  let lines = [];
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.length); } catch (e) { lines = []; }
  let idx = lines.findIndex((l) => l.startsWith('resourcePacks:'));
  let list = ['vanilla'];
  if (idx >= 0) {
    try { list = JSON.parse(lines[idx].slice('resourcePacks:'.length)); } catch (e) { list = ['vanilla']; }
  }
  let changed = false;
  for (const n of names) {
    const id = 'file/' + n;
    if (!list.includes(id)) { list.push(id); changed = true; }
  }
  if (!changed && idx >= 0) return;
  const line = 'resourcePacks:' + JSON.stringify(list);
  if (idx >= 0) lines[idx] = line; else lines.push(line);
  fs.mkdirSync(gameDir, { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

module.exports = { enableResourcePacks };
