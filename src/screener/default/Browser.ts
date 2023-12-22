// import { Editor } from '../../editor/Editor'
import { Vec2 } from '../../helpers/Vec2'
import { Component, ComponentJSON, ComponentOptions, InvokeComponentActionContext, requestBrowserView } from '../Component'
import { Property, PropertyCtx } from '../Property'
import { Slot } from '../Slot'
import { JsonObject } from '../TransferableObject'

export interface BrowserOptions {
  url: string
  size: Vec2
  zoomFactor: number
}

export const BrowserDefaults: BrowserOptions = {
  url: 'about:blank',
  size: new Vec2(800, 600),
  zoomFactor: 1
}

export interface BrowserJSON extends ComponentJSON {
  type: 'browser'
  url: string
  size: JsonObject
  zoomFactor: number
}

export class Browser extends Component {
  static type = 'browser'
  url: string
  size: Vec2
  zoomFactor: number

  constructor (options: Partial<BrowserOptions & ComponentOptions> = {}) {
    super('Browser', options)
    this.url = options.url ?? BrowserDefaults.url
    this.size = options.size ?? Vec2.clone(BrowserDefaults.size)
    this.zoomFactor = options.zoomFactor ?? BrowserDefaults.zoomFactor
  }

  private elements: Record<string, HTMLVideoElement> = {}
  public override render (slot: Slot): HTMLVideoElement {
    if (!document) {
      throw new Error('No document found')
    }

    let element = this.elements[slot.id]

    if (!element) {
      element = document.createElement('video')
      element.style.position = 'absolute'
      element.style.width = '100%'
      element.style.height = '100%'
      this.elements[slot.id] = element
    }

    if (!element.dataset.mediaId ||
      element.dataset.width !== this.size.x.toString() ||
      element.dataset.height !== this.size.y.toString() ||
      element.dataset.zoomFactor !== this.zoomFactor.toString() ||
      element.dataset.url !== this.url) {
      requestBrowserView(this.id, this.url, this.size.x, this.size.y, this.zoomFactor)
        .then(async (mediaId) => {
          if (!element) return
          if (!mediaId) return

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              // @ts-expect-error - this is a electron-only property
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: mediaId
              }
            }
          })

          element.dataset.mediaId = mediaId
          element.dataset.width = this.size.x.toString()
          element.dataset.height = this.size.y.toString()
          element.dataset.zoomFactor = this.zoomFactor.toString()
          element.dataset.url = this.url

          element.srcObject = stream
          element.play()
        })
    }
    return element
  }

  protected actions: Record<string, (ctx: InvokeComponentActionContext, ...args: any) => void> = {
    interact: (ctx) => {
      if (ctx.isEditor) return

      ctx.media?.interactBrowserView(this.id)
    }
  }

  override getProperties(ctx: PropertyCtx): Property<any>[] {
    return [
      ...super.getProperties(ctx),
      new Property(
        'url',
        { type: 'text', updateOnBlur: true },
        'URL',
        () => this.url,
        (value) => {
          const json = this.toJSON()
          json.url = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'size',
        { type: 'vec2' },
        'Size',
        () => this.size,
        (value) => {
          const json = this.toJSON()
          json.size = value.toJSON()
          ctx.update?.(json)
        }
      ),
      new Property(
        'zoomFactor',
        { type: 'number' },
        'Zoom Factor',
        () => this.zoomFactor,
        (value) => {
          const json = this.toJSON()
          json.zoomFactor = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'interact',
        { type: 'action', call: () => {
          ctx.callAction?.('interact')
        } },
        'Interact'
      )
    ]
  }

  public toJSON(): BrowserJSON {
    return {
      ...super.toJSON(),
      type: 'browser',
      url: this.url,
      size: this.size.toJSON(),
      zoomFactor: this.zoomFactor
    }
  }

  fromJSON (json: Partial<BrowserJSON>) {
    super.fromJSON(json)
    if (json.url !== undefined) this.url = json.url
    if (json.size !== undefined) this.size.fromJSON(json.size)
    if (json.zoomFactor !== undefined) this.zoomFactor = json.zoomFactor
  }

  static fromJSON (json: Partial<BrowserJSON>) {
    return new Browser({
      id: json.id,
      name: json.name,
      url: json.url,
      size: json.size && Vec2.fromJSON(json.size),
      zoomFactor: json.zoomFactor
    })
  }
}
