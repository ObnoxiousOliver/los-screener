import { Component, ComponentJSON, ComponentOptions } from '../Component'
import { Property, PropertyCtx } from '../Property'
import { Slot } from '../Slot'

export interface TextOptions {
  content: string
  fontSize: number
}

export const TextDefaults: TextOptions = {
  content: '',
  fontSize: 16
}

export interface TextJSON extends ComponentJSON {
  type: 'text'
  content: string
  fontSize: number
}

export class Text extends Component {
  static type = 'text'
  content: string
  fontSize: number

  constructor (options: Partial<TextOptions & ComponentOptions> = {}) {
    super('text', options)
    this.content = options.content ?? TextDefaults.content
    this.fontSize = options.fontSize ?? TextDefaults.fontSize
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

    return element
  }

  override getProperties(ctx: PropertyCtx): Property<any>[] {
    return [
      ...super.getProperties(ctx),
      new Property(
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
        { type: 'number' },
        'Font Size',
        () => this.fontSize,
        (value) => {
          const json = this.toJSON()
          json.fontSize = value
          ctx.update?.(json)
        }
      )
    ]
  }

  public toJSON(): ComponentJSON {
    return {
      ...super.toJSON(),
      content: this.content,
      fontSize: this.fontSize
    }
  }

  fromJSON (json: TextJSON) {
    super.fromJSON(json)
    if (this.content !== json.content) this.content = json.content
    if (this.fontSize !== json.fontSize) this.fontSize = json.fontSize
  }

  static fromJSON (json: TextJSON) {
    return new Text({
      id: json.id,
      name: json.name,
      content: json.content,
      fontSize: json.fontSize
    })
  }
}
