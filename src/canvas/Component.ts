import { Rect } from '../helpers/Rect'

export interface ComponentOptions {
  id: string
  name: string
  opacity: number
  visible: boolean
  flipX?: boolean
  flipY?: boolean
  rect: Rect
}

export const ComponentOptionsDefaults: ComponentOptions = {
  id: '',
  name: 'Component',
  opacity: 1,
  visible: true,
  rect: new Rect(0, 0, 100, 100)
}

export type Resizeable = false | 'x' | 'y' | 'xy'

export interface PropertyValueOptions {
  name: string
  value: any
  type: PropertyValueType
  set?: (value: any) => void
  meta?: Record<string, any>
}
export type PropertyValueType = 'string' | 'number' | 'boolean' | 'xy' | 'rect' | 'select' | 'action'
export class PropertyValue {
  private setFn?: (value: any) => void
  private _value: any
  get value (): any {
    return this._value
  }

  set value (value: any) {
    this._value = value
    this.setFn?.(this._value)
  }

  private _meta: Record<string, any> = {}
  get meta (): Record<string, any> {
    return this._meta
  }

  name: string
  type: PropertyValueType
  constructor (options: PropertyValueOptions) {
    const { name, value, type, set } = options
    this.name = name
    this.setFn = set
    this._meta = options.meta ?? {}

    this._value = typeof value === 'object' ? new Proxy(value, {
      set: (target, prop, value) => {
        target[prop] = value
        this.setFn?.(this._value)
        return true
      },
      get: (target, prop) => {
        return target[prop]
      }
    }) : value
    this.type = type
  }
}

export interface ComponentStatic {
  type: string
  id: string
  name: string
  opacity: number
  visible: boolean
  flipX: boolean
  flipY: boolean
  rect: Rect
  moveable: boolean
  resizeable: Resizeable
}

export abstract class Component {
  abstract type: string
  id: string
  name: string
  opacity: number
  visible: boolean
  flipX: boolean
  flipY: boolean
  protected rect: Rect

  resizeable: Resizeable = 'xy'
  movable: boolean = true

  constructor (options: Partial<ComponentOptions> = {}) {
    this.id = options.id?.length ? options.id : Math.random().toString(36).substr(2, 9)
    this.name = options.name ?? ComponentOptionsDefaults.name
    this.opacity = options.opacity ?? ComponentOptionsDefaults.opacity
    this.visible = options.visible ?? ComponentOptionsDefaults.visible
    this.flipX = options.flipX ?? false
    this.flipY = options.flipY ?? false
    this.rect = options.rect ?? ComponentOptionsDefaults.rect
  }

  static getProperties(component: ComponentStatic): Record<string, PropertyValue> {
    return {
      opacity: new PropertyValue({
        name: 'Opacity',
        value: component.opacity,
        type: 'number',
        set: (opacity: number) => component.opacity = opacity
      }),
      visible: new PropertyValue({
        name: 'Visible',
        value: component.visible,
        type: 'boolean',
        set: (visible: boolean) => component.visible = visible
      }),
      rect: new PropertyValue({
        name: 'Position',
        value: Rect.clone(component.rect),
        type: 'rect',
        set: (rect: Rect) => component.rect = Rect.clone(rect)
      })
    }
  }

  abstract render (editor: boolean): HTMLElement

  getStatic (): ComponentStatic {
    return {
      type: this.type,
      id: this.id,
      name: this.name,
      opacity: this.opacity,
      visible: this.visible,
      flipX: this.flipX,
      flipY: this.flipY,
      rect: Rect.clone(this.rect),
      moveable: this.movable,
      resizeable: this.resizeable
    }
  }

  fromStatic (staticComponent: Partial<ComponentStatic>) {
    staticComponent.id !== undefined && staticComponent.id !== this.id && (this.id = staticComponent.id)
    staticComponent.name !== undefined && staticComponent.name !== this.name && (this.name = staticComponent.name)
    staticComponent.opacity !== undefined && staticComponent.opacity !== this.opacity && (this.opacity = staticComponent.opacity)
    staticComponent.visible !== undefined && staticComponent.visible !== this.visible && (this.visible = staticComponent.visible)
    staticComponent.flipX !== undefined && staticComponent.flipX !== this.flipX && (this.flipX = staticComponent.flipX)
    staticComponent.flipY !== undefined && staticComponent.flipY !== this.flipY && (this.flipY = staticComponent.flipY)
    staticComponent.rect !== undefined && !this.rect.equals(staticComponent.rect) && (this.rect = Rect.clone(staticComponent.rect))
  }

  update () {
    this.updateListeners.forEach(l => l())
    // console.log('update', this)
  }
  updateListeners: (() => void)[] = []
  onUpdated (cb: () => void) {
    this.updateListeners.push(cb)
    return () => this.offUpdated(cb)
  }

  offUpdated (cb: () => void) {
    this.updateListeners = this.updateListeners.filter(l => l !== cb)
  }
  offAllUpdated () {
    this.updateListeners = []
  }
}

export interface hasChildren {
  children: Component[]

  appendChild (child: Component): void
  removeChild (child: Component): void
}

export function getById (id: string, children: ComponentStatic[]): ComponentStatic | undefined {
  for (const child of children) {
    if (child.id === id) {
      return child
    }
    if ('children' in child) {
      const result = getById(id, child.children as ComponentStatic[])
      if (result !== undefined) {
        return result
      }
    }
  }
}

export function getByIdRaw (id: string, children: Component[]): Component | undefined {
  for (const child of children) {
    if (child.id === id) {
      return child
    }
    if ('children' in child) {
      const result = getByIdRaw(id, child.children as Component[])
      if (result !== undefined) {
        return result
      }
    }
  }
}
