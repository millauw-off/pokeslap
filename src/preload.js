'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  init: () => ipcRenderer.invoke('init'),
  play: (o) => ipcRenderer.invoke('play', o),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  on: (ch, fn) => ipcRenderer.on(ch, (_e, v) => fn(v))
});
