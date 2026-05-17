const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectBackground: () => ipcRenderer.invoke('select-background'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onBackgroundChanged: (callback) => {
    ipcRenderer.on('background-changed', (event, filePath) => callback(filePath));
  },
  onSettingsLoaded: (callback) => {
    ipcRenderer.on('settings-loaded', (event, settings) => callback(settings));
  },
});