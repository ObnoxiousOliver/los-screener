import { id } from '../helpers/Id'
import { JsonObject } from './TransferableObject'

export interface PlaybackEntry extends JsonObject {
  componentId: string
  action: string
  time: number
}

export interface PlaybackOptions {
  id: string
  entries: PlaybackEntry[]
}

export interface PlaybackJSON extends JsonObject {
  id: string
  entries: PlaybackEntry[]
}

export class Playback {
  private _id: string
  public get id (): string {
    return this._id
  }
  private set id (value: string) {
    this._id = value
  }

  private _entries: PlaybackEntry[]
  public get entries (): PlaybackEntry[] {
    return this._entries
  }
  private set entries (value: PlaybackEntry[]) {
    this._entries = value
  }

  constructor (options?: Partial<PlaybackOptions>) {
    this._id = options?.id ?? id()
    this._entries = options?.entries ?? []
  }

  public add (componentId: string, action: string, time: number): void {
    this.entries.push({ componentId, action, time })
  }

  public toJSON (): PlaybackJSON {
    return {
      id: this.id,
      entries: this.entries
    }
  }

  public fromJSON (json: PlaybackJSON): void {
    this.id = json.id
    this.entries = json.entries
  }

  static fromJSON (json: PlaybackJSON): Playback {
    return new Playback({
      id: json.id,
      entries: json.entries
    })
  }
}
