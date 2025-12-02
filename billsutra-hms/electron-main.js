const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { startServer, stopServer } = require('./electron-server');
const LicenseManager = require('./electron-license');

let mainWindow;
let licenseManager;
let serverStarted = false;

// Disable automatic downloading of updates
autoUpdater.autoDownload = false;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      devTools: true
    },
    autoHideMenuBar: false,
    backgroundColor: '#1e1e2e',
    show: true,
    title: 'BillSutra Hotel Management',
    center: true,
    frame: true
  });

  // Prevent window from closing on unhandled errors
  mainWindow.webContents.on('crashed', (event) => {
    console.error('[Electron] Renderer process crashed:', event);
    const options = {
      type: 'error',
      title: 'Renderer Crashed',
      message: 'The application has crashed. Do you want to reload?',
      buttons: ['Reload', 'Close']
    };
    dialog.showMessageBox(options).then((result) => {
      if (result.response === 0) {
        mainWindow.reload();
      } else {
        app.quit();
      }
    });
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] Failed to load:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Electron] Render process gone:', details);
  });

  // Prevent unhandled errors from closing the window
  process.on('uncaughtException', (error) => {
    console.error('[Electron] Uncaught exception:', error);
  });

  // Load from server URL instead of file:// to fix asset loading
  const serverURL = 'http://localhost:5051';
  console.log('[Electron] Loading frontend from:', serverURL);
  
  // Disable cache to always load fresh version
  mainWindow.webContents.session.clearCache();
  
  try {
    await mainWindow.loadURL(serverURL, { 
      extraHeaders: 'pragma: no-cache\n'
    });
    console.log('[Electron] Frontend loaded successfully');
    
    // Open DevTools to see errors
    mainWindow.webContents.openDevTools();
    
    // Log any console errors
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (level === 3) { // Error level
        console.error('[Renderer Error]', message, 'at', sourceId, ':', line);
      }
    });
    
  } catch (error) {
    console.error('[Electron] Failed to load frontend:', error);
    mainWindow.loadURL(`data:text/html,
      <html>
        <body style="background: #1e1e2e; color: white; padding: 40px; font-family: Arial;">
          <h1>Error Loading Application</h1>
          <p>Failed to load the frontend. Please check the console for details.</p>
          <pre>${error.message}</pre>
        </body>
      </html>
    `);
  }

  mainWindow.on('closed', () => {
    console.log('[Electron] Main window closed');
    mainWindow = null;
  });
  
  // Prevent accidental close
  mainWindow.on('close', (event) => {
    console.log('[Electron] Window attempting to close');
  });
}

function showActivationWindow() {
  const activationWindow = new BrowserWindow({
    width: 600,
    height: 550,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    backgroundColor: '#667eea',
    title: 'Activate BillSutra'
  });

  // Load the activation HTML file
  activationWindow.loadFile(path.join(__dirname, 'activation.html'));
  
  activationWindow.on('closed', () => {
    // If activation window is closed without activation, quit app
    const licenseInfo = licenseManager.getLicenseInfo();
    if (!licenseInfo || !licenseInfo.activated) {
      app.quit();
    }
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version ${info.version} is available!`,
    buttons: ['Download Update', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('App is up to date');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.setProgressBar(-1); // Remove progress bar
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to install the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});

app.on('window-all-closed', async () => {
  console.log('[Electron] All windows closed');
  // Stop server process
  await stopServer();
  
  if (process.platform !== 'darwin') {
    console.log('[Electron] Quitting app in 2 seconds...');
    setTimeout(() => {
      app.quit();
    }, 2000);
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

// License management IPC handlers
ipcMain.handle('get-machine-id', () => {
  return licenseManager.getMachineId();
});

ipcMain.handle('get-license-info', () => {
  return licenseManager.getLicenseInfo();
});

ipcMain.handle('activate-license', async (event, licenseKey) => {
  return licenseManager.activate(licenseKey);
});

ipcMain.handle('deactivate-license', async () => {
  return licenseManager.deactivate();
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.quit();
});

// Initialize app
app.whenReady().then(async () => {
  try {
    // Initialize license manager
    licenseManager = new LicenseManager();
    
    // Check license and show appropriate window
    const validation = licenseManager.validateCurrentLicense();
    
    if (!validation.valid) {
      // No license or invalid license - show activation window
      showActivationWindow();
    } else {
      // Valid license - start the app
      await startServer();
      serverStarted = true;
      await createWindow();
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    dialog.showErrorBox('Initialization Error', error.message);
    app.quit();
  }
});
