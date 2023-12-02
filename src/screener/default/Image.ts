import { Component, ComponentJSON, ComponentOptions, requestMedia } from '../Component'
import { Property, PropertyCtx } from '../Property'
import { Slot } from '../Slot'

export type ImageFit = 'contain' | 'cover' | 'fill'

export interface ImageOptions {
  src: string
  objectFit: ImageFit
}

export const ImageDefaults: ImageOptions = {
  src: '',
  objectFit: 'contain'
}

export interface ImageJSON extends ComponentJSON {
  type: 'image'
  src: string
  fit: ImageFit
}

export class Image extends Component {
  static type = 'image'
  src: string
  fit: ImageFit

  constructor (options: Partial<ImageOptions & ComponentOptions> = {}) {
    super('image', options)
    this.src = options.src ?? ImageDefaults.src
    this.fit = options.objectFit ?? ImageDefaults.objectFit
  }

  private elements: Record<string, HTMLImageElement> = {}
  override render(slot: Slot): HTMLImageElement {
    if (!document) {
      throw new Error('No document found')
    }

    let element = this.elements[slot.id]

    if (!element) {
      element = document.createElement('img')
      element.style.position = 'absolute'
      element.style.width = '100%'
      element.style.height = '100%'
      element.dataset.id = this.id
      element.style.fontFamily = 'sans-serif'
      element.style.color = 'white'
      this.elements[slot.id] = element
    }

    if (element.dataset.src !== this.src) {
      const requestedSrc = this.src

      element.src = ''
      element.alt = 'Loading...'
      requestMedia(this.id, this.src).then((src) => {
        if (!element) return
        if (requestedSrc !== this.src) return

        if (src === null) {
          element.alt = `Failed to load "${this.src}"`
        }

        if (element.getAttribute('src') !== src ?? '') {
          element.dataset.src = this.src
          element.src = src ?? ''
        }
      })
    }

    if (element.style.objectFit !== this.fit) element.style.objectFit = this.fit

    return element
  }

  override getProperties(ctx: PropertyCtx): Property<any>[] {
    return [
      ...super.getProperties(ctx),
      new Property(
        {
          type: 'text',
          updateOnBlur: true
        },
        'Source',
        () => this.src,
        (value) => {
          const json = this.toJSON()
          json.src = value
          ctx.update?.(json)
        }
      ),
      new Property(
        { type: 'select', options: [
          { label: 'Contain', value: 'contain' },
          { label: 'Cover', value: 'cover' },
          { label: 'Fill', value: 'fill' }
        ] },
        'Fit',
        () => this.fit,
        (value) => {
          const json = this.toJSON()
          json.fit = value
          ctx.update?.(json)
        }
      )
    ]
  }

  public toJSON(): ComponentJSON {
    return {
      ...super.toJSON(),
      src: this.src,
      fit: this.fit
    }
  }

  fromJSON (json: ImageJSON) {
    super.fromJSON(json)
    if (this.src !== json.src) this.src = json.src
    if (this.fit !== json.fit) this.fit = json.fit
  }

  static fromJSON (json: ImageJSON) {
    return new Image({
      id: json.id,
      name: json.name,
      src: json.src,
      objectFit: json.fit
    })
  }
}
