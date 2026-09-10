const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('paradoxDesktop', {
  isDesktop: true,
  platform: process.platform,
  saveAudio: (bytes, suggestedName) => ipcRenderer.invoke('save-audio', { bytes, suggestedName }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
