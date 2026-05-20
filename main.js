const { app, BrowserWindow, ipcMain, screen } = require("electron")

let win

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.setIgnoreMouseEvents(true, { forward: true })
  win.loadFile("index.html")

  ipcMain.on("set-ignore-mouse", (_, ignore) => {
    win.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.on("quit", () => app.quit())
}

app.whenReady().then(createWindow)
app.on("window-all-closed", () => app.quit())
