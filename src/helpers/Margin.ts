import { JsonObject, TransferableObject } from '../screener/TransferableObject'

export interface MarginJSON extends JsonObject {
  top: number
  right: number
  bottom: number
  left: number
}

export class Margin extends TransferableObject {
  top: number
  right: number
  bottom: number
  left: number

  constructor(
    top?: number,
    right?: number,
    bottom?: number,
    left?: number
  ) {
    super()

    this.top = top ?? 0
    this.right = right ?? top ?? 0
    this.bottom = bottom ?? top ?? 0
    this.left = left ?? right ?? top ?? 0
  }

  equals(margin: Margin) {
    return this.top === margin.top && this.right === margin.right && this.bottom === margin.bottom && this.left === margin.left
  }

  toJSON() {
    return {
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left
    }
  }

  fromJSON(json: MarginJSON) {
    this.top = json.top ?? 0
    this.right = json.right ?? json.top ?? 0
    this.bottom = json.bottom ?? json.top ?? 0
    this.left = json.left ?? json.right ?? json.top ?? 0
  }

  static fromJSON(json: MarginJSON) {
    const m = new Margin()
    m.fromJSON(json)
    return m
  }

  static clone(margin: Margin) {
    return new Margin(margin.top, margin.right, margin.bottom, margin.left)
  }
}
