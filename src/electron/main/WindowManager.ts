import { BrowserWindow, Menu, MenuItem, ipcMain } from 'electron'
import { join } from 'path'
import { Canvas, CanvasJSON } from '../../canvas/Canvas'
import { Rect } from '../../helpers/Rect'
import { SceneManager } from '../../canvas/SceneManager'
import { ComponentJSON } from '../../canvas/Component'

export class WindowManager {
  private windows: Record<string, Rect> = {}
  private browserWindows: Record<string, BrowserWindow> = {}

  private constructor () {
    ipcMain.on('setCanvas', (event, canvas: CanvasJSON) => {
      SceneManager.getInstance().updateCanvasWithJSON(canvas)
    })

    ipcMain.on('removeCanvas', (event, id: string) => {
      SceneManager.getInstance().removeCanvas(id)
    })

    ipcMain.handle('getCanvases', () => {
      const canvases = SceneManager.getInstance().getCanvases()
      return canvases.map(canvas => canvas.toJSON())
    })

    ipcMain.on('setComponent', (event, component: ComponentJSON) => {
      SceneManager.getInstance().updateComponentWithJSON(component)
    })

    ipcMain.handle('getComponents', () => {
      const components = SceneManager.getInstance().getComponents()
      return components.map(component => component.toJSON())
    })

    ipcMain.on('setWindow', (event, canvasId: string, window: Rect) => {
      this.windows[canvasId] = window
      this.updateBrowserWindows()
    })
  }

  createBrowserWindow (canvas: Canvas) {
    const window = this.windows[canvas.id]

    const win = new BrowserWindow({
      width: window.width,
      height: window.height,
      x: window.x,
      y: window.y,
      title: canvas.name,

      frame: false,
      transparent: true,
      backgroundColor: '#000000',
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      resizable: false,
      movable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        preload: join(__dirname, '../preload/video.js')
      }
    })

    this.showingWindows ? win.show() : win.hide()

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      win.loadURL(process.env.VITE_DEV_SERVER_URL + '/canvas.html')
    } else {
      win.loadFile(join(process.env.DIST, 'index.html'))
    }

    win.on('maximize', () => {
      win.unmaximize()
    })

    // let moveTimeout: NodeJS.Timeout | undefined
    // win.on('move', () => {
    //   moveTimeout && clearTimeout(moveTimeout)
    //   moveTimeout = setTimeout(() => {
    //     this.windows[canvas.id] = Rect.fromJSON(win.getBounds())
    //   }, 300)
    // })

    // let resizeTimeout: NodeJS.Timeout | undefined
    // win.on('resize', () => {
    //   resizeTimeout && clearTimeout(resizeTimeout)
    //   resizeTimeout = setTimeout(() => {
    //     this.windows[canvas.id] = Rect.fromJSON(win.getBounds())
    //   }, 300)
    // })

    win.webContents.on('did-finish-load', () => {
      win.webContents.send('canvasUpdate', canvas.toJSON())
    })

    const WM_INITMENU = 0x0116

    win.hookWindowMessage(WM_INITMENU, () => {
      win.setEnabled(false)
      win.setEnabled(true)

      const menu = Menu.buildFromTemplate([
        {
          label: 'Toggle DevTools',
          click: () => {
            if (!win.webContents.isDevToolsOpened()) {
              win.webContents.openDevTools({
                mode: 'detach',
                activate: true
              })
            } else {
              win.webContents.closeDevTools()
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Always on top',
          type: 'checkbox',
          checked: win.isAlwaysOnTop(),
          click: (menuItem: MenuItem) => {
            win.setAlwaysOnTop(menuItem.checked)
          }
        },
        {
          label: 'Movable',
          type: 'checkbox',
          checked: win.isMovable(),
          click: (menuItem: MenuItem) => {
            win.setMovable(menuItem.checked)
          }
        },
        {
          label: 'Resizable',
          type: 'checkbox',
          checked: win.isResizable(),
          click: (menuItem: MenuItem) => {
            win.setResizable(menuItem.checked)
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Reload',
          click: () => {
            win.webContents.reload()
          }
        },
        {
          label: 'Minimize',
          click: () => {
            win.minimize()
          }
        },
        {
          label: 'Close',
          click: () => {
            win.close()
          }
        }
      ])
      menu.popup()
    })

    win.on('closed', () => {
      delete this.browserWindows[canvas.id]
    })

    this.browserWindows[canvas.id] = win
  }

  updateBrowserWindows () {
    const sm = SceneManager.getInstance()

    for (const canvasId in this.windows) {
      if (!this.browserWindows[canvasId]) {
        const canvas = sm.getCanvas(canvasId)

        if (!canvas) {
          console.error(`Canvas ${canvasId} not found`)
          delete this.windows[canvasId]
          continue
        }

        this.createBrowserWindow(canvas)
      } else {
        const win = this.browserWindows[canvasId]
        const window = this.windows[canvasId]

        if (win.isMaximized()) {
          win.unmaximize()
        }

        win.setBounds(window.toJSON())
      }
    }

    for (const canvasId in this.browserWindows) {
      if (!this.windows[canvasId]) {
        this.browserWindows[canvasId].close()
        delete this.browserWindows[canvasId]
      }
    }
  }

  addWindow (canvasId: string, window: Rect) {
    this.windows[canvasId] = window
    this.updateBrowserWindows()
  }

  updateCanvas (id: string, canvas: CanvasJSON | null) {
    this.updateBrowserWindows()
    this.browserWindows[id]?.webContents.send('canvasUpdate', canvas)
    // mainWin?.webContents.send('canvasUpdate', id, canvas)
  }

  updateComponent (id: string, component: ComponentJSON | null) {
    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('componentUpdate', id, component)
    }
    // mainWin?.webContents.send('componentUpdate', id, component)
  }

  private showingWindows: boolean = false
  showWindows () {
    if (this.showingWindows) {
      return
    }

    this.showingWindows = true

    for (const win of Object.values(this.browserWindows)) {
      win.show()
    }
  }

  hideWindows () {
    if (!this.showingWindows) {
      return
    }

    this.showingWindows = false

    for (const win of Object.values(this.browserWindows)) {
      win.hide()
    }
  }

  // Singleton
  private static wm: WindowManager
  static getInstance (): WindowManager {
    if (!WindowManager.wm) {
      WindowManager.wm = new WindowManager()
    }
    return WindowManager.wm
  }
}
