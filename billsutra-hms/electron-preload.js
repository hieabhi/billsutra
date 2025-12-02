const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // License management
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
  activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
  deactivateLicense: () => ipcRenderer.invoke('deactivate-license'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  
  platform: process.platform,
  isElectron: true
});
