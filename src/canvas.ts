import { Canvas, CanvasStatic } from './canvas/Canvas'

declare const bridge: {
  onCanvasUpdate(callback: (canvas: any) => void): void
  setCanvas(canvasStatic: CanvasStatic): void
}

const root = document.getElementById('root')
const canvas = new Proxy(new Canvas(), {
  set: (target, prop, value) => {
    (target as Record<typeof prop, any>)[prop] = value
    bridge.setCanvas(canvas.getStatic())
    console.log('set', prop, value)
    return true
  }
})

bridge.onCanvasUpdate((canvasStatic) => {
  console.log('canvasStatic', canvasStatic)
  canvas.fromStatic(canvasStatic)
  const el = canvas.render()
  if (root?.children[0] !== el) {
    root?.replaceChildren(el)
  }
  bridge.setCanvas(canvas.getStatic())
})

