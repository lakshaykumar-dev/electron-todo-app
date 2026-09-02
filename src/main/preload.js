const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todoApp', {
  // Project & Task data API
  loadData: () => ipcRenderer.invoke('todos:load'),
  saveData: (data) => ipcRenderer.invoke('todos:save', data),
  loadTodos: () => ipcRenderer.invoke('todos:load'),
  saveTodos: (data) => ipcRenderer.invoke('todos:save', data),

  // Window control API
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onMaximizedChange: (callback) => {
    const handler = (_, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window:maximized-change', handler);
    return () => ipcRenderer.removeListener('window:maximized-change', handler);
  }
});
