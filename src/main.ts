import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Use __dirname which points to dist/ folder where main.js is
      preload: path.join(__dirname, 'preload.js'),
      // Add these for better compatibility:
      sandbox: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
  
  // Debug: Check if preload loaded
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded');
  });
}

ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });
  return sources;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
