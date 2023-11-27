import { Canvas } from './Canvas'
import { Slot, SlotJSON } from './Slot'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface SceneSetup {
  [key: string]: Slot[]
}

export interface SceneOptions {
  id: string
  name: string
  sceneSetup: SceneSetup
}

export interface SceneJSON extends JsonObject {
  id: string
  name: string
  sceneSetup: Record<string, SlotJSON[]>
}

export class Scene extends TransferableObject {
  id: string
  name: string
  sceneSetup: SceneSetup

  constructor (options?: Partial<SceneOptions>) {
    super()
    this.id = options?.id ?? Math.random().toString(36).substring(2, 15)
    this.name = options?.name ?? 'New Scene'
    this.sceneSetup = options?.sceneSetup ?? {}
  }

  public toJSON (): SceneJSON {
    return {
      id: this.id,
      name: this.name,
      sceneSetup: Object.keys(this.sceneSetup).map(key => ({
        [key]: this.sceneSetup[key].map(slot => slot.toJSON())
      })).reduce((acc, val) => ({ ...acc, ...val }), {})
    }
  }

  fromJSON (json: SceneJSON): void {
    if (this.id !== json.id) this.id = json.id
    if (this.name !== json.name) this.name = json.name
    if (JSON.stringify(this.sceneSetup) !== JSON.stringify(json.sceneSetup)) {
      this.sceneSetup = Object.keys(json.sceneSetup).map(key => ({
        [key]: json.sceneSetup[key].map(slot => Slot.fromJSON(slot))
      })).reduce((acc, val) => ({ ...acc, ...val }), {})
    }
  }

  static fromCanvases (canvases: Canvas[]): Scene {
    return new Scene({
      sceneSetup: canvases.map(canvas => ({
        [canvas.id]: canvas.children
      })).reduce((acc, val) => ({ ...acc, ...val }), {})
    })
  }
}