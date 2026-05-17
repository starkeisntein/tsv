const { app, BrowserWindow, ipcMain, dialog, nativeImage, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

let mainWindow;
let tray;

function createWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    type: 'desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      },
    },
    { type: 'separator' },
    {
      label: '选择背景图片',
      click: () => selectBackgroundImage(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('动态桌面');
  tray.setContextMenu(contextMenu);
}

async function selectBackgroundImage() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const settings = loadSettings();
    settings.backgroundImage = filePath;
    saveSettings(settings);
    if (mainWindow) {
      mainWindow.webContents.send('background-changed', filePath);
    }
  }
}

function loadSettings() {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }
  return { backgroundImage: '', particleCount: 80, particleColor: '#ffffff' };
}

function saveSettings(settings) {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('保存设置失败:', e);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  const settings = loadSettings();
  mainWindow.webContents.on('did-finish-load', () => {
    if (settings.backgroundImage) {
      mainWindow.webContents.send('background-changed', settings.backgroundImage);
    }
    mainWindow.webContents.send('settings-loaded', settings);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

ipcMain.handle('select-background', async () => {
  await selectBackgroundImage();
});

ipcMain.handle('get-system-info', async () => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    platform: os.platform(),
    release: os.release(),
    hostname: os.hostname(),
    cpuModel: cpus.length > 0 ? cpus[0].model : 'N/A',
    cpuCores: cpus.length,
    cpuUsage: 0,
    totalMem: totalMem,
    usedMem: usedMem,
    freeMem: freeMem,
    memUsagePercent: ((usedMem / totalMem) * 100).toFixed(1),
    uptime: os.uptime(),
    arch: os.arch(),
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  saveSettings(settings);
});

ipcMain.handle('get-settings', async () => {
  return loadSettings();
});