import { Video, VideoStatic } from './Video'

export class PlaybackEntry {
  component: Video | VideoStatic

  // time in seconds
  time: number

  constructor (component: Video | VideoStatic, time: number) {
    this.component = component
    this.time = time
  }

  getStatic (): PlaybackEntryStatic {
    return {
      id: this.component.id,
      time: this.time
    }
  }
}

export interface PlaybackEntryStatic {
  id: string
  time: number
}

export class Playback {
  readonly id: string
  private entries: PlaybackEntry[] = []
  private _playing: boolean = false
  private _time: number = 0
  private _startTime: number = 0

  get playing (): boolean {
    return this._playing
  }

  get entriesCount (): number {
    return this.entries.length
  }

  get totalTime (): number {
    return Math.max(...this.entries.map(e => e.time + e.component.duration))
  }

  constructor (id?: string, entries: PlaybackEntry[] = []) {
    this.id = id ?? Math.random().toString(36).substr(2, 9)
    this.entries = entries
  }

  private timeouts: NodeJS.Timeout[] = []
  play (update: () => void) {
    if (this.playing) return

    this._playing = true
    this._startTime = Date.now() * .001 - this._time

    let done = 0
    for (const entry of this.entries) {
      entry.component.startTime = this._startTime + entry.time

      const timeout = setTimeout(() => {
        entry.component.playing = true
        entry.component.startTime = this._startTime + entry.time
        entry.component.time = entry.component.startTime - Date.now() * .001
        upd()
        this.timeouts = this.timeouts.filter(t => t !== timeout)

        const timeout2 = setTimeout(() => {
          entry.component.playing = false
          done++
          if (done === this.entries.length) {
            this._playing = false
          }
          upd()
          this.timeouts = this.timeouts.filter(t => t !== timeout2)
        }, Math.max(0, (entry.component.duration - entry.component.time) * 1000))
        this.timeouts.push(timeout2)
      }, Math.max(0, (entry.time - this._time) * 1000))
      this.timeouts.push(timeout)
    }

    const upd = () => {
      this._time = Date.now() * .001 - this._startTime
      update()
    }
  }

  pause () {
    if (!this.playing) return

    this._playing = false
    this.timeouts.forEach(t => clearTimeout(t))
    this.timeouts = []

    this._time = Date.now() * .001 - this._startTime
  }

  setEntries (entries: PlaybackEntry[]) {
    this.entries = entries
  }

  addEntry (entry: PlaybackEntry) {
    this.entries.push(entry)
  }

  clearEntries () {
    this.entries = []
  }

  getStaticEntries (): PlaybackEntryStatic[] {
    return this.entries.map(e => e.getStatic())
  }
}
