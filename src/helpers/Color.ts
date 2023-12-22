import { JsonObject, TransferableObject } from '../screener/TransferableObject'

export interface ColorJSON extends JsonObject {
  r: number
  g: number
  b: number
  a: number
}

export class Color extends TransferableObject {
  private _r: number
  private set r (v: number) { this._r = v }
  public get r () { return this._r }
  private _g: number
  private set g (v: number) { this._g = v }
  public get g () { return this._g }
  private _b: number
  private set b (v: number) { this._b = v }
  public get b () { return this._b }
  private _a: number = 1
  private set a (v: number) { this._a = v }
  public get a () { return this._a }

  private constructor (r: number, g: number, b: number, a: number = 1) {
    super()
    this._r = r
    this._g = g
    this._b = b
    this._a = a

    this.validate()
  }

  private validate (): void {
    if (this.r < 0 || this.r > 255) throw new Error('Invalid red value')
    if (this.g < 0 || this.g > 255) throw new Error('Invalid green value')
    if (this.b < 0 || this.b > 255) throw new Error('Invalid blue value')
    if (this.a < 0 || this.a > 1) throw new Error('Invalid alpha value')
  }

  public toJSON (): ColorJSON {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    }
  }

  public fromJSON(json: ColorJSON): void {
    if (json.r !== undefined && json.r !== this.r) this.r = json.r
    if (json.g !== undefined && json.g !== this.g) this.g = json.g
    if (json.b !== undefined && json.b !== this.b) this.b = json.b
    if (json.a !== undefined && json.a !== this.a) this.a = json.a
  }

  public toHex (): string {
    return '#' + [this.r, this.g, this.b, Math.round(this.a * 255)].map(c => c.toString(16).padStart(2, '0')).join('')
  }

  public toCSS (): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
  }

  public toHSL (): [number, number, number] {
    const r = this.r / 255
    const g = this.g / 255
    const b = this.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }

      h /= 6
    }

    return [h, s, l]
  }

  public toHSV (): [number, number, number] {
    const r = this.r / 255
    const g = this.g / 255
    const b = this.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = 0
    let s = 0
    const v = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }

      h /= 6
    }

    return [h, s, v]
  }

  public static fromJSON (json: ColorJSON): Color {
    return new Color(json.r, json.g, json.b)
  }

  public static fromHex (hex: string): Color {
    if (hex.startsWith('#')) hex = hex.substring(1)
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    if (hex.length === 4) hex = hex.split('').map(c => c + c).join('')
    if (hex.length === 6) hex = hex + 'ff'
    if (hex.length !== 8) throw new Error('Invalid hex value')

    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const a = parseInt(hex.substring(6, 8), 16) / 255

    return new Color(r, g, b, a)
  }

  public static fromRGB (r: number, g: number, b: number, a?: number): Color {
    return new Color(r, g, b, a)
  }

  public static fromHSL (h: number, s: number, l: number): Color {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2

    let r = 0
    let g = 0
    let b = 0

    if (h >= 0 && h < 60) {
      r = c
      g = x
      b = 0
    } else if (h >= 60 && h < 120) {
      r = x
      g = c
      b = 0
    } else if (h >= 120 && h < 180) {
      r = 0
      g = c
      b = x
    } else if (h >= 180 && h < 240) {
      r = 0
      g = x
      b = c
    } else if (h >= 240 && h < 300) {
      r = x
      g = 0
      b = c
    } else if (h >= 300 && h < 360) {
      r = c
      g = 0
      b = x
    }

    return new Color((r + m) * 255, (g + m) * 255, (b + m) * 255)
  }

  public static fromHSV (h: number, s: number, v: number): Color {
    const c = v * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = v - c

    let r = 0
    let g = 0
    let b = 0

    if (h >= 0 && h < 60) {
      r = c
      g = x
      b = 0
    } else if (h >= 60 && h < 120) {
      r = x
      g = c
      b = 0
    } else if (h >= 120 && h < 180) {
      r = 0
      g = c
      b = x
    } else if (h >= 180 && h < 240) {
      r = 0
      g = x
      b = c
    } else if (h >= 240 && h < 300) {
      r = x
      g = 0
      b = c
    } else if (h >= 300 && h < 360) {
      r = c
      g = 0
      b = x
    }

    return new Color((r + m) * 255, (g + m) * 255, (b + m) * 255)
  }

  public static random (): Color {
    return new Color(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255))
  }

  public static readonly Transparent = new Color(0, 0, 0, 0)
  public static readonly AliceBlue = Color.fromHex('#F0F8FF')
  public static readonly AntiqueWhite = Color.fromHex('#FAEBD7')
  public static readonly Aqua = Color.fromHex('#00FFFF')
  public static readonly Aquamarine = Color.fromHex('#7FFFD4')
  public static readonly Azure = Color.fromHex('#F0FFFF')
  public static readonly Beige = Color.fromHex('#F5F5DC')
  public static readonly Bisque = Color.fromHex('#FFE4C4')
  public static readonly Black = Color.fromHex('#000000')
  public static readonly BlanchedAlmond = Color.fromHex('#FFEBCD')
  public static readonly Blue = Color.fromHex('#0000FF')
  public static readonly BlueViolet = Color.fromHex('#8A2BE2')
  public static readonly Brown = Color.fromHex('#A52A2A')
  public static readonly BurlyWood = Color.fromHex('#DEB887')
  public static readonly CadetBlue = Color.fromHex('#5F9EA0')
  public static readonly Chartreuse = Color.fromHex('#7FFF00')
  public static readonly Chocolate = Color.fromHex('#D2691E')
  public static readonly Coral = Color.fromHex('#FF7F50')
  public static readonly CornflowerBlue = Color.fromHex('#6495ED')
  public static readonly Cornsilk = Color.fromHex('#FFF8DC')
  public static readonly Crimson = Color.fromHex('#DC143C')
  public static readonly Cyan = Color.fromHex('#00FFFF')
  public static readonly DarkBlue = Color.fromHex('#00008B')
  public static readonly DarkCyan = Color.fromHex('#008B8B')
  public static readonly DarkGoldenRod = Color.fromHex('#B8860B')
  public static readonly DarkGray = Color.fromHex('#A9A9A9')
  public static readonly DarkGrey = Color.fromHex('#A9A9A9')
  public static readonly DarkGreen = Color.fromHex('#006400')
  public static readonly DarkKhaki = Color.fromHex('#BDB76B')
  public static readonly DarkMagenta = Color.fromHex('#8B008B')
  public static readonly DarkOliveGreen = Color.fromHex('#556B2F')
  public static readonly DarkOrange = Color.fromHex('#FF8C00')
  public static readonly DarkOrchid = Color.fromHex('#9932CC')
  public static readonly DarkRed = Color.fromHex('#8B0000')
  public static readonly DarkSalmon = Color.fromHex('#E9967A')
  public static readonly DarkSeaGreen = Color.fromHex('#8FBC8F')
  public static readonly DarkSlateBlue = Color.fromHex('#483D8B')
  public static readonly DarkSlateGray = Color.fromHex('#2F4F4F')
  public static readonly DarkSlateGrey = Color.fromHex('#2F4F4F')
  public static readonly DarkTurquoise = Color.fromHex('#00CED1')
  public static readonly DarkViolet = Color.fromHex('#9400D3')
  public static readonly DeepPink = Color.fromHex('#FF1493')
  public static readonly DeepSkyBlue = Color.fromHex('#00BFFF')
  public static readonly DimGray = Color.fromHex('#696969')
  public static readonly DimGrey = Color.fromHex('#696969')
  public static readonly DodgerBlue = Color.fromHex('#1E90FF')
  public static readonly FireBrick = Color.fromHex('#B22222')
  public static readonly FloralWhite = Color.fromHex('#FFFAF0')
  public static readonly ForestGreen = Color.fromHex('#228B22')
  public static readonly Fuchsia = Color.fromHex('#FF00FF')
  public static readonly Gainsboro = Color.fromHex('#DCDCDC')
  public static readonly GhostWhite = Color.fromHex('#F8F8FF')
  public static readonly Gold = Color.fromHex('#FFD700')
  public static readonly GoldenRod = Color.fromHex('#DAA520')
  public static readonly Gray = Color.fromHex('#808080')
  public static readonly Grey = Color.fromHex('#808080')
  public static readonly Green = Color.fromHex('#008000')
  public static readonly GreenYellow = Color.fromHex('#ADFF2F')
  public static readonly HoneyDew = Color.fromHex('#F0FFF0')
  public static readonly HotPink = Color.fromHex('#FF69B4')
  public static readonly IndianRed = Color.fromHex('#CD5C5C')
  public static readonly Indigo = Color.fromHex('#4B0082')
  public static readonly Ivory = Color.fromHex('#FFFFF0')
  public static readonly Khaki = Color.fromHex('#F0E68C')
  public static readonly Lavender = Color.fromHex('#E6E6FA')
  public static readonly LavenderBlush = Color.fromHex('#FFF0F5')
  public static readonly LawnGreen = Color.fromHex('#7CFC00')
  public static readonly LemonChiffon = Color.fromHex('#FFFACD')
  public static readonly LightBlue = Color.fromHex('#ADD8E6')
  public static readonly LightCoral = Color.fromHex('#F08080')
  public static readonly LightCyan = Color.fromHex('#E0FFFF')
  public static readonly LightGoldenRodYellow = Color.fromHex('#FAFAD2')
  public static readonly LightGray = Color.fromHex('#D3D3D3')
  public static readonly LightGrey = Color.fromHex('#D3D3D3')
  public static readonly LightGreen = Color.fromHex('#90EE90')
  public static readonly LightPink = Color.fromHex('#FFB6C1')
  public static readonly LightSalmon = Color.fromHex('#FFA07A')
  public static readonly LightSeaGreen = Color.fromHex('#20B2AA')
  public static readonly LightSkyBlue = Color.fromHex('#87CEFA')
  public static readonly LightSlateGray = Color.fromHex('#778899')
  public static readonly LightSlateGrey = Color.fromHex('#778899')
  public static readonly LightSteelBlue = Color.fromHex('#B0C4DE')
  public static readonly LightYellow = Color.fromHex('#FFFFE0')
  public static readonly Lime = Color.fromHex('#00FF00')
  public static readonly LimeGreen = Color.fromHex('#32CD32')
  public static readonly Linen = Color.fromHex('#FAF0E6')
  public static readonly Magenta = Color.fromHex('#FF00FF')
  public static readonly Maroon = Color.fromHex('#800000')
  public static readonly MediumAquaMarine = Color.fromHex('#66CDAA')
  public static readonly MediumBlue = Color.fromHex('#0000CD')
  public static readonly MediumOrchid = Color.fromHex('#BA55D3')
  public static readonly MediumPurple = Color.fromHex('#9370DB')
  public static readonly MediumSeaGreen = Color.fromHex('#3CB371')
  public static readonly MediumSlateBlue = Color.fromHex('#7B68EE')
  public static readonly MediumSpringGreen = Color.fromHex('#00FA9A')
  public static readonly MediumTurquoise = Color.fromHex('#48D1CC')
  public static readonly MediumVioletRed = Color.fromHex('#C71585')
  public static readonly MidnightBlue = Color.fromHex('#191970')
  public static readonly MintCream = Color.fromHex('#F5FFFA')
  public static readonly MistyRose = Color.fromHex('#FFE4E1')
  public static readonly Moccasin = Color.fromHex('#FFE4B5')
  public static readonly NavajoWhite = Color.fromHex('#FFDEAD')
  public static readonly Navy = Color.fromHex('#000080')
  public static readonly OldLace = Color.fromHex('#FDF5E6')
  public static readonly Olive = Color.fromHex('#808000')
  public static readonly OliveDrab = Color.fromHex('#6B8E23')
  public static readonly Orange = Color.fromHex('#FFA500')
  public static readonly OrangeRed = Color.fromHex('#FF4500')
  public static readonly Orchid = Color.fromHex('#DA70D6')
  public static readonly PaleGoldenRod = Color.fromHex('#EEE8AA')
  public static readonly PaleGreen = Color.fromHex('#98FB98')
  public static readonly PaleTurquoise = Color.fromHex('#AFEEEE')
  public static readonly PaleVioletRed = Color.fromHex('#DB7093')
  public static readonly PapayaWhip = Color.fromHex('#FFEFD5')
  public static readonly PeachPuff = Color.fromHex('#FFDAB9')
  public static readonly Peru = Color.fromHex('#CD853F')
  public static readonly Pink = Color.fromHex('#FFC0CB')
  public static readonly Plum = Color.fromHex('#DDA0DD')
  public static readonly PowderBlue = Color.fromHex('#B0E0E6')
  public static readonly Purple = Color.fromHex('#800080')
  public static readonly RebeccaPurple = Color.fromHex('#663399')
  public static readonly Red = Color.fromHex('#FF0000')
  public static readonly RosyBrown = Color.fromHex('#BC8F8F')
  public static readonly RoyalBlue = Color.fromHex('#4169E1')
  public static readonly SaddleBrown = Color.fromHex('#8B4513')
  public static readonly Salmon = Color.fromHex('#FA8072')
  public static readonly SandyBrown = Color.fromHex('#F4A460')
  public static readonly SeaGreen = Color.fromHex('#2E8B57')
  public static readonly SeaShell = Color.fromHex('#FFF5EE')
  public static readonly Sienna = Color.fromHex('#A0522D')
  public static readonly Silver = Color.fromHex('#C0C0C0')
  public static readonly SkyBlue = Color.fromHex('#87CEEB')
  public static readonly SlateBlue = Color.fromHex('#6A5ACD')
  public static readonly SlateGray = Color.fromHex('#708090')
  public static readonly SlateGrey = Color.fromHex('#708090')
  public static readonly Snow = Color.fromHex('#FFFAFA')
  public static readonly SpringGreen = Color.fromHex('#00FF7F')
  public static readonly SteelBlue = Color.fromHex('#4682B4')
  public static readonly Tan = Color.fromHex('#D2B48C')
  public static readonly Teal = Color.fromHex('#008080')
  public static readonly Thistle = Color.fromHex('#D8BFD8')
  public static readonly Tomato = Color.fromHex('#FF6347')
  public static readonly Turquoise = Color.fromHex('#40E0D0')
  public static readonly Violet = Color.fromHex('#EE82EE')
  public static readonly Wheat = Color.fromHex('#F5DEB3')
  public static readonly White = Color.fromHex('#FFFFFF')
  public static readonly WhiteSmoke = Color.fromHex('#F5F5F5')
  public static readonly Yellow = Color.fromHex('#FFFF00')
  public static readonly YellowGreen = Color.fromHex('#9ACD32')
}