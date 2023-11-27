import { id } from '../helpers/Id'
import { Property } from './Property'
import { JsonObject, TransferableObject } from './TransferableObject'
import { BridgeType } from '../BridgeType'

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

  public abstract render (): HTMLElement

  getProperties (updateFn: (json: ComponentJSON) => void): Property<any>[] {
    return [
      new Property(
        { type: 'text' },
        'Name',
        () => this.name,
        (value) => {
          const json = this.toJSON()
          json.name = value
          updateFn?.(json)
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

  fromJSON (json: ComponentJSON): void {
    this.id = json.id
    this.name = json.name
    this.type = json.type
  }

  static fromJSON (json: ComponentJSON): Component {
    const fromJSON = ComponentMap[json.type]
    if (!fromJSON) {
      throw new Error(`Component type ${json.type} not found in ComponentMap.`)
    }
    return fromJSON(json)
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
}
