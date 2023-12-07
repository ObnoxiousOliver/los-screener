import { Color, ColorJSON } from '../../helpers/Color'
import { Component, ComponentJSON, ComponentOptions } from '../Component'
import { Property, PropertyCtx } from '../Property'
import { Slot } from '../Slot'

export type TextAlign = 'left' | 'center' | 'right'

export interface TextOptions {
  content: string
  fontSize: number
  fontFamily: string
  color: Color
  strikethrough: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
  lineHeight: number
  letterSpacing: number
}

export const TextDefaults: TextOptions = {
  content: 'Text',
  fontSize: 16,
  fontFamily: 'Arial',
  color: Color.White,
  strikethrough: false,
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
  lineHeight: 1.5,
  letterSpacing: 0
}

export interface TextJSON extends ComponentJSON {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  color: ColorJSON
  strikethrough: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
  lineHeight: number
  letterSpacing: number
}

export class Text extends Component {
  static type = 'text'
  content: string
  fontSize: number
  fontFamily: string
  color: Color
  strikethrough: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
  lineHeight: number
  letterSpacing: number

  constructor (options: Partial<TextOptions & ComponentOptions> = {}) {
    super('text', options)
    this.content = options.content ?? TextDefaults.content
    this.fontSize = options.fontSize ?? TextDefaults.fontSize
    this.fontFamily = options.fontFamily ?? TextDefaults.fontFamily
    this.color = options.color ?? TextDefaults.color
    this.strikethrough = options.strikethrough ?? TextDefaults.strikethrough
    this.bold = options.bold ?? TextDefaults.bold
    this.italic = options.italic ?? TextDefaults.italic
    this.underline = options.underline ?? TextDefaults.underline
    this.align = options.align ?? TextDefaults.align
    this.lineHeight = options.lineHeight ?? TextDefaults.lineHeight
    this.letterSpacing = options.letterSpacing ?? TextDefaults.letterSpacing
  }

  private elements: Record<string, HTMLDivElement> = {}
  public override render (slot: Slot): HTMLDivElement {
    if (!document) {
      throw new Error('No document found')
    }

    let element = this.elements[slot.id]

    if (!element) {
      element = document.createElement('div')
      element.style.position = 'absolute'
      element.style.width = '100%'
      element.style.height = '100%'
      element.style.fontFamily = 'sans-serif'
      element.style.color = 'white'
      element.style.overflow = 'hidden'
      element.style.wordBreak = 'break-word'
      element.style.lineHeight = '1.5'
      this.elements[slot.id] = element
    }

    element.innerText = this.content
    element.style.fontSize = `${this.fontSize}px`
    element.style.fontFamily = this.fontFamily
    element.style.color = this.color.toCSS()
    element.style.fontWeight = this.bold ? 'bold' : 'normal'
    element.style.fontStyle = this.italic ? 'italic' : 'normal'
    element.style.textAlign = this.align
    element.style.lineHeight = `${this.lineHeight}`
    element.style.letterSpacing = `${this.letterSpacing}px`

    if (this.underline && this.strikethrough) { element.style.textDecoration = 'underline line-through' }
    else if (this.underline) { element.style.textDecoration = 'underline' }
    else if (this.strikethrough) { element.style.textDecoration = 'line-through' }
    else { element.style.textDecoration = 'none' }

    return element
  }

  override getProperties(ctx: PropertyCtx): Property<any>[] {
    return [
      ...super.getProperties(ctx),
      new Property(
        'content',
        { type: 'textbox' },
        'Content',
        () => this.content,
        (value) => {
          const json = this.toJSON()
          json.content = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'fontSize',
        { type: 'number' },
        'Font Size',
        () => this.fontSize,
        (value) => {
          const json = this.toJSON()
          json.fontSize = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'fontFamily',
        { type: 'font' },
        'Font Family',
        () => this.fontFamily,
        (value) => {
          const json = this.toJSON()
          json.fontFamily = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'color',
        { type: 'color' },
        'Color',
        () => this.color.toHex(),
        (value) => {
          const json = this.toJSON()
          json.color = Color.fromHex(value).toJSON()
          ctx.update?.(json)
        }
      ),
      new Property(
        'strikethrough',
        { type: 'checkbox' },
        'Strikethrough',
        () => this.strikethrough,
        (value) => {
          const json = this.toJSON()
          json.strikethrough = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'bold',
        { type: 'checkbox' },
        'Bold',
        () => this.bold,
        (value) => {
          const json = this.toJSON()
          json.bold = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'italic',
        { type: 'checkbox' },
        'Italic',
        () => this.italic,
        (value) => {
          const json = this.toJSON()
          json.italic = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'underline',
        { type: 'checkbox' },
        'Underline',
        () => this.underline,
        (value) => {
          const json = this.toJSON()
          json.underline = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'align',
        { type: 'select', options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' }
        ] },
        'Align',
        () => this.align,
        (value) => {
          const json = this.toJSON()
          json.align = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'lineHeight',
        { type: 'number' },
        'Line Height',
        () => this.lineHeight,
        (value) => {
          const json = this.toJSON()
          json.lineHeight = value
          ctx.update?.(json)
        }
      ),
      new Property(
        'letterSpacing',
        { type: 'number' },
        'Letter Spacing',
        () => this.letterSpacing,
        (value) => {
          const json = this.toJSON()
          json.letterSpacing = value
          ctx.update?.(json)
        }
      )
    ]
  }

  public toJSON(): ComponentJSON {
    return {
      ...super.toJSON(),
      content: this.content,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      color: this.color.toJSON(),
      strikethrough: this.strikethrough,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      align: this.align,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing
    }
  }

  fromJSON (json: Partial<TextJSON>) {
    super.fromJSON(json)
    if (json.content !== undefined && this.content !== json.content) this.content = json.content
    if (json.fontSize !== undefined && this.fontSize !== json.fontSize) this.fontSize = json.fontSize
    if (json.fontFamily !== undefined && this.fontFamily !== json.fontFamily) this.fontFamily = json.fontFamily
    if (json.color !== undefined && JSON.stringify(this.color.toJSON()) !== JSON.stringify(json.color)) this.color.fromJSON(json.color)
    if (json.strikethrough !== undefined && this.strikethrough !== json.strikethrough) this.strikethrough = json.strikethrough
    if (json.bold !== undefined && this.bold !== json.bold) this.bold = json.bold
    if (json.italic !== undefined && this.italic !== json.italic) this.italic = json.italic
    if (json.underline !== undefined && this.underline !== json.underline) this.underline = json.underline
    if (json.align !== undefined && this.align !== json.align) this.align = json.align
    if (json.lineHeight !== undefined && this.lineHeight !== json.lineHeight) this.lineHeight = json.lineHeight
    if (json.letterSpacing !== undefined && this.letterSpacing !== json.letterSpacing) this.letterSpacing = json.letterSpacing
  }

  static fromJSON (json: TextJSON) {
    return new Text({
      id: json.id,
      name: json.name,
      content: json.content,
      fontSize: json.fontSize,
      fontFamily: json.fontFamily,
      color: json.color && Color.fromJSON(json.color),
      strikethrough: json.strikethrough,
      bold: json.bold,
      italic: json.italic,
      underline: json.underline,
      align: json.align,
      lineHeight: json.lineHeight,
      letterSpacing: json.letterSpacing
    })
  }
}
