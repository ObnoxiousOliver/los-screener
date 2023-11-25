export class Vec2 {
  x: number
  y: number

  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  mul (scalar: number) {
    return new Vec2(this.x * scalar, this.y * scalar)
  }

  div (scalar: number) {
    return new Vec2(this.x / scalar, this.y / scalar)
  }

  equals(v: Vec2) {
    return this.x === v.x && this.y === v.y
  }

  dot(v: Vec2) {
    return this.x * v.x + this.y * v.y
  }

  length() {
    return Math.sqrt(this.dot(this))
  }

  normalize() {
    return this.mul(1 / this.length())
  }

  rotate(rad: number) {
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c)
  }

  angle() {
    return Math.atan2(this.y, this.x)
  }

  static fromAngle(angle: number) {
    return new Vec2(Math.cos(angle), Math.sin(angle))
  }

  static distance(a: Vec2, b: Vec2) {
    return a.sub(b).length()
  }

  static lerp(a: Vec2, b: Vec2, t: number) {
    return a.add(b.sub(a).mul(t))
  }

  static clone(v: Vec2) {
    return new Vec2(v.x, v.y)
  }

  static ZERO = new Vec2()
  static ONE = new Vec2(1, 1)
  static UP = new Vec2(0, 1)
  static DOWN = new Vec2(0, -1)
  static LEFT = new Vec2(-1, 0)
  static RIGHT = new Vec2(1, 0)
}