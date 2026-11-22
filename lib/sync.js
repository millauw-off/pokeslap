'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { sha1File, download, safeJoin } = require('./util');

/**
 * Met le dossier de jeu en conformite avec le manifest :
 *  - telecharge les fichiers manquants ou modifies (sha1)
 *  - supprime les .jar en trop dans les dossiers geres (par defaut : mods)
 */
async function syncFiles(manifest, gameDir, progress) {
  const files = manifest.files || [];
  const managed = manifest.managedDirs || ['mods'];
  const todo = [];
  let totalBytes = 0;
  progress({ text: 'Verification des fichiers...', pct: 0 });
  for (const f of files) {
    const dest = safeJoin(gameDir, f.path);
    let ok = false;
    try {
      const st = await fsp.stat(dest);
      ok = st.size === f.size && (await sha1File(dest)) === f.sha1;
    } catch (e) { ok = false; }
    if (!ok) { todo.push({ f, dest }); totalBytes += f.size || 0; }
  }
  let done = 0;
  for (let i = 0; i < todo.length; i++) {
    const { f, dest } = todo[i];
    await download(f.url, dest, n => {
      done += n;
      const pct = totalBytes ? Math.min(99, Math.round((done / totalBytes) * 100)) : 50;
      progress({ text: `Telechargement ${i + 1}/${todo.length} : ${path.basename(f.path)}`, pct });
    });
    const got = await sha1File(dest);
    if (f.sha1 && got !== f.sha1) {
      await fsp.rm(dest, { force: true });
      throw new Error('Fichier corrompu : ' + f.path);
    }
  }
  // nettoyage des .jar en trop
  const wanted = new Set(files.map(f => path.resolve(gameDir, f.path)));
  let removed = 0;
  for (const dir of managed) {
    const full = safeJoin(gameDir, dir);
    let names = [];
    try { names = await fsp.readdir(full); } catch (e) { continue; }
    for (const n of names) {
      const p = path.join(full, n);
      if (n.toLowerCase().endsWith('.jar') && !wanted.has(p)) {
        await fsp.rm(p, { force: true });
        removed++;
      }
    }
  }
  progress({ text: 'Fichiers a jour.', pct: 100 });
  return { downloaded: todo.length, removed };
}

module.exports = { syncFiles };
