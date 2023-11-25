import { Component, ComponentOptions, ComponentStatic, PropertyValue } from './Component'
import { Rect } from '../helpers/Rect'

export type VideoFit = 'contain' | 'cover' | 'fill'

export interface VideoOptions {
  src: string
  objectFit: VideoFit
  time: number
}

export interface VideoStatic extends ComponentStatic {
  src: string
  objectFit: VideoFit,
  playing: boolean,
  volume: number,
  time: number,
  startTime: number
  duration: number
}

export class Video extends Component {
  type: string = 'video'
  el: HTMLVideoElement
  src: string = ''
  objectFit: VideoFit = 'contain'
  playing: boolean = false
  time: number = 0
  startTime: number = 0
  volume: number = 1
  duration: number = 0

  constructor (options: Partial<VideoOptions & ComponentOptions> = {}) {
    super(options)
    this.el = document.createElement('video')
    this.src = options.src ?? ''
    this.el.src = this.src
    this.el.volume = this.volume
    this.objectFit = options.objectFit ?? 'contain'
    this.el.currentTime = options.time ?? 0

    this.el.addEventListener('loadedmetadata', () => {
      this.duration = this.el.duration
    })
    this.el.addEventListener('play', () => {
      this.playing = true
    })
    this.el.addEventListener('pause', () => {
      this.playing = false
    })
    this.el.addEventListener('timeupdate', () => {
      this.time = this.el.currentTime
      this.update()
    })
  }

  getRect(): Rect {
    return this.rect
  }

  static override getProperties(component: VideoStatic): Record<string, PropertyValue> {
    return {
      ...super.getProperties(component),
      src: new PropertyValue({
        name: 'Source',
        value: component.src,
        type: 'string',
        set: (src: string) => component.src = src
      }),
      objectFit: new PropertyValue({
        name: 'Object Fit',
        value: component.objectFit,
        type: 'select',
        meta: {
          options: ['contain', 'cover', 'fill']
        },
        set: (objectFit: VideoFit) => {
          console.log('set object fit', objectFit)
          component.objectFit = objectFit
        }
      })
    }
  }

  render(editor: boolean = false): HTMLElement {
    this.el.style.position = 'absolute'
    this.el.style.left = this.rect.x + 'px'
    this.el.style.top = this.rect.y + 'px'
    this.el.style.width = this.rect.width + 'px'
    this.el.style.height = this.rect.height + 'px'
    this.el.style.backgroundColor = '#000'
    this.el.style.objectFit = this.objectFit
    this.el.style.transform = `scaleX(${this.flipX ? -1 : 1}) scaleY(${this.flipY ? -1 : 1})`
    this.el.volume = editor ? 0 : this.volume

    if (this.src !== this.el.getAttribute('src')) {
      console.log('set src', this.src, this.el.src)
      this.el.src = this.src
    }

    return this.el
  }

  override getStatic(): VideoStatic {
    return {
      ...super.getStatic(),
      src: this.src,
      objectFit: this.objectFit,
      playing: this.playing,
      volume: this.volume,
      time: this.time,
      startTime: this.startTime,
      duration: this.duration
    }
  }

  override fromStatic(staticComponent: Partial<VideoStatic>): void {
    super.fromStatic(staticComponent)
    console.log('fromStatic', staticComponent.src !== this.src)
    staticComponent.src !== undefined && staticComponent.src !== this.src && (this.src = staticComponent.src)
    staticComponent.objectFit !== undefined && staticComponent.objectFit !== this.objectFit && (this.objectFit = staticComponent.objectFit)
    staticComponent.playing !== undefined && staticComponent.playing !== this.playing && (this.playing = staticComponent.playing)

    staticComponent.startTime !== undefined && staticComponent.startTime !== this.startTime && (this.startTime = staticComponent.startTime)
    if (staticComponent.time !== undefined) {
      this.time = staticComponent.time

      if (!staticComponent.playing || Math.abs(Date.now() * 0.001 - this.el.currentTime - this.startTime) > 50) {
        this.el.currentTime = this.startTime ? Date.now() * 0.001 - this.startTime : this.time
      }
    }

    if (staticComponent.playing === this.el.paused) {
      staticComponent.playing ? this.el.play() : this.el.pause()
    }
  }
}