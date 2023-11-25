import { BrowserWindow, Menu, MenuItem, ipcMain } from 'electron'
import { CanvasStatic } from '../../canvas/Canvas'
import { join } from 'path'
import { mainWin } from '.'
import { Playback, PlaybackEntry, PlaybackEntryStatic } from '../../canvas/Playback'
import { getById } from '../../canvas/Component'
import { VideoStatic } from '../../canvas/Video'

export class CanvasManager {
  private static sm: CanvasManager
  private canvases: CanvasStatic[] = []
  private browserWindows: Record<string, BrowserWindow> = {}
  private createBrowserWindows: boolean = false
  private playbacks: Playback[] = []

  private constructor () {
    ipcMain.handle('getCanvases', () => {
      return this.getCanvases()
    })

    ipcMain.handle('getPlaybacks', () => {
      return this.playbacks.map(p => ({
        id: p.id,
        entries: p.getStaticEntries()
      }))
    })

    ipcMain.on('setCanvas', (event, canvasStatic) => {
      this.canvases = this.canvases.filter(c => c.id !== canvasStatic.id)
      this.canvases.push(canvasStatic)
      this.updateBrowserWindows()
      this.update()
    })
    ipcMain.on('setCanvasBw', (event, canvasStatic) => {
      this.canvases = this.canvases.filter(c => c.id !== canvasStatic.id)
      this.canvases.push(canvasStatic)
      this.updateMain()
    })

    ipcMain.on('removeCanvas', (event, id) => {
      this.canvases = this.canvases.filter(c => c.id !== id)
      this.updateBrowserWindows()
    })

    ipcMain.on('createBrowserWindows', (event, createBrowserWindows) => {
      this.createBrowserWindows = createBrowserWindows
      this.updateBrowserWindows()
    })

    ipcMain.on('setPlayback', (event, id, entries) => {
      this.setPlayback(id, entries)
    })

    ipcMain.on('startPlayback', (event, id) => {
      this.startPlayback(id)
    })
  }

  getCanvas (id: string): CanvasStatic | undefined {
    return this.canvases.find(c => c.id === id)
  }

  createBrowserWindow (canvas: CanvasStatic) {
    const win = new BrowserWindow({
      width: canvas.rect.width,
      height: canvas.rect.height,
      x: canvas.rect.x,
      y: canvas.rect.y,
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

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      win.loadURL(process.env.VITE_DEV_SERVER_URL + '/canvas.html')
    } else {
      win.loadFile(join(process.env.DIST, 'index.html'))
    }

    win.on('maximize', () => {
      win.unmaximize()
    })

    let moveTimeout: NodeJS.Timeout | undefined
    win.on('move', () => {
      moveTimeout && clearTimeout(moveTimeout)
      moveTimeout = setTimeout(() => {
        const c = this.getCanvas(canvas.id)
        if (!c) return

        c.rect.x = win.getBounds().x
        c.rect.y = win.getBounds().y
        this.updateMain()
      }, 300)
    })

    let resizeTimeout: NodeJS.Timeout | undefined
    win.on('resize', () => {
      resizeTimeout && clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const c = this.getCanvas(canvas.id)
        if (!c) return

        c.rect.width = win.getBounds().width
        c.rect.height = win.getBounds().height
        this.updateMain()
      }, 300)
    })

    win.webContents.on('did-finish-load', () => {
      win.webContents.send('canvasUpdate', canvas)
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
    if (!this.createBrowserWindows) {
      for (const win of Object.values(this.browserWindows)) {
        win.close()
      }
      this.browserWindows = {}
      return
    }

    for (const canvas of this.canvases) {
      const win = this.browserWindows[canvas.id]
      if (win) {
        win.setBounds(canvas.rect)
        win.setTitle(canvas.name)
      } else {
        this.createBrowserWindow(canvas)
      }
    }

    for (const id in this.browserWindows) {
      if (!this.canvases.find(c => c.id === id)) {
        this.browserWindows[id].close()
      }
    }
  }

  updateMain () {
    mainWin?.webContents.send('canvasUpdate', this.canvases)
  }

  update () {
    Object.keys(this.browserWindows).forEach((id) => {
      this.browserWindows[id].webContents.send('canvasUpdate', this.getCanvas(id))
    })
  }

  addCanvas (canvas: CanvasStatic) {
    this.canvases.push(canvas)
  }

  getCanvases (): CanvasStatic[] {
    return this.canvases
  }

  setPlayback (id: string, entries: PlaybackEntryStatic[]) {
    console.log('setPlayback', id, entries)

    let playback = this.playbacks.find(p => p.id === id)

    if (!playback) {
      playback = new Playback(id)
      this.playbacks.push(playback)
    }

    playback.setEntries(entries.map(e => {
      const component = getById(e.id, this.canvases)

      if (!component) return false
      if (component.type !== 'video') return false

      console.log('component', component)
      return new PlaybackEntry(component as VideoStatic, e.time)
    }).filter(e => e !== false) as PlaybackEntry[])
  }

  startPlayback (id: string) {
    const playback = this.playbacks.find(p => p.id === id)
    if (!playback) throw new Error(`Playback ${id} not found`)
    playback.play(() => {
      this.update()
      this.updateMain()
    })
  }

  static get (): CanvasManager {
    if (!CanvasManager.sm) {
      CanvasManager.sm = new CanvasManager()
    }
    return CanvasManager.sm
  }
}
