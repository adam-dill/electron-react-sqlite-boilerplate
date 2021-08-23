const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const sqlite3 = require('better-sqlite3');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('query', (event, {url, sql}) => {
    if (!url) {
        event.reply('response', []);
        return;
    }

    const db = new sqlite3(url, {verbose: console.log});
    const results = db.prepare(sql).all();
    db.close();
    event.reply('response', results);
});

ipcMain.on('mutate', (event, {url, sql}) => {
    if (!url) return;

    const db = new sqlite3(url, {verbose: console.log});
    db.prepare(sql).run();
    db.close();
});
