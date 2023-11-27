import { id } from '../helpers/Id'
import { Property } from './Property'
import { JsonObject, TransferableObject } from './TransferableObject'

export interface ComponentOptions {
  id: string
  name: string
}

export interface ComponentJSON extends JsonObject {
  id: string
  name: string
  type: string
}

export const ComponentMap: Record<string, (json: any) => any> = {}

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

  getProperties (updateFn?: () => void): Property<any>[] {
    return [
      new Property(
        { type: 'text' },
        'Name',
        () => this.name,
        (value) => {
          this.name = value
          updateFn?.()
        }
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
    const component = ComponentMap[json.type]
    if (!component) throw new Error(`Component type ${json.type} not found`)
    return component(json)
  }
}
