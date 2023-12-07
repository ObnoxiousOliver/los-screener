import { id } from '../helpers/Id'
import { Margin, MarginJSON } from '../helpers/Margin'
import { Rect, RectJSON } from '../helpers/Rect'
import { TransformMatrix, TransformMatrixJSON } from '../helpers/TransformMatrix'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface SlotOptions {
  id: string
  crop: Margin
  transformMatrix: TransformMatrix
  visible: boolean
}

export interface SlotJSON extends JsonObject {
  id: string
  rect: RectJSON
  crop: MarginJSON
  component: string
  transformMatrix: TransformMatrixJSON
  visible: boolean
}

export class Slot extends TransferableObject {
  id: string
  rect: Rect
  componentId: string
  crop: Margin
  transformMatrix: TransformMatrix
  visible: boolean

  constructor (rect: Rect, componentId: string, options?: Partial<SlotOptions>) {
    super()
    this.id = options?.id ?? id()
    this.rect = rect
    this.componentId = componentId
    this.crop = options?.crop ?? new Margin()
    this.transformMatrix = options?.transformMatrix ?? new TransformMatrix(1, 0, 0, 1, 0, 0)
    this.visible = options?.visible ?? true
  }

  toJSON (): SlotJSON {
    return {
      id: this.id,
      rect: this.rect.toJSON(),
      crop: this.crop.toJSON(),
      component: this.componentId,
      transformMatrix: this.transformMatrix.toJSON(),
      visible: this.visible
    }
  }

  fromJSON (json: Partial<SlotJSON>): void {
    if (json.id !== undefined && this.id !== json.id) this.id = json.id
    if (json.component !== undefined && this.componentId !== json.component) this.componentId = json.component
    if (json.rect !== undefined && !this.rect.equals(Rect.fromJSON(json.rect))) this.rect = Rect.fromJSON(json.rect)
    if (json.crop !== undefined && !this.crop.equals(Margin.fromJSON(json.crop))) this.crop = Margin.fromJSON(json.crop)
    if (json.transformMatrix !== undefined && !this.transformMatrix.equals(TransformMatrix.fromJSON(json.transformMatrix))) this.transformMatrix = TransformMatrix.fromJSON(json.transformMatrix)
    if (json.visible !== undefined && this.visible !== json.visible) this.visible = json.visible
  }

  static fromJSON (json: Partial<SlotJSON>): Slot {
    if (json.component === undefined) throw new Error('Component is required')

    return new Slot(Rect.fromJSON(json.rect), json.component, {
      id: json.id ?? id(),
      crop: json.crop !== undefined ? Margin.fromJSON(json.crop) : undefined,
      transformMatrix: json.transformMatrix !== undefined ? TransformMatrix.fromJSON(json.transformMatrix) : undefined,
      visible: json.visible
    })
  }
}