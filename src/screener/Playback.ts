import { id } from '../helpers/Id'
import { Timeline, TimelineJSON } from './Timeline'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface PlaybackJSON extends JsonObject {
  id: string
  name: string
  timeline: TimelineJSON
  startTime: number | null
  time: number
}

export interface PlaybackOptions {
  id: string
  name: string
  startTime: number | null
  time: number
}

export class Playback extends TransferableObject {
  id: string
  name: string
  timeline: Timeline

  startTime: number | null
  time: number

  constructor (timeline?: Timeline, options?: Partial<PlaybackOptions>) {
    super()
    this.id = options?.id ?? id()
    this.name = options?.name ?? 'New Playback'
    this.timeline = timeline ?? new Timeline()
    this.startTime = options?.startTime ?? null
    this.time = options?.time ?? 0
  }

  public toJSON (): PlaybackJSON {
    return {
      id: this.id,
      name: this.name,
      timeline: this.timeline.toJSON(),
      startTime: this.startTime,
      time: this.time
    }
  }

  public fromJSON (json: Partial<PlaybackJSON>): void {
    if (json.timeline !== undefined) {
      this.timeline.fromJSON(json.timeline)
    }
    if (json.name !== undefined && typeof json.name === 'string') {
      this.name = json.name
    }

    if (json.startTime !== undefined) {
      this.startTime = json.startTime
    }
    if (json.time !== undefined && typeof json.time === 'number') {
      this.time = json.time ?? 0
    }
  }

  static fromJSON (json: Partial<PlaybackJSON>): Playback {
    return new Playback(
      (json.timeline && Timeline.fromJSON(json.timeline)) ?? undefined,
      {
        id: json.id,
        name: json.name,
        startTime: json.startTime,
        time: json.time
      }
    )
  }
}
