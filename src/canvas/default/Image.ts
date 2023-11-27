import { Component, ComponentJSON, ComponentOptions, requestMedia } from '../Component'
import { Property } from '../Property'

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

  private element: HTMLImageElement | null = null
  public override render (): HTMLImageElement {
    if (!document) {
      throw new Error('No document found')
    }

    if (!this.element) {
      this.element = document.createElement('img')
      this.element.style.position = 'absolute'
      this.element.style.width = '100%'
      this.element.style.height = '100%'
      this.element.dataset.id = this.id
      this.element.style.fontFamily = 'sans-serif'
      this.element.style.color = 'white'
    }

    if (this.element.dataset.src !== this.src) {
      const requestedSrc = this.src

      this.element.src = ''
      this.element.alt = 'Loading...'
      requestMedia(this.id, this.src).then((src) => {
        if (!this.element) return
        if (requestedSrc !== this.src) return

        if (src === null) {
          this.element.alt = `Failed to load "${this.src}"`
        }

        if (this.element.getAttribute('src') !== src ?? '') {
          this.element.dataset.src = this.src
          this.element.src = src ?? ''
        }
      })
    }

    if (this.element.style.objectFit !== this.fit) this.element.style.objectFit = this.fit

    return this.element
  }

  override getProperties(updateFn: (json: ComponentJSON) => void): Property<any>[] {
    return [
      ...super.getProperties(updateFn),
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
          updateFn?.(json)
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
          updateFn?.(json)
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
