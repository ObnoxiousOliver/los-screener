import { BrowserWindow, Menu, MenuItem, ipcMain } from 'electron'
import { join } from 'path'
import { SceneManager } from './SceneManager'
import { ComponentJSON } from './Component'
import { mainWin } from '../electron/main'
import { Window, WindowJSON } from './Window'
import { SceneJSON } from './Scene'
import { Slice, SliceJSON } from './Slice'
import { SlotJSON } from './Slot'
import fontList from 'font-list'
import { ContextMenuTemplate } from '../helpers/ContextMenu'
import { BrowserView } from './BrowserView'

export class WindowManager {
  private windows: Window[] = []
  // Slice ID -> BrowserWindow
  private browserWindows: Record<string, BrowserWindow> = {}

  private constructor () {
    ipcMain.on('setSlice', (_, slice: any) => {
      if (typeof slice !== 'object') {
        console.error('Error while setting slice: slice is not an object')
        return
      }

      SceneManager.getInstance().updateSliceWithJSON(slice)
    })

    ipcMain.on('removeSlice', (_, id: any) => {
      if (typeof id !== 'string') {
        console.error('Error while removing slice: id is not a string')
        return
      }

      SceneManager.getInstance().removeSlice(id)
    })
    ipcMain.handle('getSlices', () => {
      return SceneManager.getInstance().getSlices().map(slice => slice.toJSON())
    })
    ipcMain.handle('getSlice', (event) => {
      for (const [id, bwin] of Object.entries(this.browserWindows)) {
        if (bwin.webContents === event.sender) {
          const window = this.windows.find(w => w.id === id)
          const slice = SceneManager.getInstance().getSlice(window?.sliceId ?? '')

          if (slice) {
            return slice.toJSON()
          } else {
            console.error(`Slice ${id} not found`)
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
      console.log('Setting component', component)
      SceneManager.getInstance().updateComponentWithJSON(component)
    })
    ipcMain.on('removeComponent', (_, id: any) => {
      if (typeof id !== 'string') {
        console.error('Error while removing component: id is not a string')
        return
      }

      SceneManager.getInstance().removeComponent(id)
    })
    ipcMain.handle('getComponents', () => {
      const components = SceneManager.getInstance().getComponents()
      return components.map(component => component.toJSON())
    })
    ipcMain.handle('invokeComponentAction', (_, id: any, action: any, args: any[]) => {
      if (typeof id !== 'string') {
        console.error('Error while invoking component action: id is not a string')
        return
      }

      if (typeof action !== 'string') {
        console.error('Error while invoking component action: action is not a string')
        return
      }

      return this.invokeComponentAction(id, action, args ?? [])
    })

    ipcMain.on('setSlot', (_, sceneId: any, slotId: string, slot: Partial<SlotJSON> | null) => {
      if (typeof sceneId !== 'string') {
        console.error('Error while setting slot: canvasId is not a string')
        return
      }

      if (typeof slotId !== 'string') {
        console.error('Error while setting slot: slotId is not a string')
        return
      }

      if (slot !== null && typeof slot !== 'object') {
        console.error('Error while setting slot: slot is not an object')
        return
      }

      if (slot === null) {
        SceneManager.getInstance().removeSlot(sceneId, slotId)
      } else {
        slot.id = slotId
        SceneManager.getInstance().updateSlotWithJSON(sceneId, slot)
      }
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
    ipcMain.handle('requestBrowserView', async (_, id: any, src: any, width: any, height: any, zoomFactor: any) => {
      if (typeof id !== 'string') {
        console.error('Error while requesting browser view: id is not a string')

        return null
      }
      if (typeof src !== 'string') {
        console.error('Error while requesting browser view: src is not a string')

        return null
      }
      if (typeof width !== 'number') {
        console.error('Error while requesting browser view: width is not a number')

        return null
      }
      if (typeof height !== 'number') {
        console.error('Error while requesting browser view: height is not a number')

        return null
      }
      if (typeof zoomFactor !== 'number') {
        console.error('Error while requesting browser view: zoomFactor is not a number')

        return null
      }

      console.log(`Requesting browser view ${id} from ${src}`)
      return await BrowserView.requestBrowserView(id, {
        url: src,
        width,
        height,
        zoomFactor
      })
    })

    ipcMain.on('setScene', (_, scene: any) => {
      if (typeof scene !== 'object') {
        console.error('Error while setting scene: scene is not an object')
        return
      }

      SceneManager.getInstance().updateSceneWithJSON(scene)
    })

    ipcMain.on('createScene', () => {
      SceneManager.getInstance().createScene()
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
    ipcMain.handle('getScene', () => {
      return SceneManager.getInstance().getActiveScene().toJSON()
    })

    ipcMain.handle('getActiveScene', () => {
      return SceneManager.getInstance().getActiveScene().id
    })

    ipcMain.on('setActiveScene', (_, sceneId: string) => {
      if (typeof sceneId !== 'string') {
        console.error('Error while setting active scene: sceneId is not a string')
        return
      }

      SceneManager.getInstance().setActiveSceneFromId(sceneId)
    })

    ipcMain.on('setPlayback', (_, playback: any) => {
      if (typeof playback !== 'object') {
        console.error('Error while setting playback: playback is not an object')
        return
      }

      SceneManager.getInstance().updatePlaybackWithJSON(playback)
    })

    ipcMain.on('removePlayback', (_, id: any) => {
      if (typeof id !== 'string') {
        console.error('Error while removing playback: id is not a string')
        return
      }

      SceneManager.getInstance().removePlayback(id)
    })

    ipcMain.handle('getPlaybacks', () => {
      return SceneManager.getInstance().getPlaybacks().map(playback => playback.toJSON())
    })

    ipcMain.on('setActivePlayback', (_, id: string) => {
      if (typeof id !== 'string') {
        console.error('Error while setting active playback: id is not a string')
        return
      }

      SceneManager.getInstance().setActivePlaybackFromId(id)
    })

    ipcMain.handle('getActivePlayback', () => {
      return SceneManager.getInstance().getActivePlayback()?.id
    })

    ipcMain.handle('getFonts', async () => {
      return await fontList.getFonts({
        disableQuoting: true
      })
    })

    ipcMain.on('pushHistory', () => {
      SceneManager.getInstance().pushHistory()
    })

    ipcMain.on('openContextMenu', (event, template: ContextMenuTemplate[]) => {
      if (!Array.isArray(template)) {
        console.error('Error while opening context menu: template is not an array')
        return
      }
      let willClose = false

      function addClick (menu: ContextMenuTemplate[]) {
        for (const item of menu) {
          if (item.id) {
            item.click = () => {
              event.reply('contextMenuClicked', item.id)
              if (willClose) {
                event.reply('contextMenuClosed')
              }
            }
          }

          if (item.submenu) {
            addClick(item.submenu)
          }
        }
      }

      addClick(template)

      const menu = Menu.buildFromTemplate(template)
      menu.on('menu-will-close', () => {
        willClose = true
      })
      menu.popup({
        window: mainWin ?? undefined
      })
    })
  }

  createBrowserWindow (window: Window) {
    let slice: Slice | null = null
    if (window.sliceId) {
      slice = SceneManager.getInstance().getSlice(window.sliceId) ?? null
    }

    const win = new BrowserWindow({
      width: window.rect.width,
      height: window.rect.height,
      x: window.rect.x,
      y: window.rect.y,
      title: `Screener Slice Viewer [${slice?.name ?? 'No Slice'}]`,

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
        preload: join(__dirname, '../preload/sliceViewer.js')
      }
    })

    this.showingWindows ? win.show() : win.hide()

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      win.loadURL(process.env.VITE_DEV_SERVER_URL + '/sliceViewer.html')
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
      win.webContents.send('sliceUpdate', slice?.toJSON() ?? null)
      win.webContents.send('sceneUpdate', SceneManager.getInstance().getActiveScene().toJSON())
    })

    const WM_INITMENU = 0x0116

    win.hookWindowMessage(WM_INITMENU, () => {
      win.setEnabled(false)
      win.setEnabled(true)

      const menu = Menu.buildFromTemplate([
        {
          label: win.webContents.isDevToolsOpened() ? 'Close DevTools' : 'Open DevTools',
          type: 'checkbox',
          checked: win.webContents.isDevToolsOpened(),
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
      const sliceId = window.sliceId
      if (!this.browserWindows[window.id]) {
        if (!sliceId) {
          console.error(`Slice ID not found for window ${window.id}`)
          continue
        }

        const slice = sm.getSlice(sliceId)

        if (!slice) {
          console.error(`Slice ${sliceId} not found`)
          window.sliceId = null
          continue
        }

        this.createBrowserWindow(window)
      } else {
        const bwin = this.browserWindows[window.id]

        if (bwin.isMaximized()) {
          bwin.unmaximize()
        }

        bwin.setBounds(window.rect.toJSON())

        bwin.setTitle(`Screener Slice Viewer [${window.sliceId ? sm.getSlice(window.sliceId)?.name : 'No Slice'}]`)
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

  // updateCanvas (id: string, canvas: CanvasJSON | null) {
  //   const windows = this.windows.filter(w => w.canvasId === id)
  //   for (const win of windows) {
  //     this.browserWindows[win.id]?.webContents.send('canvasUpdate', canvas)
  //   }
  //   mainWin?.webContents.send('canvasUpdate', id, canvas)
  // }

  updateSlice (id: string, slice: SliceJSON | null) {
    // console.log(`Updating slice ${id}`)
    const windows = this.windows.filter(w => w.sliceId === id)
    for (const win of windows) {
      this.browserWindows[win.id]?.webContents.send('sliceUpdate', slice)
    }
    mainWin?.webContents.send('sliceUpdate', id, slice)
  }

  updateComponent (id: string, component: ComponentJSON | null) {
    // console.log(`Updating component ${id}`)
    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('componentUpdate', id, component)
    }
    mainWin?.webContents.send('componentUpdate', id, component)
  }

  updateScene (id: string, scene: SceneJSON | null) {
    // console.log(`Updating scene ${id}`)

    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('sceneUpdate', scene)
    }
    mainWin?.webContents.send('sceneUpdate', id, scene)
  }

  updateActiveScene (id: string) {
    // console.log('Updating active scene', id)
    mainWin?.webContents.send('activeSceneChanged', id)
    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('sceneUpdate', SceneManager.getInstance().getActiveScene().toJSON())
    }
  }

  updatePlayback (id: string, playback: any) {
    // console.log(`Updating playback ${id}`)

    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('playbackUpdate', id, playback)
    }
    mainWin?.webContents.send('playbackUpdate', id, playback)
  }

  updateActivePlayback (id: string | null) {
    mainWin?.webContents.send('activePlaybackChanged', id)
  }

  invokeComponentAction (id: string, action: string, args: any[]) {
    console.log(`Invoking component action ${action} on component ${id} with args`, ...args)

    const component = SceneManager.getInstance().getComponent(id)
    if (!component) {
      throw new Error(`Component ${id} not found`)
    }

    for (const win of Object.values(this.browserWindows)) {
      win.webContents.send('componentAction', id, action, ...(args ?? []))
    }
    mainWin?.webContents.send('componentAction', id, action, ...(args ?? []))

    component.call(action, {
      isEditor: false,
      media: {
        playAudio: (src: string, time: number) => {
          console.log(src, time)
        },
        interactBrowserView: (id: string) => {
          BrowserView.show(id)
        }
      }
    },...args)

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
