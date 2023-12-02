import { BridgeTypeSliceViewer } from './BridgeType'
import { Component, ComponentFactory } from './screener/Component'
import { Scene } from './screener/Scene'
import { Slice } from './screener/Slice'
import { Window } from './screener/Window'
import { DefaultPlugin } from './screener/default/defaultPlugin'

declare const bridge: BridgeTypeSliceViewer

ComponentFactory.registerPlugin(DefaultPlugin)
const root = document.getElementById('root') as HTMLDivElement
const sceneEl = document.getElementById('scene') as HTMLDivElement

const w = await bridge.getWindow()
let window: Window | null = w ? Window.fromJSON(w) : null

const sl = await bridge.getSlice()
let slice: Slice | null = sl ? Slice.fromJSON(sl) : null

const s = await bridge.getScene()
let scene: Scene | null = s ? Scene.fromJSON(s) : null

const components: Component[] = (await bridge.getComponents()).map(component => Component.fromJSON(component))

globalThis.window.addEventListener('resize', () => {
  root.attributeStyleMap.set('--window-width', globalThis.window.innerWidth)
  root.attributeStyleMap.set('--window-height', globalThis.window.innerHeight)
})
root.attributeStyleMap.set('--window-width', globalThis.window.innerWidth)
root.attributeStyleMap.set('--window-height', globalThis.window.innerHeight)

function render () {
  if (!window) {
    sceneEl.replaceChildren()
    return
  }

  if (!slice) {
    sceneEl.replaceChildren()
    return
  }

  root.attributeStyleMap.set('--slice-x', slice.rect.x)
  root.attributeStyleMap.set('--slice-y', slice.rect.y)
  root.attributeStyleMap.set('--slice-width', slice.rect.width)
  root.attributeStyleMap.set('--slice-height', slice.rect.height)

  const elements = scene?.render({
    isEditor: false,
    components
  })

  if (elements) sceneEl.replaceChildren(...elements)
  else sceneEl.replaceChildren()

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

bridge.onSliceUpdated(c => {
  if (c) {
    if (slice) {
      slice.fromJSON(c)
    } else {
      slice = Slice.fromJSON(c)
    }
  } else {
    slice = null
  }
  render()
})

bridge.onSceneUpdated(c => {
  console.log('scene', c)
  if (c) {
    if (scene) {
      scene.fromJSON(c)
    } else {
      scene = Scene.fromJSON(c)
    }
  } else {
    scene = null
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

bridge.onComponentActionInvoked((id, action, args) => {
  console.log('action', id, action, args)
  const component = components.find(c => c.id === id)
  if (component) {
    component.call(action, ...(args ?? []))
  }
})

render()
