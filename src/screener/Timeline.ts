import { JsonObject, TransferableObject } from './TransferableObject'

export interface TimelineJSON extends JsonObject {
  tracks: TrackJSON[]
}

export class Timeline extends TransferableObject {
  tracks: Track[]

  constructor (tracks?: Track[]) {
    super()
    this.tracks = tracks ?? []
  }

  public toJSON (): TimelineJSON {
    return {
      tracks: this.tracks.map(t => t.toJSON())
    }
  }

  public fromJSON (json: Partial<TimelineJSON>): void {
    if (json.tracks !== undefined) {
      for (const track of json.tracks) {
        const existing = this.tracks.find(t => t.component === track.component)
        if (existing) {
          existing.fromJSON(track)
        } else {
          this.tracks.push(Track.fromJSON(track))
        }
      }

      this.tracks = this.tracks.filter(t => json.tracks?.find(t2 => t.component === t2.component))
    }
  }

  static fromJSON (json: Partial<TimelineJSON>): Timeline {
    return new Timeline(
      json.tracks?.map(t => Track.fromJSON(t)) ?? [])
  }
}

export interface TrackJSON extends JsonObject {
  component: string
  range: Range
}

export class Track extends TransferableObject {
  component: string
  range: Range

  constructor (component: string, range?: Partial<Range>) {
    super()
    this.component = component
    this.range = {
      offset: range?.offset ?? 0,
      duration: range?.duration ?? null,
      start: range?.start ?? 0
    }
  }

  public toJSON (): TrackJSON {
    return {
      component: this.component,
      range: this.range
    }
  }

  public fromJSON (json: Partial<TrackJSON>): void {
    if (json.component !== undefined && this.component !== json.component) this.component = json.component
    if (json.range !== undefined) this.range = json.range
  }

  static fromJSON (json: Partial<TrackJSON>): Track {
    return new Track(
      json.component ?? '',
      json.range ?? { offset: 0, duration: 0, start: 0 }
    )
  }
}

// export interface TrackGroupJSON extends JsonObject {
//   component: string
//   tracks: TrackJSON[]
// }

// export class TrackGroup extends TransferableObject {
//   tracks: Track<any>[]
//   component: string

//   constructor (component: string, tracks?: Track<any>[]) {
//     super()
//     this.component = component
//     this.tracks = tracks ?? []
//   }

//   public toJSON (): TrackGroupJSON {
//     return {
//       component: this.component,
//       tracks: this.tracks.map(t => t.toJSON())
//     }
//   }

//   public fromJSON (json: Partial<TrackGroupJSON>): void {
//     if (json.component !== undefined && this.component !== json.component) this.component = json.component
//     if (json.tracks !== undefined) {
//       for (const track of json.tracks) {
//         const existing = this.tracks.find(t => t.property === track.property)
//         if (existing) {
//           existing.fromJSON(track)
//         } else {
//           this.tracks.push(Track.fromJSON(track))
//         }
//       }

//       this.tracks = this.tracks.filter(t => json.tracks?.find(t2 => t.property === t2.property))
//     }
//   }

//   static fromJSON (json: Partial<TrackGroupJSON>): TrackGroup {
//     return new TrackGroup(
//       json.component ?? '',
//       json.tracks?.map(t => Track.fromJSON(t)) ?? [])
//   }
// }

// export interface TrackJSON extends JsonObject {
//   property: string
//   keyframes: KeyframeJSON[]
//   range: JsonObject | null
// }

// export class Track<T> extends TransferableObject {
//   keyframes: Keyframe<T>[]
//   property: string | 'playback'
//   range?: Range

//   constructor (property: string | 'playback', options?: { keyframes?: Keyframe<T>[], range?: Range }) {
//     super()
//     this.property = property
//     this.keyframes = options?.keyframes ?? []
//     this.range = property === 'playback' ? options?.range : undefined
//   }

//   public toJSON (): TrackJSON {
//     return {
//       property: this.property,
//       keyframes: this.keyframes.map(k => k.toJSON()),
//       range: this.range?.toJSON() ?? null
//     }
//   }

//   public fromJSON (json: Partial<TrackJSON>): void {
//     if (json.property !== undefined && this.property !== json.property) this.property = json.property
//     if (json.keyframes !== undefined) {
//       for (const keyframe of json.keyframes) {
//         const existing = this.keyframes.find(k => k.offset === keyframe.offset)
//         if (existing) {
//           existing.fromJSON(keyframe)
//         } else {
//           this.keyframes.push(Keyframe.fromJSON(keyframe))
//         }
//       }

//       this.keyframes = this.keyframes.filter(k => json.keyframes?.find(k2 => k.offset === k2.offset))
//     }
//   }

//   static fromJSON (json: Partial<TrackJSON>): Track<any> {
//     return new Track(
//       json.property ?? '',
//       {
//         keyframes: json.keyframes?.map(k => Keyframe.fromJSON(k)),
//         range: json.range ? Range.fromJSON(json.range) : undefined
//       })
//   }
// }

// export interface KeyframeJSON extends JsonObject {
//   value: any
//   offset: number
//   handle: string | null
// }

// export class Keyframe<T> extends TransferableObject {
//   value: T
//   handle: T extends number ? KeyframeHandle : undefined
//   offset: number

//   constructor (value: T, offset: number, handle?: KeyframeHandle) {
//     super()
//     this.offset = offset

//     if (typeof value === 'number') {
//       this.handle = handle as T extends number ? KeyframeHandle : undefined
//     } else {
//       this.handle = undefined as T extends number ? KeyframeHandle : undefined
//     }

//     this.value = value
//   }

//   public toJSON (): KeyframeJSON {
//     return {
//       offset: this.offset,
//       value: this.value as any,
//       handle: this.handle ?? null
//     }
//   }

//   fromJSON (json: Partial<KeyframeJSON>): void {
//     if (json.value !== undefined && this.value !== json.value) this.value = json.value
//     if (json.offset !== undefined && this.offset !== json.offset) this.offset = json.offset
//     if (json.handle !== undefined && this.handle !== json.handle) this.handle = (json.handle ?? undefined) as T extends number ? KeyframeHandle : undefined
//   }

//   static fromJSON (json: Partial<KeyframeJSON>): Keyframe<any> {
//     return new Keyframe(
//       json.value,
//       json.offset ?? 0,
//       json.handle as any)
//   }
// }

export interface Range extends JsonObject {
  offset: number
  duration: number | null
  start: number
}

export type KeyframeHandle = 'auto' | 'vector' | 'aligned' | 'free'
