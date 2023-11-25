import { Vec2 } from './Vec2'

export class Rect {
  x: number
  y: number
  width: number
  height: number

  constructor(x?: number, y?: number, width?: number, height?: number) {
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

  static clone (rect: Rect) {
    return new Rect(rect.x, rect.y, rect.width, rect.height)
  }
}