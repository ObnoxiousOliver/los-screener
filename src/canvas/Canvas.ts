import { Component, ComponentOptions, ComponentStatic, PropertyValue, Resizeable, getById, getByIdRaw, hasChildren } from './Component'
import { Vec2 } from '../helpers/Vec2'
import { Rect } from '../helpers/Rect'
import { Video } from './Video'

export interface CanvasOptions {
  resolution: Vec2
}

export interface CanvasStatic extends ComponentStatic {
  children: ComponentStatic[]
}

export class Canvas extends Component implements hasChildren {
  type: string = 'canvas'
  children: Component[] = []
  override resizeable: Resizeable = false
  override movable: boolean = false

  el: HTMLDivElement = document.createElement('div')

  constructor (options: Partial<ComponentOptions> = {}) {
    super({
      name: 'Canvas',
      rect: new Rect(0, 0, 1920, 1080),
      ...options
    })
  }

  appendChild(child: Component): void {
    child.onUpdated(this.update.bind(this))
    console.log('append', child)
    this.children.push(child)
    this.render()
  }

  removeChild(child: Component): void {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
    }
    child.offUpdated(this.update.bind(this))
    this.render()
  }

  getById (id: string): Component | undefined {
    return getByIdRaw(id, this.children)
  }

  static appendChild(canvas: CanvasStatic, child: ComponentStatic): CanvasStatic {
    canvas.children.push(child)
    return canvas
  }

  static removeChild(canvas: CanvasStatic, child: ComponentStatic): CanvasStatic {
    const index = canvas.children.indexOf(child)
    if (index !== -1) {
      canvas.children.splice(index, 1)
    }
    return canvas
  }

  static getById(canvas: CanvasStatic, id: string): ComponentStatic | undefined {
    return getById(id, canvas.children)
  }

  static override getProperties(component: CanvasStatic): Record<string, PropertyValue> {
    const props = super.getProperties(component)
    delete props.visible
    delete props.opacity
    return props
  }

  renderListeners: ((el: HTMLElement) => void)[] = []
  onRender (cb: (el: HTMLElement) => void) {
    this.renderListeners.push(cb)
  }

  render (editor: boolean = false): HTMLDivElement {
    this.el.style.width = this.rect.width + 'px'
    this.el.style.height = this.rect.height + 'px'
    this.el.style.backgroundColor = '#000'
    this.el.style.overflow = 'hidden'
    this.el.style.position = 'relative'

    for (const child of this.children) {
      this.el.appendChild(child.render(editor))
    }

    for (const cb of this.renderListeners) {
      cb(this.el)
    }

    return this.el
  }

  override getStatic (): CanvasStatic {
    return {
      ...super.getStatic(),
      children: this.children.map(child => child.getStatic())
    }
  }

  override fromStatic (staticComponent: Partial<CanvasStatic>) {
    super.fromStatic(staticComponent)
    if (staticComponent.children !== undefined) {
      staticComponent.children.forEach(child => {
        const existingChild = this.getById(child.id)
        if (existingChild) {
          existingChild.fromStatic(child)
        } else {
          const newChild = ComponentTypes[child.type] !== undefined && new ComponentTypes[child.type]()

          if (!newChild) {
            throw new Error(`Component type ${child.type} not found`)
          }

          newChild.fromStatic(child)
          this.appendChild(newChild)
        }
      })

      // Remove children that are not in the static component
      this.children.forEach(child => {
        if (!staticComponent.children?.find(c => c.id === child.id)) {
          this.removeChild(child)
        }
      })
    }
  }
}

export const ComponentTypes: Record<string, typeof Canvas | typeof Video> = {
  canvas: Canvas,
  video: Video
}
