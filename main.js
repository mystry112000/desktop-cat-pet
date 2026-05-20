const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")

let win

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadFile("index.html")

  ipcMain.on("quit", () => app.quit())
  ipcMain.on("minimize", () => win.minimize())
}

app.whenReady().then(createWindow)
app.on("window-all-closed", () => app.quit())
