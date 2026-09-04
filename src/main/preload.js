const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todoApp', {
  // Project & Task data API
  loadData: () => ipcRenderer.invoke('todos:load'),
  saveData: (data) => ipcRenderer.invoke('todos:save', data),
  loadTodos: () => ipcRenderer.invoke('todos:load'),
  saveTodos: (data) => ipcRenderer.invoke('todos:save', data),
  exportBackup: (data) => ipcRenderer.invoke('data:export', data),
  importBackup: () => ipcRenderer.invoke('data:import'),

  // Window control API
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onMaximizedChange: (callback) => {
    const handler = (_, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window:maximized-change', handler);
    return () => ipcRenderer.removeListener('window:maximized-change', handler);
  },

  // Desktop Notifications & Reminders
  showNotification: (options) => ipcRenderer.invoke('notification:show', options),
  focusWindow: () => ipcRenderer.invoke('window:focus'),
  onNotificationClick: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('notification:clicked', handler);
    return () => ipcRenderer.removeListener('notification:clicked', handler);
  },

  // Saved URLs & Web Scraping API
  fetchUrlTitle: (url) => ipcRenderer.invoke('url:fetch-title', url),
  openExternalUrl: (url) => ipcRenderer.invoke('url:open-external', url)
});
