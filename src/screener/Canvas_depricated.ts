import { id } from '../helpers/Id'
import { Vec2 } from '../helpers/Vec2'
import { Component } from './Component'
import { Slot, SlotJSON } from './Slot'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface CanvasOptions {
  id: string
  name: string
  size: Vec2
  children: Slot[]
}

export interface CanvasJSON extends JsonObject {
  id: string
  name: string
  size: JsonObject
  children: SlotJSON[]
}

export class Canvas extends TransferableObject {
  id: string
  name: string
  size: Vec2
  children: Slot[]

  constructor (options?: Partial<CanvasOptions>) {
    super()
    this.id = options?.id ?? id()
    this.name = options?.name ?? 'Canvas'
    this.size = options?.size ?? new Vec2(1280, 720)
    this.children = options?.children ?? []
  }

  setChildren (children: Slot[]): void {
    this.children = children
  }

  addChild (child: Slot): void {
    this.children.push(child)
  }

  removeChild (child: Slot): void {
    const index = this.children.indexOf(child)
    if (index > -1) {
      this.children.splice(index, 1)
    }
  }

  private canvasElement: HTMLElement | null = null
  render (components: Component[]): HTMLElement {
    if (!document) throw new Error('Document not found')

    if (!this.canvasElement) {
      this.canvasElement = document.createElement('div')
      this.canvasElement.classList.add('canvas')
      this.canvasElement.dataset.id = this.id
      this.canvasElement.style.position = 'relative'
      this.canvasElement.style.overflow = 'hidden'
    }
    this.canvasElement.style.width = `${this.size.x}px`
    this.canvasElement.style.height = `${this.size.y}px`

    const slotElements: HTMLDivElement[] = Array.from(this.canvasElement.querySelectorAll('div.slot'))
    for (const slotElement of slotElements) {
      const slot = this.children.find(c => c.id === slotElement.dataset.id)
      if (!slot) {
        this.canvasElement.removeChild(slotElement)
      }
    }

    for (const child of this.children) {
      const component = components.find(c => c.id === child.componentId)

      if (component) {
        let slotElement: HTMLDivElement | null = slotElements.find(s => s.dataset.id === child.id) ?? null
        if (!slotElement) {
          slotElement = document.createElement('div')
          slotElement.dataset.id = child.id
          slotElement.classList.add('slot')

          slotElement.style.position = 'absolute'
          slotElement.style.overflow = 'hidden'
          this.canvasElement.appendChild(slotElement)
        }

        slotElement.style.width = `${child.rect.width}px`
        slotElement.style.height = `${child.rect.height}px`
        slotElement.style.left = `${child.rect.x}px`
        slotElement.style.top = `${child.rect.y}px`

        slotElement.style.clipPath = `inset(${child.crop.top}px ${child.crop.right}px ${child.crop.bottom}px ${child.crop.left}px)`

        slotElement.style.transform = child.transformMatrix.toString()
        slotElement.replaceChildren(component.render())
      }
    }

    return this.canvasElement
  }

  toJSON (): CanvasJSON {
    return {
      id: this.id,
      name: this.name,
      size: this.size.toJSON(),
      children: this.children.map(c => c.toJSON())
    }
  }

  fromJSON (json: CanvasJSON): void {
    if (this.id !== json.id) this.id = json.id
    if (this.name !== json.name) this.name = json.name
    if (!this.size.equals(Vec2.fromJSON(json.size))) this.size = Vec2.fromJSON(json.size)
    if (this.children.length !== json.children.length) {
      this.children = json.children.map(c => Slot.fromJSON(c))
    } else {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].fromJSON(json.children[i])
      }
    }
  }

  static fromJSON (json: CanvasJSON): Canvas {
    return new Canvas({
      id: json.id,
      name: json.name,
      size: Vec2.fromJSON(json.size),
      children: json.children.map(c => Slot.fromJSON(c))
    })
  }
}