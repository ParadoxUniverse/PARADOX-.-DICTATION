const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('paradoxWidget', {
  toggle: () => ipcRenderer.send('widget-toggle'),
  showMain: () => ipcRenderer.send('widget-show-main'),
  close: () => ipcRenderer.send('widget-close'),
  startRecording: () => ipcRenderer.send('widget-start-recording'),
});
