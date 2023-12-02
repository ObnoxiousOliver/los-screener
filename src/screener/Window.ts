import { id } from '../helpers/Id'
import { Rect, RectJSON } from '../helpers/Rect'
import { JsonObject, TransferableObject } from './TransferableObject'

export type WindowFit = 'contain' | 'cover' | 'fill'

export interface WindowJSON extends JsonObject {
  id: string
  rect: RectJSON
  sliceId: string | null
}

export interface WindowOptions {
  id?: string
  fit: WindowFit
}
export const WindowDefaults: WindowOptions = {
  fit: 'contain'
}

export class Window extends TransferableObject {
  id: string
  rect: Rect
  sliceId: string | null
  fit: WindowFit = 'contain'

  constructor (rect: Rect, sliceId: string | null = null, options?: Partial<WindowOptions>) {
    super()
    this.id = options?.id ?? id()
    this.rect = rect
    this.sliceId = sliceId
    this.fit = options?.fit ?? WindowDefaults.fit
  }

  public toJSON (): WindowJSON {
    return {
      id: this.id,
      rect: this.rect.toJSON(),
      sliceId: this.sliceId
    }
  }

  public fromJSON (json: WindowJSON): void {
    this.rect = Rect.fromJSON(json)
  }

  static fromJSON (json: WindowJSON): Window {
    return new Window(Rect.fromJSON(json.rect), json.sliceId, {
      id: json.id
    })
  }
}
