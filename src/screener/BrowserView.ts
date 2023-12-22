import { BrowserWindow } from 'electron'

export interface BrowserViewOptions {
  url: string
  width: number
  height: number
  zoomFactor: number
}

export const BrowserViewDefaults: BrowserViewOptions = {
  url: 'about:blank',
  width: 800,
  height: 600,
  zoomFactor: 1
}

export class BrowserView {
  private _id: string
  public get id () {
    return this._id
  }
  private set id (v) {
    this._id = v
  }

  private _url: string
  public get url () {
    return this._url
  }
  private set url (v) {
    this._url = v
  }

  private _width: number
  public get width () {
    return this._width
  }
  private set width (v) {
    this._width = v
  }

  private _height: number
  public get height () {
    return this._height
  }
  private set height (v) {
    this._height = v
  }

  private _zoomFactor: number
  public get zoomFactor () {
    return this._zoomFactor
  }
  private set zoomFactor (v) {
    this._zoomFactor = v
  }

  private _browserWindow: Electron.BrowserWindow | null = null
  public get browserWindow () {
    return this._browserWindow
  }
  private set browserWindow (v) {
    this._browserWindow = v
  }

  private constructor (id: string, options: Partial<BrowserViewOptions> = {}) {
    this._id = id
    this._url = options.url ?? BrowserViewDefaults.url
    this._width = options.width ?? BrowserViewDefaults.width
    this._height = options.height ?? BrowserViewDefaults.height
    this._zoomFactor = options.zoomFactor ?? BrowserViewDefaults.zoomFactor
  }

  public createBrowserWindow () {
    if (this.browserWindow) this.destroyBrowserWindow()

    let width = this.width
    let height = this.height

    if (width > 4096 || height > 4096) {
      const aspectRatio = width / height
      if (width > height) {
        width = 4096
        height = Math.floor(width / aspectRatio)
      } else {
        height = 4096
        width = Math.floor(height * aspectRatio)
      }
    }

    this.browserWindow = new BrowserWindow({
      width,
      height,
      webPreferences: {
        nodeIntegration: false,
        sandbox: true,
        contextIsolation: true,
        webSecurity: true,
        backgroundThrottling: false
      },
      paintWhenInitiallyHidden: true,
      enableLargerThanScreen: true,
      skipTaskbar: true,
      opacity: 0,
      frame: false,
      resizable: false
    })

    this.browserWindow.setMenuBarVisibility(false)
    this.browserWindow.on('close', (event) => {
      event.preventDefault()
      this.hide()
    })

    this.browserWindow.loadURL(this.url)
    this.browserWindow.webContents.on('did-finish-load', () => {
      console.log('did-finish-load')
      this.browserWindow?.webContents.setZoomFactor(this.zoomFactor)
      this.browserWindow?.webContents.setFrameRate(30)
      this.browserWindow?.webContents.startPainting()
      this.browserWindow?.focus()
    })
  }

  public destroyBrowserWindow () {
    if (!this.browserWindow) return

    this.browserWindow.destroy()
    this.browserWindow = null
  }

  public async createStream () {
    console.log(this.browserWindow?.getMediaSourceId())
    return this.browserWindow?.getMediaSourceId()
  }

  public set (options: Partial<BrowserViewOptions>) {
    if (options.url !== undefined && this.url !== options.url) {
      this.url = options.url
      this.browserWindow?.loadURL(this.url)
    }
    if ((options.width !== undefined && this.width !== options.width) || (options.height !== undefined && this.height !== options.height)) {
      this.width = options.width ?? this.width
      this.height = options.height ?? this.height

      if (this.browserWindow) {
        let width = this.width
        let height = this.height

        if (width > 4096 || height > 4096) {
          const aspectRatio = width / height
          if (width > height) {
            width = 4096
            height = Math.floor(width / aspectRatio)
          } else {
            height = 4096
            width = Math.floor(height * aspectRatio)
          }
        }

        this.browserWindow.setSize(width, height)
      }
    }
    if (options.zoomFactor !== undefined && this.zoomFactor !== options.zoomFactor) {
      this.zoomFactor = options.zoomFactor
      this.browserWindow?.webContents.setZoomFactor(this.zoomFactor)
    }
  }

  public show () {
    this.browserWindow?.setOpacity(1)
    this.browserWindow?.setSkipTaskbar(false)
    this.browserWindow?.focus()
  }

  public hide () {
    this.browserWindow?.setOpacity(0)
    this.browserWindow?.setSkipTaskbar(true)
  }

  static browserViews: BrowserView[] = []
  static async requestBrowserView (id: string, options?: Partial<BrowserViewOptions>) {
    let browserView = this.browserViews.find((browserView) => browserView.id === id)
    if (!browserView) {
      browserView = new BrowserView(id, options)
      browserView.createBrowserWindow()
      BrowserView.browserViews.push(browserView)
    }

    browserView.set(options ?? {})
    return browserView.createStream()
  }

  static async show (id: string) {
    const browserView = this.browserViews.find((browserView) => browserView.id === id)
    if (!browserView) return

    browserView.show()
  }

  static async hide (id: string) {
    const browserView = this.browserViews.find((browserView) => browserView.id === id)
    if (!browserView) return

    browserView.hide()
  }
}