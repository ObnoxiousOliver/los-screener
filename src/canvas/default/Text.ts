import { Component, ComponentJSON, ComponentOptions } from '../Component'
import { Property } from '../Property'

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

  private element: HTMLDivElement | null = null
  public override render (): HTMLDivElement {
    if (!document) {
      throw new Error('No document found')
    }

    if (!this.element) {
      this.element = document.createElement('div')
      this.element.style.position = 'absolute'
      this.element.style.width = '100%'
      this.element.style.height = '100%'
      this.element.style.fontFamily = 'sans-serif'
      this.element.style.color = 'white'
      this.element.style.overflow = 'hidden'
      this.element.style.wordBreak = 'break-word'
      this.element.style.lineHeight = '1.5'
    }

    this.element.innerText = this.content
    this.element.style.fontSize = `${this.fontSize}px`

    return this.element
  }

  override getProperties(updateFn: (json: ComponentJSON) => void): Property<any>[] {
    return [
      ...super.getProperties(updateFn),
      new Property(
        { type: 'textbox' },
        'Content',
        () => this.content,
        (value) => {
          const json = this.toJSON()
          json.content = value
          updateFn?.(json)
        }
      ),
      new Property(
        { type: 'number' },
        'Font Size',
        () => this.fontSize,
        (value) => {
          const json = this.toJSON()
          json.fontSize = value
          updateFn?.(json)
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
