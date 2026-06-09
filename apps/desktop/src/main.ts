import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { HarnessService } from '@harness/core'

import { registerIpcHandlers } from './ipc/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#0a0f1a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    const rendererIndex = path.resolve(__dirname, '../../renderer/dist/index.html')
    void mainWindow.loadFile(rendererIndex)
  }
}

async function bootstrap() {
  const userDataDir = path.join(app.getPath('userData'), 'harness-data')
  const service = new HarnessService(userDataDir)
  await service.initialize()
  registerIpcHandlers(service)
  createWindow()
}

app.whenReady().then(() => {
  void bootstrap()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
