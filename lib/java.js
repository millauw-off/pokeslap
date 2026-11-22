'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const extract = require('extract-zip');
const { download } = require('./util');

async function findJavaw(dir) {
  const names = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of names) {
    if (!e.isDirectory()) continue;
    const exe = path.join(dir, e.name, 'bin', process.platform === 'win32' ? 'javaw.exe' : 'java');
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

/** Java 21 prive pour le jeu (Windows) : telecharge un JRE Temurin si absent. */
async function ensureJava(gameDir, major, progress) {
  if (process.platform !== 'win32') return 'java';
  const dir = path.join(gameDir, 'runtime', 'jre' + major);
  const found = await findJavaw(dir);
  if (found) return found;
  progress({ text: `Telechargement de Java ${major} (une seule fois)...`, pct: 5 });
  const zip = path.join(gameDir, 'runtime', `jre${major}.zip`);
  const url = `https://api.adoptium.net/v3/binary/latest/${major}/ga/windows/x64/jre/hotspot/normal/eclipse`;
  await download(url, zip);
  progress({ text: 'Installation de Java...', pct: 40 });
  await fsp.rm(dir, { recursive: true, force: true });
  await extract(zip, { dir });
  await fsp.rm(zip, { force: true });
  const exe = await findJavaw(dir);
  if (!exe) throw new Error('Java introuvable apres installation');
  return exe;
}

module.exports = { ensureJava };
