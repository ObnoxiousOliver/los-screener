import { JsonObject, TransferableObject } from '../canvas/TransferableObject'
import { Vec2 } from './Vec2'

export interface TransformMatrixJSON extends JsonObject {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export class TransformMatrix extends TransferableObject {
  constructor (
    public a: number,
    public b: number,
    public c: number,
    public d: number,
    public e: number,
    public f: number
  ) {
    super()
  }

  multiply (matrix: TransformMatrix): TransformMatrix {
    return new TransformMatrix(
      this.a * matrix.a + this.c * matrix.b,
      this.b * matrix.a + this.d * matrix.b,
      this.a * matrix.c + this.c * matrix.d,
      this.b * matrix.c + this.d * matrix.d,
      this.a * matrix.e + this.c * matrix.f + this.e,
      this.b * matrix.e + this.d * matrix.f + this.f
    )
  }

  inverse (): TransformMatrix {
    const det = this.a * this.d - this.b * this.c

    return new TransformMatrix(
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det
    )
  }

  translate (x: number, y: number): TransformMatrix {
    return this.multiply(new TransformMatrix(1, 0, 0, 1, x, y))
  }

  scale (x: number, y: number): TransformMatrix {
    return this.multiply(new TransformMatrix(x, 0, 0, y, 0, 0))
  }

  rotate (angle: number): TransformMatrix {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return this.multiply(new TransformMatrix(cos, sin, -sin, cos, 0, 0))
  }

  skew (x: number, y: number): TransformMatrix {
    return this.multiply(new TransformMatrix(1, Math.tan(x), Math.tan(y), 1, 0, 0))
  }

  transformPoint (point: Vec2): Vec2 {
    return new Vec2(
      point.x * this.a + point.y * this.c + this.e,
      point.x * this.b + point.y * this.d + this.f
    )
  }

  equals (matrix: TransformMatrix): boolean {
    return this.a === matrix.a && this.b === matrix.b && this.c === matrix.c && this.d === matrix.d && this.e === matrix.e && this.f === matrix.f
  }

  toString (): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`
  }

  static identity (): TransformMatrix {
    return new TransformMatrix(1, 0, 0, 1, 0, 0)
  }

  toJSON(): TransformMatrixJSON {
    return {
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      e: this.e,
      f: this.f
    }
  }

  fromJSON(json: TransformMatrixJSON): void {
    this.a = json.a
    this.b = json.b
    this.c = json.c
    this.d = json.d
    this.e = json.e
    this.f = json.f
  }

  static fromJSON(json: TransformMatrixJSON): TransformMatrix {
    return new TransformMatrix(json.a, json.b, json.c, json.d, json.e, json.f)
  }

  static clone(matrix: TransformMatrix): TransformMatrix {
    return new TransformMatrix(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }
}