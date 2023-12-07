// import { Editor } from '../../editor/Editor'
import { Component, ComponentJSON, ComponentOptions, RenderCtx, requestMedia } from '../Component'
import { Property, PropertyCtx } from '../Property'
import { Slot } from '../Slot'

export type VideoFit = 'contain' | 'cover' | 'fill'

export interface VideoOptions {
  src: string
  objectFit: VideoFit
  volume: number
  startTime: number
  playing: boolean
}

export const VideoDefaults: VideoOptions = {
  src: '',
  objectFit: 'contain',
  volume: 1,
  startTime: 0,
  playing: false
}

export interface VideoJSON extends ComponentJSON {
  type: 'video'
  src: string
  fit: VideoFit
  volume: number
  startTime: number
  playing: boolean
}

export class Video extends Component {
  static type = 'video'
  src: string
  fit: VideoFit
  volume: number
  startTime: number
  playing: boolean

  constructor (options: Partial<VideoOptions & ComponentOptions> = {}) {
    super('video', options)
    this.src = options.src ?? VideoDefaults.src
    this.fit = options.objectFit ?? VideoDefaults.objectFit
    this.volume = options.volume ?? VideoDefaults.volume
    this.startTime = options.startTime ?? VideoDefaults.startTime
    this.playing = options.playing ?? VideoDefaults.playing
  }

  protected actions: Record<string, () => void> = {
    play: () => {
      this.playing = true

      for (const id in this.elements) {
        this.elements[id].play()
      }
    },
    pause: () => {
      for (const id in this.elements) {
        this.elements[id].pause()
      }
    }
  }

  private elements: Record<string, HTMLVideoElement> = {}
  public override render (slot: Slot, ctx: RenderCtx): HTMLVideoElement {
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

      element.addEventListener('play', () => {
        ctx.editor?.sendComponentUpdate(this.id, {
          startTime: Date.now() - element.currentTime * 1000
        })
      })
    }

    if (element.dataset.src !== this.src) {
      const requestedSrc = this.src

      element.src = ''
      element.innerText = 'Loading...'
      requestMedia(this.id, this.src).then((src) => {
        if (!element) return
        if (requestedSrc !== this.src) return

        if (src === null) {
          element.innerText = `Failed to load "${this.src}"`
        }

        if (element.getAttribute('src') !== src ?? '') {
          element.dataset.src = this.src
          element.src = src ?? ''
        }

        if (this.playing) {
          console.log('playing', this.startTime, Date.now() - this.startTime)
          element.currentTime = (Date.now() - this.startTime) / 1000
          element.play()
        }
      })
    }

    if (!ctx.isEditor) element.volume = 0
    else if (element.volume !== this.volume) element.volume = this.volume
    if (element.style.objectFit !== this.fit) element.style.objectFit = this.fit

    return element
  }

  override getProperties(ctx: PropertyCtx): Property<any>[] {
    return [
      ...super.getProperties(ctx),
      new Property(
        'src',
        { type: 'text' },
        'Source',
        () => this.src,
        (value) => {
          const json = this.toJSON()
          json.src = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'fit',
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
      ),
      new Property(
        'volume',
        { type: 'number' },
        'Volume',
        () => this.volume,
        (value) => {
          const json = this.toJSON()
          json.volume = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'play',
        {
          type: 'action',
          call: () => {
            ctx.callAction?.('play')
          }
        },
        'Play'
      )
    ]
  }

  public toJSON(): VideoJSON {
    return {
      ...super.toJSON(),
      type: 'video',
      src: this.src,
      fit: this.fit,
      volume: this.volume,
      startTime: this.startTime,
      playing: this.playing
    }
  }

  fromJSON (json: Partial<VideoJSON>) {
    super.fromJSON(json)
    if (json.src !== undefined && this.src !== json.src) this.src = json.src
    if (json.fit !== undefined && this.fit !== json.fit) this.fit = json.fit
    if (json.volume !== undefined && this.volume !== json.volume) this.volume = json.volume
    if (json.startTime !== undefined && this.startTime !== json.startTime) this.startTime = json.startTime
    if (json.playing !== undefined && this.playing !== json.playing) this.playing = json.playing
  }

  static fromJSON (json: Partial<VideoJSON>) {
    return new Video({
      id: json.id,
      name: json.name,
      src: json.src,
      objectFit: json.fit,
      volume: json.volume,
      startTime: json.startTime,
      playing: json.playing
    })
  }
}
