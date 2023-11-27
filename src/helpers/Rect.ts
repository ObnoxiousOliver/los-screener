import { JsonObject, TransferableObject } from '../canvas/TransferableObject'
import { Vec2 } from './Vec2'

export interface RectJSON extends JsonObject {
  x: number
  y: number
  width: number
  height: number
}

export class Rect extends TransferableObject {
  x: number
  y: number
  width: number
  height: number

  constructor(x?: number, y?: number, width?: number, height?: number) {
    super()
    this.x = x ?? 0
    this.y = y ?? 0
    this.width = width ?? 0
    this.height = height ?? 0
  }

  get left() { return this.x }
  get top() { return this.y }
  get right() { return this.x + this.width }
  get bottom() { return this.y + this.height }

  set left(value: number) { this.x = value }
  set top(value: number) { this.y = value }
  set right(value: number) { this.x = value - this.width }
  set bottom(value: number) { this.y = value - this.height }

  get center() { return new Vec2(this.x + this.width / 2, this.y + this.height / 2) }
  set center(value: Vec2) { this.x = value.x - this.width / 2; this.y = value.y - this.height / 2 }

  equals(rect: Rect) {
    return this.x === rect.x && this.y === rect.y && this.width === rect.width && this.height === rect.height
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  fromJSON(json: any) {
    this.x = json.x
    this.y = json.y
    this.width = json.width
    this.height = json.height
  }

  static fromJSON(json: any) {
    return new Rect(json?.x, json?.y, json?.width, json?.height)
  }

  static clone (rect: Rect) {
    return new Rect(rect.x, rect.y, rect.width, rect.height)
  }
}