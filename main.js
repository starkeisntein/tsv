const { app, BrowserWindow, ipcMain, dialog, nativeImage, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

let mainWindow;
let settingsWindow;
let tray;

function createWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
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

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 340,
    height: 420,
    resizable: false,
    frame: true,
    alwaysOnTop: true,
    title: '动态桌面 - 设置',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
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
      label: '设置',
      click: () => createSettingsWindow(),
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

  tray.on('click', () => createSettingsWindow());
}

async function selectBackgroundImage() {
  const targetWindow = settingsWindow || mainWindow;
  const result = await dialog.showOpenDialog(targetWindow, {
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
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('background-changed', filePath);
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('background-changed', filePath);
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
  return { backgroundImage: '', particleCount: 80, particleColor: '#ffffff', particleSpeed: 1.0 };
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
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', settings);
  }
});

ipcMain.handle('get-settings', async () => {
  return loadSettings();
});