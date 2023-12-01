import { BrowserWindow, Menu, MenuItem, ipcMain } from 'electron'
import { join } from 'path'
import { Canvas, CanvasJSON } from './Canvas'
import { SceneManager } from './SceneManager'
import { ComponentJSON } from './Component'
import { mainWin } from '../electron/main'
import { Window, WindowJSON } from './Window'
import { SceneJSON } from './Scene'

export class WindowManager {
  private windows: Window[] = []
  // Canvas ID -> BrowserWindow
  private browserWindows: Record<string, BrowserWindow> = {}

  private constructor () {
    ipcMain.on('setCanvas', (_, canvas: any) => {
      if (typeof canvas !== 'object') {
        console.error('Error while setting canvas: canvas is not an object')
        return
      }

      SceneManager.getInstance().updateCanvasWithJSON(canvas)
    })
    ipcMain.on('removeCanvas', (_, id: any) => {
      if (typeof id !== 'string') {
        console.error('Error while removing canvas: id is not a string')
        return
      }

      SceneManager.getInstance().removeCanvas(id)
    })
    ipcMain.handle('getCanvases', () => {
      const canvases = SceneManager.getInstance().getCanvases()
      return canvases.map(canvas => canvas.toJSON())
    })
    ipcMain.handle('getCanvas', (event) => {
      for (const [id, bwin] of Object.entries(this.browserWindows)) {
        if (bwin.webContents === event.sender) {
          const window = this.windows.find(w => w.id === id)

          if (window) {
            if (window.canvasId) {
              const canvas = SceneManager.getInstance().getCanvas(window.canvasId)
              return canvas?.toJSON() ?? null
            } else {
              return null
            }
          } else {
            console.error(`Window ${id} not found`)
            return null
          }
        }
      }
    })

    ipcMain.on('setComponent', (_, component: any) => {
      if (typeof component !== 'object') {
        console.error('Error while setting component: component is not an object')
        return
      }

      SceneManager.getInstance().updateComponentWithJSON(component)
    })
    ipcMain.handle('getComponents', () => {
      const components = SceneManager.getInstance().getComponents()
      return components.map(component => component.toJSON())
    })

    ipcMain.on('setSlot', (_, canvasId: any, slot: any) => {
      if (typeof canvasId !== 'string') {
        console.error('Error while setting slot: canvasId is not a string')
        return
      }
      if (typeof slot !== 'object') {
        console.error('Error while setting slot: slot is not an object')
        return
      }

      SceneManager.getInstance().updateSlotWithJSON(canvasId, slot)
    })

    ipcMain.on('setWindow', (_, window: any) => {
      if (typeof window !== 'object') {
        console.error('Error while setting window: window is not an object')
        return
      }

      this.setWindow(window)
    })
    ipcMain.on('removeWindow', (_, canvasId: any) => {
      if (typeof canvasId !== 'string') {
        console.error('Error while removing window: canvasId is not a string')
        return
      }

      this.removeWindow(canvasId)
    })
    ipcMain.handle('getWindows', () => {
      return this.windows.map(window => window.toJSON())
    })
    ipcMain.handle('getWindow', (event) => {
      for (const [id, bwin] of Object.entries(this.browserWindows)) {
        if (bwin.webContents === event.sender) {
          const window = this.windows.find(w => w.id === id)

          if (window) {
            return window.toJSON()
          } else {
            console.error(`Window ${id} not found`)
            this.removeWindow(id)
            return null
          }
        }
      }
    })

    ipcMain.on('showWindows', () => {
      this.showWindows()
    })
    ipcMain.on('hideWindows', () => {
      this.hideWindows()
    })
    ipcMain.handle('requestMedia', async (_, id: any, src: any) => {
      if (typeof id !== 'string') {
        console.error('Error while requesting media: id is not a string')

        return null
      }
      if (typeof src !== 'string') {
        console.error('Error while requesting media: src is not a string')

        return null
      }

      console.log(`Requesting media ${id} from ${src}`)
      return await SceneManager.getInstance().requestMedia(id, src)
    })

    ipcMain.on('setScene', (_, scene: any) => {
      if (typeof scene !== 'object') {
        console.error('Error while setting scene: scene is not an object')
        return
      }

      SceneManager.getInstance().updateSceneWithJSON(scene)
    })

    ipcMain.on('createScene', (_, canvasIds: any) => {

      SceneManager.getInstance().createScene(canvasIds)
    })

    ipcMain.on('removeScene', (_, id: any) => {
      if (typeof id !== 'string') {
        console.error('Error while removing scene: id is not a string')
        return
      }

      SceneManager.getInstance().removeScene(id)
    })

    ipcMain.handle('getScenes', () => {
      return SceneManager.getInstance().getScenes().map(scene => {
        const json: SceneJSON & {
          sceneSetup?: any
        } = scene.toJSON()
        delete json.sceneSetup
        return json
      })
    })

    ipcMain.handle('getActiveScenes', () => {
      return Object.fromEntries(Object.entries(SceneManager.getInstance().getActiveScenes()).map(([id, scene]) => [id, scene.id]))
    })

    ipcMain.on('setActiveScenes', (_, canvasToSceneId: Record<string, string>) => {
      for (const [canvasId, sceneId] of Object.entries(canvasToSceneId)) {
        SceneManager.getInstance().setActiveSceneForCanvas(canvasId, sceneId)
      }
    })
  }

  createBrowserWindow (window: Window) {
    let canvas: Canvas | null = null
    if (window.canvasId) {
      canvas = SceneManager.getInstance().getCanvas(window.canvasId) ?? null
    }

    const win = new BrowserWindow({
      width: window.rect.width,
      height: window.rect.height,
      x: window.rect.x,
      y: window.rect.y,
      title: `Canvas Viewer [${canvas?.name ?? 'No Canvas'}]`,

      frame: false,
      transparent: true,
      backgroundColor: '#000000',
      alwaysOnTop: true,
      minimizable: false,
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
    win.on('move', () => {
      // moveTimeout && clearTimeout(moveTimeout)
      // moveTimeout = setTimeout(() => {
      this.windows.find(w => w.id === window.id)?.rect.fromJSON(win.getBounds())
      this.updateWindows(false)
      // }, 300)
    })

    // let resizeTimeout: NodeJS.Timeout | undefined
    win.on('resize', () => {
      // resizeTimeout && clearTimeout(resizeTimeout)
      // resizeTimeout = setTimeout(() => {
      this.windows.find(w => w.id === window.id)?.rect.fromJSON(win.getBounds())
      this.updateWindows(false)
      // }, 300)
    })

    win.webContents.on('did-finish-load', () => {
      win.webContents.send('canvasUpdate', canvas?.toJSON())
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

    win.on('close', () => {
      delete this.browserWindows[window.id]
      this.removeWindow(window.id)
    })

    this.browserWindows[window.id] = win
  }

  updateBrowserWindows () {
    console.log('Updating browser windows')
    const sm = SceneManager.getInstance()

    for (const window of this.windows) {
      const canvasId = window.canvasId
      if (!this.browserWindows[window.id]) {
        if (!canvasId) {
          console.error(`Canvas ID not found for window ${window.id}`)
          continue
        }

        const canvas = sm.getCanvas(canvasId)

        if (!canvas) {
          console.error(`Canvas ${canvasId} not found`)
          window.canvasId = null
          continue
        }

        this.createBrowserWindow(window)
      } else {
        const bwin = this.browserWindows[window.id]

        if (bwin.isMaximized()) {
          bwin.unmaximize()
        }

        bwin.setBounds(window.rect.toJSON())

        bwin.setTitle(`Canvas Viewer [${window.canvasId ? sm.getCanvas(window.canvasId)?.name : 'No Canvas'}]`)
        this.showingWindows ? bwin.show() : bwin.hide()
      }
    }

    const windowIds = this.windows.map(w => w.id)
    for (const windowId in this.browserWindows) {
      if (!windowIds.includes(windowId)) {
        this.browserWindows[windowId].close()
        delete this.browserWindows[windowId]
      }
    }
  }

  updateWindows (updateBrowserWindows: boolean = true) {
    updateBrowserWindows && this.updateBrowserWindows()

    for (const [id, win] of Object.entries(this.browserWindows)) {
      const window = this.windows.find(w => w.id === id)
      win.webContents.send('windowUpdate', window?.toJSON() ?? null)
    }

    mainWin?.webContents.send('windowUpdate', this.windows)
  }

  updateCanvas (id: string, canvas: CanvasJSON | null) {
    const windows = this.windows.filter(w => w.canvasId === id)
    for (const win of windows) {
      this.browserWindows[win.id]?.webContents.send('canvasUpdate', canvas)
    }
    mainWin?.webContents.send('canvasUpdate', id, canvas)
  }

  updateComponent (id: string, component: ComponentJSON | null) {
    console.log(`Updating component ${id}`)
    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('componentUpdate', id, component)
    }
    mainWin?.webContents.send('componentUpdate', id, component)
  }

  updateScene (id: string, scene: SceneJSON | null) {
    console.log(`Updating scene ${id}`)

    const json: SceneJSON & {
      sceneSetup?: any
    } | null = scene
    json && delete json.sceneSetup

    mainWin?.webContents.send('sceneUpdate', id, json)
  }

  updateActiveScenes () {
    console.log('Updating active scenes')

    mainWin?.webContents.send('activeScenesChanged', Object.fromEntries(Object.entries(SceneManager.getInstance().getActiveScenes()).map(([id, scene]) => [id, scene.id])))
  }

  setWindow (window: WindowJSON) {
    const w = this.windows.find(w => w.id === window.id)

    if (w) {
      console.log(`Updating window ${window.id}`)
      w.fromJSON(window)
    } else {
      console.log(`Creating window ${window.id}`)
      this.windows.push(Window.fromJSON(window))
    }
    this.updateBrowserWindows()
  }
  removeWindow (canvasId: string) {
    this.windows = this.windows.filter(w => w.id !== canvasId)
    this.updateBrowserWindows()
  }

  private showingWindows: boolean = false
  showWindows () {
    console.log('Showing windows')
    this.showingWindows = true

    this.updateBrowserWindows()
  }

  hideWindows () {
    console.log('Hiding windows')
    this.showingWindows = false

    this.updateBrowserWindows()
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
