'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { fetchJson } = require('./util');

/** Prepare le profil Fabric (version json) dans versions/. Retourne l'identifiant de version. */
async function ensureFabric(gameDir, mc, loader) {
  const id = `fabric-loader-${loader}-${mc}`;
  const file = path.join(gameDir, 'versions', id, id + '.json');
  if (!fs.existsSync(file)) {
    const json = await fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${mc}/${loader}/profile/json`);
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, JSON.stringify(json));
  }
  return id;
}

module.exports = { ensureFabric };
