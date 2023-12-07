import { id } from '../helpers/Id'
import { Timeline, TimelineJSON } from './Timeline'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface PlaybackJSON extends JsonObject {
  id: string
  timeline: TimelineJSON
}

export class Playback extends TransferableObject {
  id: string
  timeline: Timeline

  constructor (timeline?: Timeline) {
    super()
    this.id = id()
    this.timeline = timeline ?? new Timeline()
  }

  public toJSON (): PlaybackJSON {
    return {
      id: this.id,
      timeline: this.timeline.toJSON()
    }
  }

  public fromJSON (json: Partial<PlaybackJSON>): void {
    if (json.timeline !== undefined) {
      this.timeline.fromJSON(json.timeline)
    }
  }

  static fromJSON (json: Partial<PlaybackJSON>): Playback {
    return new Playback(
      (json.timeline && Timeline.fromJSON(json.timeline)) ?? undefined
    )
  }
}
