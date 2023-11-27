import { Component, ComponentJSON, ComponentOptions, requestMedia } from '../Component'
import { Property } from '../Property'

export type VideoFit = 'contain' | 'cover' | 'fill'

export interface VideoOptions {
  src: string
  objectFit: VideoFit
  volume: number
}

export const VideoDefaults: VideoOptions = {
  src: '',
  objectFit: 'contain',
  volume: 1
}

export interface VideoJSON extends ComponentJSON {
  type: 'video'
  src: string
  fit: VideoFit
  volume: number
}

export class Video extends Component {
  static type = 'video'
  src: string
  fit: VideoFit
  volume: number

  constructor (options: Partial<VideoOptions & ComponentOptions> = {}) {
    super('video', options)
    this.src = options.src ?? VideoDefaults.src
    this.fit = options.objectFit ?? VideoDefaults.objectFit
    this.volume = options.volume ?? VideoDefaults.volume
  }

  private element: HTMLVideoElement | null = null
  public override render (): HTMLVideoElement {
    if (!document) {
      throw new Error('No document found')
    }

    if (!this.element) {
      this.element = document.createElement('video')
      this.element.style.position = 'absolute'
      this.element.style.width = '100%'
      this.element.style.height = '100%'
    }

    if (this.element.dataset.src !== this.src) {
      const requestedSrc = this.src

      this.element.src = ''
      this.element.innerText = 'Loading...'
      requestMedia(this.id, this.src).then((src) => {
        if (!this.element) return
        if (requestedSrc !== this.src) return

        if (src === null) {
          this.element.innerText = `Failed to load "${this.src}"`
        }

        if (this.element.getAttribute('src') !== src ?? '') {
          this.element.dataset.src = this.src
          this.element.src = src ?? ''
        }
      })
    }

    if (this.element.volume !== this.volume) this.element.volume = this.volume
    if (this.element.style.objectFit !== this.fit) this.element.style.objectFit = this.fit

    return this.element
  }

  override getProperties(updateFn: (json: ComponentJSON) => void): Property<any>[] {
    return [
      ...super.getProperties(updateFn),
      new Property(
        { type: 'text' },
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

  fromJSON (json: VideoJSON) {
    super.fromJSON(json)
    console.log(this.src, json.src)
    if (this.src !== json.src) this.src = json.src
    if (this.fit !== json.fit) this.fit = json.fit
  }

  static fromJSON (json: VideoJSON) {
    return new Video({
      id: json.id,
      name: json.name,
      src: json.src,
      objectFit: json.fit
    })
  }
}
