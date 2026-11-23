'use strict';
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client, Authenticator } = require('minecraft-launcher-core');
const cfg = require('../launcher.config.json');
const { fetchJson } = require('../lib/util');
const { syncFiles } = require('../lib/sync');
const { ensureJava } = require('../lib/java');
const { ensureFabric } = require('../lib/fabric');
const { enableResourcePacks } = require('../lib/options');

const GAME_DIR = path.join(app.getPath('appData'), '.pokeslap');
const SETTINGS = path.join(GAME_DIR, 'launcher-settings.json');
let win = null;
let busy = false;

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch (e) { return {}; }
}
function saveSettings(s) {
  fs.mkdirSync(GAME_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2));
}
function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}
const status = (o) => send('status', o);

function createWindow() {
  win = new BrowserWindow({
    width: 920, height: 560, resizable: false, autoHideMenuBar: true, backgroundColor: '#1b0f33',
    title: cfg.name,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.handle('init', () => ({
  name: cfg.name,
  version: app.getVersion(),
  server: cfg.server,
  settings: loadSettings()
}));

ipcMain.handle('open-folder', () => shell.openPath(GAME_DIR));

async function authorize(mode, username) {
  if (mode === 'microsoft') {
    status({ text: 'Connexion Microsoft...', pct: 2 });
    const { Auth } = require('msmc');
    const auth = new Auth('select_account');
    const xbox = await auth.launch('electron');
    const mc = await xbox.getMinecraft();
    return mc.mclc();
  }
  const name = (username || '').trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
    throw new Error('Pseudo invalide : 3 a 16 caracteres (lettres, chiffres, _).');
  }
  return Authenticator.getAuth(name);
}

ipcMain.handle('play', async (_e, opts) => {
  if (busy) return { ok: false, error: 'Deja en cours.' };
  busy = true;
  try {
    const ram = Math.max(2, Math.min(16, parseInt(opts.ram, 10) || 6));
    saveSettings({ username: opts.username || '', mode: opts.mode, ram });
    const authorization = await authorize(opts.mode, opts.username);

    status({ text: 'Lecture de la liste des fichiers...', pct: 3 });
    const manifest = await fetchJson(cfg.manifestUrl, true);
    send('log', 'Liste des fichiers : ' + (manifest.files || []).length + ' fichier(s)');
    status({ text: 'Liste des fichiers : ' + (manifest.files || []).length + ' fichier(s)', pct: 4 });
    const mc = manifest.minecraft || cfg.minecraft;
    const loader = manifest.fabricLoader || cfg.fabricLoader;
    const server = manifest.server || cfg.server;

    const javaPath = await ensureJava(GAME_DIR, cfg.javaMajor, status);
    status({ text: 'Preparation de Fabric...', pct: 45 });
    const versionId = await ensureFabric(GAME_DIR, mc, loader);
    await syncFiles(manifest, GAME_DIR, status);
    try { enableResourcePacks(GAME_DIR, manifest.resourcePacks); } catch (e) { send('log', 'options.txt : ' + e.message); }

    status({ text: 'Lancement de Minecraft...', pct: 100 });
    const launcher = new Client();
    const launchOpts = {
      authorization,
      root: GAME_DIR,
      javaPath,
      version: { number: mc, type: 'release', custom: versionId },
      memory: { max: ram + 'G', min: '2G' },
      customLaunchArgs: ['--quickPlayMultiplayer', `${server.host}:${server.port}`]
    };
    launcher.on('progress', (p) => status({ text: `Minecraft : ${p.type} ${p.task}/${p.total}`, pct: Math.round((p.task / Math.max(1, p.total)) * 100) }));
    launcher.on('debug', (m) => send('log', String(m)));
    launcher.on('data', (m) => send('log', String(m)));
    launcher.on('close', (code) => {
      busy = false;
      send('closed', code);
    });
    const proc = await launcher.launch(launchOpts);
    if (!proc) throw new Error('Minecraft n\'a pas pu demarrer (voir le journal).');
    if (win && !win.isDestroyed()) win.minimize();
    return { ok: true };
  } catch (e) {
    busy = false;
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
});
