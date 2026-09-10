const { app, BrowserWindow, session, ipcMain, shell, Tray, Menu, nativeImage, globalShortcut, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
const gotSingleInstanceLock = app.requestSingleInstanceLock();
let mainWindow;
let widgetWindow;
let tray;
let isQuitting = false;
let showWidgetOnClose = true;

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => showMainWindow());
}

function createTrayIcon() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#101110"/><g fill="#c9f36b" transform="skewX(-15)"><rect x="11" y="13" width="3" height="11" rx="1.5" opacity=".64"/><rect x="16" y="8" width="3" height="16" rx="1.5"/><rect x="21" y="11" width="3" height="13" rx="1.5" opacity=".8"/></g></svg>';
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`).resize({ width: 22, height: 22 });
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}
function positionWidget() {
  if (!widgetWindow) return;
  const { workArea } = screen.getPrimaryDisplay();
  const [width, height] = widgetWindow.getSize();
  widgetWindow.setPosition(workArea.x + workArea.width - width - 24, workArea.y + workArea.height - height - 24);
}
function showWidget() {
  if (!widgetWindow) createWidget();
  if (!widgetWindow) return;
  positionWidget();
  widgetWindow.showInactive();
  widgetWindow.setAlwaysOnTop(true, 'floating');
  refreshTrayMenu();
}
function hideWidget() {
  if (widgetWindow) widgetWindow.hide();
  refreshTrayMenu();
}
function toggleWidget() {
  if (widgetWindow?.isVisible()) hideWidget();
  else showWidget();
}
function buildTrayMenu() {
  let launchesAtLogin = false;
  try { launchesAtLogin = app.getLoginItemSettings().openAtLogin; } catch (error) { /* not available on every Linux desktop */ }
  return Menu.buildFromTemplate([
    { label: 'Show Paradox Dictation', click: showMainWindow },
    { label: 'Start quick dictation', click: () => { showMainWindow(); mainWindow?.webContents.send('widget-command', 'start-recording'); } },
    { type: 'separator' },
    { label: 'Floating quick widget', type: 'checkbox', checked: widgetWindow?.isVisible() || false, click: (item) => item.checked ? showWidget() : hideWidget() },
    { label: 'Show widget when app closes', type: 'checkbox', checked: showWidgetOnClose, click: (item) => { showWidgetOnClose = item.checked; refreshTrayMenu(); } },
    { label: 'Start with Linux', type: 'checkbox', checked: launchesAtLogin, click: (item) => {
      try { app.setLoginItemSettings({ openAtLogin: item.checked }); } catch (error) { /* desktop may not support autostart */ }
      refreshTrayMenu();
    } },
    { type: 'separator' },
    { label: 'Quit Paradox', click: quitApp },
  ]);
}
function refreshTrayMenu() { if (tray) tray.setContextMenu(buildTrayMenu()); }
function createTray() {
  if (tray) return;
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Paradox Dictation');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', showMainWindow);
  tray.on('double-click', toggleWidget);
}

function createWidget() {
  if (widgetWindow) return widgetWindow;
  widgetWindow = new BrowserWindow({
    width: 360, height: 184, minWidth: 320, minHeight: 160,
    frame: false, transparent: true, resizable: false, movable: true,
    skipTaskbar: true, alwaysOnTop: true, show: false, backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'widget-preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  widgetWindow.loadFile(path.join(__dirname, 'widget.html'));
  widgetWindow.on('closed', () => { widgetWindow = null; refreshTrayMenu(); });
  return widgetWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 620, show: false,
    title: 'Paradox Dictation', backgroundColor: '#101110', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
    if (showWidgetOnClose) showWidget();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  if (isDev && process.env.PARADOX_DEV_URL) mainWindow.loadURL(process.env.PARADOX_DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
function quitApp() {
  isQuitting = true;
  hideWidget();
  if (mainWindow) mainWindow.destroy();
  app.quit();
}

if (gotSingleInstanceLock) app.whenReady().then(() => {
  app.setName('Paradox Dictation');
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => callback(permission === 'media'));
  ipcMain.handle('open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) return shell.openExternal(url);
    return false;
  });
  ipcMain.handle('save-audio', async (_event, { bytes, suggestedName }) => {
    const downloads = app.getPath('downloads');
    const safeName = String(suggestedName || 'paradox-recording.webm').replace(/[^a-z0-9._-]/gi, '-');
    const destination = path.join(downloads, safeName);
    await fs.promises.writeFile(destination, Buffer.from(bytes));
    return destination;
  });
  ipcMain.on('widget-toggle', toggleWidget);
  ipcMain.on('widget-show-main', showMainWindow);
  ipcMain.on('widget-close', hideWidget);
  ipcMain.on('widget-start-recording', () => {
    showMainWindow();
    mainWindow?.webContents.send('widget-command', 'start-recording');
  });
  createMainWindow();
  createWidget();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+Space', toggleWidget);
  app.on('activate', showMainWindow);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => {
  // The tray keeps Paradox alive on Linux. Use the tray menu to quit fully.
  if (process.platform === 'darwin' && isQuitting) app.quit();
});
