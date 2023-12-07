import { id } from '../helpers/Id'
import { Property, PropertyCtx } from './Property'
import { JsonObject, TransferableObject } from './TransferableObject'
import { BridgeType } from '../BridgeType'
import { Slot } from './Slot'
import { Editor } from '../editor/Editor'

export interface ComponentOptions {
  id: string
  name: string
}

export interface ComponentJSON extends JsonObject {
  id: string
  name: string
  type: string
}

export const ComponentMap: Record<string, (json: JsonObject) => Component> = {}

export interface RenderCtx {
  isEditor: boolean
  editor?: Editor
  components: Component[]
}

export abstract class Component extends TransferableObject {
  id: string
  name: string
  type: string
  positionable: boolean = true

  constructor (type: string, options?: Partial<ComponentOptions>) {
    super()
    this.id = options?.id ?? id()
    this.name = options?.name ?? 'Component'
    this.type = type
  }

  public abstract render (slot: Slot, ctx: RenderCtx): HTMLElement

  protected actions: Record<string, (...args: any) => void> = {}
  public call (name: string, ...args: any[]): void {
    const action = this.actions[name]
    if (!action) {
      throw new Error(`Action ${name} not found in component ${this.type}`)
    }
    action(...args)
  }

  getProperties (ctx: PropertyCtx): Property<any>[] {
    return [
      new Property(
        'name',
        { type: 'text' },
        'Name',
        () => this.name,
        (value) => {
          const json = this.toJSON()
          json.name = value
          ctx.update?.(json)
        },
        -1
      )
    ]
  }

  public toJSON (): ComponentJSON {
    return {
      id: this.id,
      name: this.name,
      type: this.type
    }
  }

  fromJSON (json: Partial<ComponentJSON>): void {
    if (json.id !== undefined && this.id !== json.id) this.id = json.id
    if (json.name !== undefined && this.name !== json.name) this.name = json.name
    if (json.type !== undefined && this.type !== json.type) this.type = json.type
  }

  static fromJSON (json: Partial<ComponentJSON>): Component {
    const fromJSON = ComponentMap[json.type ?? '']
    if (!fromJSON) {
      throw new Error(`Component type ${json.type} not found in ComponentMap.`)
    }
    return fromJSON(json as JsonObject)
  }
}

declare const bridge: BridgeType
export async function requestMedia (id: string, src: string) {
  if (!document) throw new Error('Method not available in this environment. Must be in a browser.')

  return await bridge.requestMedia(id, src)
}

export interface Plugin {
  name: string
  components: {
    type: string
    name: string
    fromJSON: (json: JsonObject) => any
  }[]
}

export class ComponentFactory {
  public static plugins: Plugin[] = []

  public static registerPlugin (...plugins: Plugin[]): void {
    ComponentFactory.plugins.push(...plugins)

    for (const plugin of plugins) {
      for (const component of plugin.components) {
        ComponentMap[component.type] = component.fromJSON
      }
    }
  }

  public static getComponents (): {
    type: string
    name: string
    fromJSON: (json: JsonObject) => any
  }[] {
    return this.plugins.flatMap((plugin) => plugin.components)
  }
}
