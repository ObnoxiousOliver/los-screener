import { JsonObject, TransferableObject } from '../screener/TransferableObject'
import { Vec2 } from './Vec2'

export interface RectJSON extends JsonObject {
  x: number
  y: number
  width: number
  height: number
}

export class Rect extends TransferableObject {
  private _x: number
  public get x (): number {
    return this._x
  }
  public set x (value: number) {
    this._x = isNaN(value) ? 0 : value ?? 0
  }
  private _y: number
  public get y (): number {
    return this._y
  }
  public set y (value: number) {
    this._y = isNaN(value) ? 0 : value ?? 0
  }
  private _width: number
  public get width (): number {
    return this._width
  }
  public set width (value: number) {
    this._width = isNaN(value) ? 0 : value ?? 0
  }
  private _height: number
  public get height (): number {
    return this._height
  }
  public set height (value: number) {
    this._height = isNaN(value) ? 0 : value ?? 0
  }

  constructor(x?: number, y?: number, width?: number, height?: number) {
    super()
    this._x = x ?? 0
    this._y = y ?? 0
    this._width = width ?? 0
    this._height = height ?? 0
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

  static union(...rects: Rect[]) {
    const left = Math.min(...rects.map(r => r.left))
    const top = Math.min(...rects.map(r => r.top))
    const right = Math.max(...rects.map(r => r.right))
    const bottom = Math.max(...rects.map(r => r.bottom))
    return new Rect(left, top, right - left, bottom - top)
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