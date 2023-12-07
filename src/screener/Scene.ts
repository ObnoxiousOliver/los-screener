import { Rect } from '../helpers/Rect'
import { RenderCtx } from './Component'
import { SliceSetup, SliceSetupJSON } from './Slice'
import { Slot, SlotJSON } from './Slot'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface SceneOptions {
  id: string
  name: string
  slots: Slot[]
  sliceSetup: SliceSetup
}

export interface SceneJSON extends JsonObject {
  id: string
  name: string
  slots: SlotJSON[]
  sliceSetup: SliceSetupJSON
}

export class Scene extends TransferableObject {
  id: string
  name: string
  slots: Slot[]
  sliceSetup: SliceSetup

  constructor (options?: Partial<SceneOptions>) {
    super()
    this.id = options?.id ?? Math.random().toString(36).substring(2, 15)
    this.name = options?.name ?? 'New Scene'
    this.slots = options?.slots ?? []
    this.sliceSetup = options?.sliceSetup ?? {}
  }

  private slotElements: [string, HTMLDivElement][] = []
  render (ctx: RenderCtx): HTMLDivElement[] {
    if (!document) {
      throw new Error('Document not found. Scene.render() must be called in a browser environment.')
    }

    for (const slot of this.slots) {
      let slotElement = this.slotElements.find(([id]) => id === slot.id)?.[1]
      let inner = (slotElement?.firstElementChild as HTMLDivElement | undefined) ?? null
      if (!slotElement) {
        slotElement = document.createElement('div')
        slotElement.id = slot.id
        slotElement.classList.add('slot')
        slotElement.style.position = 'absolute'
        slotElement.style.overflow = 'hidden'
      }

      if (!inner) {
        inner = document.createElement('div')
        inner.style.position = 'absolute'
        inner.attachShadow({ mode: 'open' })
        slotElement.appendChild(inner)
      }

      slotElement.style.top = `${slot.rect.y + slot.crop.top}px`
      slotElement.style.left = `${slot.rect.x + slot.crop.left}px`
      slotElement.style.width = `${slot.rect.width - slot.crop.left - slot.crop.right}px`
      slotElement.style.height = `${slot.rect.height - slot.crop.top - slot.crop.bottom}px`

      inner.style.top = `${-slot.crop.top}px`
      inner.style.left = `${-slot.crop.left}px`
      inner.style.width = `${slot.rect.width}px`
      inner.style.height = `${slot.rect.height}px`

      inner.style.transform = slot.transformMatrix.toString()

      inner.style.display = slot.visible ? 'block' : 'none'

      const componentElement = ctx.components.find(c => c.id === slot.componentId)?.render(slot, ctx)
      if (componentElement) {
        inner.shadowRoot!.replaceChildren(componentElement)
      } else {
        inner.shadowRoot!.replaceChildren()
      }

      this.slotElements = [
        ...this.slotElements.filter(([id]) => id !== slot.id),
        [slot.id, slotElement]
      ]
    }

    return this.slotElements.filter(s => this.slots.map(x => x.id).includes(s[0])).map(([, element]) => element)
  }

  addSlot (slot: Slot): void {
    this.slots.push(slot)
  }

  removeSlot (slot: Slot): void {
    const index = this.slots.findIndex(s => s.id === slot.id)
    if (index !== -1) {
      this.slots.splice(index, 1)
    }
  }

  public toJSON (): SceneJSON {
    return {
      id: this.id,
      name: this.name,
      slots: this.slots.map(slot => slot.toJSON()),
      sliceSetup: Object.keys(this.sliceSetup).map(key => ({
        [key]: this.sliceSetup[key].toJSON()
      })).reduce((acc, val) => ({ ...acc, ...val }), {})
    }
  }

  fromJSON (json: Partial<SceneJSON>): void {
    if (json.id && this.id !== json.id) this.id = json.id
    if (json.name && this.name !== json.name) this.name = json.name

    if (json.slots !== undefined && JSON.stringify(this.slots.map(s => s.toJSON())) !== JSON.stringify(json.slots)) {
      this.slots = json.slots.map(slot => Slot.fromJSON(slot))
    }

    if (json.sliceSetup !== undefined && JSON.stringify(this.sliceSetup) !== JSON.stringify(json.slices)) {
      this.sliceSetup = Object.keys(json.sliceSetup).map(key => ({
        [key]: Rect.fromJSON(json.sliceSetup![key])
      })).reduce((acc, val) => ({ ...acc, ...val }), {})
    }
  }

  static fromJSON (json: Partial<SceneJSON>): Scene {
    return new Scene({
      id: json.id,
      name: json.name,
      slots: json.slots?.map(slot => Slot.fromJSON(slot)),
      sliceSetup: json.sliceSetup ? Object.keys(json.sliceSetup).map(key => ({
        [key]: Rect.fromJSON(json.sliceSetup![key])
      })).reduce((acc, val) => ({ ...acc, ...val }), {}) : undefined
    })
  }
}