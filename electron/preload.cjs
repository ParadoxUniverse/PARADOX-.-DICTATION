const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('paradoxDesktop', {
  isDesktop: true,
  platform: process.platform,
  saveAudio: (bytes, suggestedName) => ipcRenderer.invoke('save-audio', { bytes, suggestedName }),
  saveText: (text, suggestedName) => ipcRenderer.invoke('save-text', { text, suggestedName }),
  setWidgetOnClose: (enabled) => ipcRenderer.send('set-widget-on-close', Boolean(enabled)),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onWidgetCommand: (callback) => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on('widget-command', listener);
    return () => ipcRenderer.removeListener('widget-command', listener);
  },
});
