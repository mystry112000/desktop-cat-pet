const { app, BrowserWindow, ipcMain, screen } = require("electron")
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
  ipcMain.on("drag-window", (_, dx, dy) => {
    const [x, y] = win.getPosition()
    win.setPosition(x + dx, y + dy)
  })
}

app.whenReady().then(createWindow)
app.on("window-all-closed", () => app.quit())
