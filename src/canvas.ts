import { Canvas, CanvasJSON } from './canvas/Canvas'
import { Component, ComponentFactory, ComponentJSON } from './canvas/Component'
import { Window, WindowJSON } from './canvas/Window'
import { DefaultPlugin } from './canvas/default/defaultPlugin'

declare const bridge: {
  onCanvasUpdated(callback: (canvas: CanvasJSON | null) => void): void
  getCanvas(): Promise<CanvasJSON>
  onComponentUpdated(callback: (id: string, component: ComponentJSON | null) => void): void
  getComponents(): Promise<ComponentJSON[]>
  getWindow(): Promise<WindowJSON>
  onWindowUpdated(callback: (window: WindowJSON | null) => void): void
}

ComponentFactory.registerPlugin(DefaultPlugin)
const root = document.getElementById('root') as HTMLDivElement

const w = await bridge.getWindow()
let window: Window | null = w ? Window.fromJSON(w) : null

const c = await bridge.getCanvas()
let canvas: Canvas | null = c ? Canvas.fromJSON(c) : null
const components: Component[] = (await bridge.getComponents()).map(component => Component.fromJSON(component))

const observer = new ResizeObserver(() => {
  if (!canvas) {
    return
  }

  root.attributeStyleMap.set('--window-width', root.clientWidth)
  root.attributeStyleMap.set('--window-height', root.clientHeight)
  root.attributeStyleMap.set('--canvas-width', canvas.size.x)
  root.attributeStyleMap.set('--canvas-height', canvas.size.y)
})

observer.observe(root)

function render () {
  if (!window) {
    root.replaceChildren()
    return
  }

  if (!canvas) {
    root.replaceChildren()
    return
  }

  root.attributeStyleMap.set('--window-width', root.clientWidth)
  root.attributeStyleMap.set('--window-height', root.clientHeight)
  root.attributeStyleMap.set('--canvas-width', canvas.size.x)
  root.attributeStyleMap.set('--canvas-height', canvas.size.y)
  root.replaceChildren(canvas.render(components))

  root.className = 'fit-' + window.fit
}

bridge.onWindowUpdated(w => {
  if (w) {
    if (window) {
      window.fromJSON(w)
    } else {
      window = Window.fromJSON(w)
    }
  } else {
    window = null
  }
  render()
})

bridge.onCanvasUpdated(c => {
  if (c) {
    if (canvas) {
      canvas.fromJSON(c)
    } else {
      canvas = Canvas.fromJSON(c)
    }
  } else {
    canvas = null
  }
  render()
})

bridge.onComponentUpdated((id, component) => {
  const index = components.findIndex(c => c.id === id)
  if (index !== -1) {
    if (component) {
      components[index].fromJSON(component)
    } else {
      components.splice(index, 1)
    }
  } else {
    if (component) {
      components.push(Component.fromJSON(component))
    }
  }
  render()
})

render()
