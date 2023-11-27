import { Component, ComponentJSON, ComponentMap, ComponentOptions } from './Component'
import { Property } from './Property'

export type VideoFit = 'contain' | 'cover' | 'fill'

export interface VideoOptions {
  src: string
  objectFit: VideoFit
}

export const VideoDefaults: VideoOptions = {
  src: '',
  objectFit: 'contain'
}

export interface VideoJSON extends ComponentJSON {
  type: 'video'
  src: string
  fit: VideoFit
}

export class Video extends Component {
  declare type: 'video'
  src: string
  fit: VideoFit

  constructor (options: Partial<VideoOptions & ComponentOptions> = {}) {
    super('video', options)
    this.src = options.src ?? VideoDefaults.src
    this.fit = options.objectFit ?? VideoDefaults.objectFit
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

    if (this.element.getAttribute('src') !== this.src) this.element.src = this.src
    if (this.element.style.objectFit !== this.fit) this.element.style.objectFit = this.fit

    return this.element
  }

  override getProperties(updateFn?: () => void): Property<any>[] {
    return [
      ...super.getProperties(),
      new Property(
        { type: 'text' },
        'Source',
        () => this.src,
        (value) => {
          this.src = value
          updateFn?.()
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
          this.fit = value
          updateFn?.()
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

ComponentMap['video'] = Video.fromJSON