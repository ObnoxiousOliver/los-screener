import { reactive } from 'vue'
import { Component, ComponentJSON } from '../screener/Component'
import { BridgeType } from '../BridgeType'
import { Slot, SlotJSON } from '../screener/Slot'
import { Scene, SceneJSON } from '../screener/Scene'
import { Slice, SliceJSON } from '../screener/Slice'
import { Window, WindowJSON } from '../screener/Window'

declare const bridge: BridgeType

export class Editor {
  private _components: Component[] = reactive([])
  private _selectedElements: string[] = reactive([])
  private _slices: Slice[] = reactive([])
  private _windows: Window[] = reactive([])
  private _scenes: Scene[] = reactive([])
  private _activeScene: {
    id: string | null
    scene: Scene | null
  } = reactive({ id: null, scene: null })
  private live: boolean = false
  private nonLiveUpdates: {
    type: 'slice' | 'component' | 'scene' | 'slot'
    id: string
    data: any
  }[] = []

  public get components (): Component[] {
    return this._components
  }

  public get selectedElements (): string[] {
    return this._selectedElements
  }

  public get slices (): Slice[] {
    return this._slices
  }

  public get windows (): Window[] {
    return this._windows
  }

  public get scenes (): Scene[] {
    return this._scenes
  }

  public get activeScene (): Scene | null {
    return this._activeScene.scene
  }

  constructor (live: boolean = false) {
    this.live = live
    if (live) {
      bridge.onSliceUpdated(this.updateSlice.bind(this))
      bridge.getSlices().then(this.updateAllSlices.bind(this))

      bridge.onComponentUpdated(this.updateComponent.bind(this))
      bridge.getComponents().then(this.updateAllComponents.bind(this))

      bridge.onSceneUpdated(this.updateScene.bind(this))
      bridge.getScenes().then(this.updateAllScenes.bind(this))

      bridge.onWindowsUpdated(this.updateAllWindows.bind(this))
      bridge.getWindows().then(this.updateAllWindows.bind(this))

      bridge.onActiveSceneChanged((id) => {
        console.log('Active scene changed', id)

        this.deselectAll()
        this._activeScene.id = id
        this._activeScene.scene = this.getScene(id)
      })

      bridge.onComponentActionInvoked((id, action, args) => {
        console.log('Component action invoked', id, action, args)
        const component = this.getComponent(id)
        if (!component) {
          console.error(`Component ${id} not found`)
          return
        }

        component.call(action, ...(args ?? []))
      })
    }
  }

  public refresh () {
    bridge.getSlices().then(this.updateAllSlices.bind(this))
    bridge.getComponents().then(this.updateAllComponents.bind(this))
    bridge.getScenes().then(this.updateAllScenes.bind(this))
  }

  // private updateCanvas (id: string, c: CanvasJSON | null) {
  //   if (c === null) {
  //     const index = this.canvases.findIndex((c) => c.id === id)
  //     if (index !== -1) {
  //       this.canvases.splice(index, 1)
  //     }
  //   } else {
  //     const canvas = this.canvases.find((c) => c.id === id)
  //     if (canvas) {
  //       canvas.fromJSON(c)
  //     } else {
  //       this.canvases.push(Canvas.fromJSON(c))
  //     }
  //   }
  // // }

  // private updateAllCanvases (c: CanvasJSON[]) {
  //   console.log(c)
  //   c.forEach((canvasJSON) => {
  //     const canvas = this.canvases.find((c) => c.id === canvasJSON.id)
  //     if (canvas) {
  //       canvas.fromJSON(canvasJSON)
  //     } else {
  //       this.canvases.push(Canvas.fromJSON(canvasJSON))
  //     }
  //   })
  // }

  private updateSlice (id: string, s: Partial<SliceJSON> | null) {
    console.log(`Updating slice ${id}`, s)

    if (s === null) {
      const index = this.slices.findIndex((c) => c.id === id)
      if (index !== -1) {
        delete this.slices[index]
      }
    } else {
      const slice = this.slices.find((c) => c.id === id)
      if (slice) {
        slice.fromJSON(s)
      } else {
        this.slices.push(Slice.fromJSON(s))
      }
    }
  }

  private updateAllSlices (s: Partial<SliceJSON>[]) {
    console.log('Updating all slices', s)

    s.forEach((slice) => {
      const index = this.slices.findIndex((c) => c.id === slice.id)
      if (index !== -1) {
        this.slices[index].fromJSON(slice)
      } else {
        this.slices.push(Slice.fromJSON(slice))
      }
    })
  }

  private updateAllWindows (w: WindowJSON[]) {
    console.log('Updating windows', w)

    for (const window of w) {
      const index = this.windows.findIndex((c) => c.id === window.id)
      if (index !== -1) {
        this.windows[index].fromJSON(window)
      } else {
        this.windows.push(Window.fromJSON(window))
      }
    }

    // Remove windows that are no longer there
    for (const window of this.windows) {
      if (!w.find((c) => c.id === window.id)) {
        const index = this.windows.findIndex((c) => c.id === window.id)
        if (index !== -1) {
          this.windows.splice(index, 1)
        }
      }
    }
  }

  private updateComponent (id: string, c: Partial<ComponentJSON> | null) {
    console.log(`Updating component ${id}`, c)

    if (c === null) {
      const index = this.components.findIndex((c) => c.id === id)
      if (index !== -1) {
        delete this.components[index]
      }
    } else {
      const component = this.components.find((c) => c.id === id)
      if (component) {
        component.fromJSON(c)
      } else {
        this.components.push(Component.fromJSON(c))
      }
    }
  }

  private updateAllComponents (c: ComponentJSON[]) {
    console.log('Updating all components', c)

    c.forEach((component) => {
      const index = this.components.findIndex((c) => c.id === component.id)
      if (index !== -1) {
        this.components[index].fromJSON(component)
      } else {
        this.components.push(Component.fromJSON(component))
      }
    })
  }

  private updateScene (id: string, s: SceneJSON | null) {
    // console.log(`Updating scene ${id}`, s)

    if (s === null) {
      const index = this.scenes.findIndex((c) => c.id === id)
      if (index !== -1) {
        delete this.scenes[index]
      }
    } else {
      const scene = this.scenes.find((c) => c.id === id)
      if (scene) {
        scene.fromJSON(s)
      } else {
        this.scenes.push(Scene.fromJSON(s))
      }
    }
  }

  private updateAllScenes (s: SceneJSON[]) {
    console.log('Updating all scenes', s)

    s.forEach((scene) => {
      const index = this.scenes.findIndex((c) => c.id === scene.id)
      if (index !== -1) {
        this.scenes[index].fromJSON(scene)
      } else {
        this.scenes.push(Scene.fromJSON(scene))
      }
    })
  }

  public sendSliceUpdate (id: string, s: Partial<SliceJSON> | null) {
    if (this.live) {
      if (s === null) {
        bridge.removeSlice(id)
      } else {
        bridge.setSlice(s)
      }
    } else {
      this.nonLiveUpdates.push({ type: 'slice', id, data: s })
      this.updateSlice(id, s)
    }
  }

  public sendSlotUpdate (sceneId: string, id: string, s: Partial<SlotJSON> | null) {
    if (this.live) {
      bridge.setSlot(sceneId, id, s)
    } else {
      const scene = this.getScene(sceneId)
      if (!scene) {
        console.error(`Scene ${sceneId} not found`)
        return
      }

      const slot = scene.slots.find((s) => s.id === id)
      if (!slot) {
        console.error(`Slot ${id} not found`)
        return
      }

      this.nonLiveUpdates.push({ type: 'slot' as any, id, data: s })
      if (s === null) {
        scene.removeSlot(slot)
      } else {
        slot.fromJSON(s)
      }
    }

  }

  public sendComponentUpdate (id: string, c: Partial<ComponentJSON> | null) {
    if (this.live) {
      if (c === null) {
        bridge.removeComponent(id)
      } else {
        c.id = id
        bridge.setComponent(c)
      }
    } else {
      this.nonLiveUpdates.push({ type: 'component', id, data: c })
      this.updateComponent(id, c)
    }
  }

  public sendComponentAction (id: string, action: string, ...args: any[]) {
    if (this.live) {
      bridge.invokeComponentAction(id, action, args)
    } else {
      console.warn('Cannot invoke component action in non-live mode')
    }
  }

  // Selection
  public selectElement (id: string, multi: boolean = false) {
    if (!multi) {
      this.deselectAll()
      this.selectedElements.push(id)
      return
    }
    this.selectedElements.push(id)
  }
  public selectElements (ids: string[], multi: boolean = false) {
    if (!multi) {
      this.deselectAll()
      this.selectedElements.push(...ids)
      return
    }
    this.selectedElements.push(...ids)
  }

  public deselectElement (id: string) {
    const index = this.selectedElements.findIndex((e) => e === id)
    if (index !== -1) {
      this.selectedElements.splice(index, 1)
    }
  }

  public deselectAll () {
    this.selectedElements.splice(0, this.selectedElements.length)
  }

  public isSelected (id: string): boolean {
    return this.selectedElements.includes(id)
  }

  public getSlot (id: string): Slot | undefined {
    return this.scenes.flatMap((s) => s.slots).find((s) => s.id === id)
  }

  public getSelected (): Slot[] {
    return this.selectedElements.map((id) => this.getSlot(id)).filter((s) => s !== undefined) as Slot[]
  }

  // Windows
  public getWindow (id: string): Window | undefined {
    return this.windows.find((w) => w.id === id)
  }

  public setWindow (window: Window) {
    bridge.setWindow(window.toJSON())
  }

  public showWindows () {
    bridge.showWindows()
  }

  public hideWindows () {
    bridge.hideWindows()
  }

  // Components
  public getComponent (id: string): Component | undefined {
    return this.components.find((c) => c.id === id)
  }

  public removeComponent (id: string) {
    const index = this.components.findIndex((c) => c.id === id)
    if (index !== -1) {
      this.components.splice(index, 1)
    }
  }

  // Scenes
  public getScene (id: string): Scene | null {
    return this.scenes.find((c) => c.id === id) ?? null
  }

  public setActiveScene (id: string) {
    bridge.setActiveScene(id)
  }

  public createScene (canvasIds?: string[]) {
    bridge.createScene(canvasIds)
  }
}