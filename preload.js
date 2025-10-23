// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('electronAPI', {
  // You can define functions here that your web code can call.
  // Example: send: (channel, data) => ipcRenderer.send(channel, data)
});

console.log('Preload script loaded.');