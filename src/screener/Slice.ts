import { id } from '../helpers/Id'
import { Rect, RectJSON } from '../helpers/Rect'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface SliceSetup {
  [sliceId: string]: Rect
}

export interface SliceSetupJSON {
  [sliceId: string]: RectJSON
}

export interface SliceOptions {
  id: string
  name: string
  rect: Rect
}

export interface SliceJSON extends JsonObject {
  id: string
  name: string
  rect: RectJSON
}

export class Slice extends TransferableObject {
  id: string
  name: string
  rect: Rect

  constructor (options?: Partial<SliceOptions>) {
    super()
    this.id = options?.id ?? id()
    this.name = options?.name ?? 'New Slice'
    this.rect = options?.rect ?? new Rect(0, 0, 1920, 1080)
  }

  public toJSON (): SliceJSON {
    return {
      id: this.id,
      name: this.name,
      rect: this.rect.toJSON()
    }
  }

  fromJSON (json: Partial<SliceJSON>): void {
    if (json.id !== undefined && this.id !== json.id) this.id = json.id
    if (json.name !== undefined && this.name !== json.name) this.name = json.name
    if (json.rect !== undefined && JSON.stringify(this.rect) !== JSON.stringify(json.rect)) {
      this.rect = Rect.fromJSON(json.rect)
    }
  }

  static fromJSON (json: Partial<SliceJSON>): Slice {
    return new Slice({
      id: json.id,
      name: json.name,
      rect: Rect.fromJSON(json.rect)
    })
  }
}