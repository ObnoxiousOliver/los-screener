import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { WindowManager } from '../../screener/WindowManager'
import { readFile, writeFile } from 'fs/promises'
import { SceneManager } from '../../screener/SceneManager'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export let mainWin: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  let bounds: {
    x: number,
    y: number,
    width: number,
    height: number,
    maximized: boolean
  } | undefined
  try {
    bounds = JSON.parse(await readFile(join(app.getPath('appData'), 'bounds.json'), 'utf-8'))
  } catch (error) {
    console.error(error)
  }

  mainWin = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    width: bounds?.width ?? undefined,
    height: bounds?.height ?? undefined,
    x: bounds?.x ?? undefined,
    y: bounds?.y ?? undefined,
    minHeight: 600,
    minWidth: 800
  })

  if (bounds?.maximized) {
    mainWin.maximize()
  }
  bounds = {
    ...mainWin.getBounds(),
    maximized: mainWin.isMaximized()
  }

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    mainWin.loadURL(url)
    // Open devTool if the app is not packaged
    // mainWin.webContents.openDevTools()
  } else {
    mainWin.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  mainWin.webContents.on('did-finish-load', () => {
    mainWin?.webContents.setZoomFactor(1)
    mainWin?.webContents.setVisualZoomLevelLimits(1, 1)
    mainWin?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWin.on('resize', updateBounds)
  mainWin.on('move', updateBounds)
  mainWin.on('maximize', updateBounds)
  mainWin.on('unmaximize', updateBounds)
  function updateBounds() {
    if (!mainWin) return
    if (mainWin.isMaximized()) {
      if (!bounds) return
      bounds.maximized = true
    } else {
      bounds = {
        ...mainWin.getBounds(),
        maximized: false
      }
    }
  }

  mainWin.on('close', async () => {
    if (!mainWin) return
    await writeFile(join(app.getPath('appData'), 'bounds.json'), JSON.stringify(bounds))
  })
}

app.whenReady().then(() => {
  WindowManager.getInstance()

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => { console.log('Open') } },
        { label: 'Open Recent', submenu: [{ label: 'File 1' }, { label: 'File 2' }] },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => { console.log('Save') } },
        { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: () => { console.log('Save As') } },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { SceneManager.getInstance().undo() } },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => { SceneManager.getInstance().redo() } },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Paste Duplicate', accelerator: 'CmdOrCtrl+Alt+V', click: () => { console.log('Paste Duplicate') } },
        { label: 'Delete', accelerator: 'Delete', role: 'delete' },
        { type: 'separator' },
        {
          label: 'Transform',
          submenu: [
            { label: 'Copy Transform', click: () => { console.log('Copy Transform') } },
            { label: 'Paste Transform', click: () => { console.log('Paste Transform') } },
            { label: 'Reset Transform', accelerator: 'CmdOrCtrl+Shift+R', click: () => { console.log('Reset Transform') } },
            { type: 'separator' },
            { label: 'Rotate Left', accelerator: 'CmdOrCtrl+Shift+Left', click: () => { console.log('Rotate Left') } },
            { label: 'Rotate Right', accelerator: 'CmdOrCtrl+Shift+Right', click: () => { console.log('Rotate Right') } },
            { type: 'separator'},
            { label: 'Flip Horizontal', accelerator: 'CmdOrCtrl+Shift+H', click: () => { console.log('Flip Horizontal') } },
            { label: 'Flip Vertical', accelerator: 'CmdOrCtrl+Shift+V', click: () => { console.log('Flip Vertical') } },
            { type: 'separator'},
            { label: 'Fill Canvas', accelerator: 'CmdOrCtrl+Shift+F', click: () => { console.log('Fill Canvas') } },
            { label: 'Center', accelerator: 'CmdOrCtrl+Shift+C', click: () => { console.log('Center') } },
            { label: 'Center Horizontal', click: () => { console.log('Center Horizontal') } },
            { label: 'Center Vertical', click: () => { console.log('Center Vertical') } }
          ]
        },
        {
          label: 'Arrange',
          submenu: [
            { label: 'Bring Forward', accelerator: 'CmdOrCtrl+]', click: () => { console.log('Bring Forward') } },
            { label: 'Bring to Front', accelerator: 'CmdOrCtrl+Shift+]', click: () => { console.log('Bring to Front') } },
            { label: 'Send Backward', accelerator: 'CmdOrCtrl+[', click: () => { console.log('Send Backward') } },
            { label: 'Send to Back', accelerator: 'CmdOrCtrl+Shift+[', click: () => { console.log('Send to Back') } }
          ]
        },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { label: 'Deselect', accelerator: 'CmdOrCtrl+Shift+A', click: () => { console.log('Deselect') } },
        { type: 'separator' },
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => { console.log('Preferences') } }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => { console.log('Zoom In') } },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => { console.log('Zoom Out') } },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => { console.log('Reset Zoom') } },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: '', role: 'forceReload' },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          role: 'toggleDevTools'
        }
      ]
    },
    {
      label: 'Windows',
      submenu: [
        { label: 'Setup...', click: () => {
          mainWin?.webContents.send('menu-action', 'setup')
        } },
        { type: 'separator' },
        { label: 'Toggle Visibility', click: () => { console.log('Toggle Visibility') } },
        { label: 'Always On Top', click: () => { console.log('Set All Always On Top') } },
        { label: 'Lock All Positions', click: () => { console.log('Lock All Positions') } },
        { type: 'separator' },
        { label: 'Refresh All', click: () => { console.log('Refresh All') } }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Check for Updates', click: () => { console.log('Check for Updates') } },
        { label: 'About', click: () => { console.log('About') } }
      ]
    }
  ]))

  createWindow()

})

app.on('window-all-closed', () => {
  mainWin = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (mainWin) {
    // Focus on the main window if the user tried to open another
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
