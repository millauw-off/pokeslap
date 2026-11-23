'use strict';
// Usage : node tools/make-manifest.js TON-PSEUDO-GITHUB/NOM-DU-DEPOT
// Parcourt le dossier files/ et produit manifest.json (liste des fichiers + sha1).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cfg = require('../launcher.config.json');

const repo = process.argv[2];
if (!repo || !repo.includes('/')) {
  console.error('Usage : node tools/make-manifest.js TON-PSEUDO-GITHUB/NOM-DU-DEPOT');
  process.exit(1);
}
const root = path.join(__dirname, '..', 'files');
const base = `https://raw.githubusercontent.com/${repo}/main/files/`;

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name !== '.gitkeep') out.push(p);
  }
  return out;
}

const files = walk(root).map((p) => {
  const rel = path.relative(root, p).split(path.sep).join('/');
  const buf = fs.readFileSync(p);
  return {
    path: rel,
    url: base + rel.split('/').map(encodeURIComponent).join('/'),
    size: buf.length,
    sha1: crypto.createHash('sha1').update(buf).digest('hex')
  };
});

// Fichiers trop gros pour le depot (>100 Mo) : listes dans external.json, hebergees dans une Release GitHub.
async function externals() {
  const f = path.join(__dirname, '..', 'external.json');
  if (!fs.existsSync(f)) return [];
  const list = JSON.parse(fs.readFileSync(f, 'utf8'));
  const out = [];
  for (const e of list) {
    const res = await fetch(e.url);
    if (!res.ok) throw new Error('Telechargement impossible (' + res.status + ') : ' + e.url);
    const buf = Buffer.from(await res.arrayBuffer());
    out.push({ path: e.path, url: e.url, size: buf.length, sha1: crypto.createHash('sha1').update(buf).digest('hex') });
  }
  return out;
}

(async () => {
const ext = await externals();
const all = files.concat(ext);
const manifest = {
  minecraft: cfg.minecraft,
  fabricLoader: cfg.fabricLoader,
  server: cfg.server,
  managedDirs: ['mods'],
  files: all
};
fs.writeFileSync(path.join(__dirname, '..', 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(all.length + ' fichier(s) dans manifest.json (dont ' + ext.length + ' externes)');
})().catch((e) => { console.error(e.message); process.exit(1); });
