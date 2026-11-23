'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

function sha1File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha1');
    const s = fs.createReadStream(file);
    s.on('error', reject);
    s.on('data', d => h.update(d));
    s.on('end', () => resolve(h.digest('hex')));
  });
}

function request(url, redirects = 8) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'PokeSlap-Launcher', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        resolve(request(new URL(res.headers.location, url).toString(), redirects - 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode + ' pour ' + url));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Delai depasse : ' + url)));
  });
}

async function fetchJson(url, bust = false) {
  const res = await request(bust ? url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() : url);
  const chunks = [];
  for await (const c of res) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function download(url, dest, onBytes) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  const tmp = dest + '.part';
  const res = await request(url);
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(tmp);
    res.on('data', c => onBytes && onBytes(c.length));
    res.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    res.pipe(out);
  });
  await fsp.rename(tmp, dest);
}

/** Chemin sous root, sans pouvoir sortir du dossier. */
function safeJoin(root, rel) {
  const full = path.resolve(root, rel);
  const base = path.resolve(root) + path.sep;
  if (!full.startsWith(base)) throw new Error('Chemin refuse : ' + rel);
  return full;
}

module.exports = { sha1File, fetchJson, download, safeJoin, request };
