import { reactive } from 'vue'
import { Component, ComponentFactory, ComponentJSON } from '../screener/Component'
import { BridgeType } from '../BridgeType'
import { Slot, SlotJSON } from '../screener/Slot'
import { Scene, SceneJSON } from '../screener/Scene'
import { Slice, SliceJSON } from '../screener/Slice'
import { Window, WindowJSON } from '../screener/Window'
import { Playback, PlaybackJSON } from '../screener/Playback'
declare const bridge: BridgeType

export class Editor {
  components: Component[] = reactive([])
  selectedElements: string[] = reactive([])
  slices: Slice[] = reactive([])
  windows: Window[] = reactive([])

  scenes: Scene[] = reactive([])
  private _activeScene: {
    id: string | null
    scene: Scene | null
  } = reactive({ id: null, scene: null })

  playbacks: Playback[] = reactive([])
  private _activePlayback: {
    id: string | null
    playback: Playback | null
  } = reactive({ id: null, playback: null })

  private live: boolean = false
  private nonLiveUpdates: {
    type: 'slice' | 'component' | 'scene' | 'slot'
    id: string
    data: any
  }[] = []

  public get activeScene (): Scene | null {
    return this._activeScene.scene
  }

  public get activePlayback (): Playback | null {
    return this._activePlayback.playback
  }

  private loading: { v: boolean } = reactive({ v: false })
  public get isLoading (): boolean {
    return this.loading.v
  }

  constructor (live: boolean = false) {
    this.live = live
    if (live) {
      this.loading.v = true
      this.refresh().then(() => { this.loading.v = false })

      bridge.onSliceUpdated(this.updateSlice.bind(this))
      bridge.onComponentUpdated(this.updateComponent.bind(this))
      bridge.onSceneUpdated(this.updateScene.bind(this))
      bridge.onPlaybackUpdated(this.updatePlayback.bind(this))
      bridge.onWindowsUpdated(this.updateAllWindows.bind(this))

      bridge.onActiveSceneChanged((id) => {
        if (id === this._activeScene.id) return
        console.log('Active scene changed', id)

        this.deselectAll()
        this._activeScene.id = id
        this._activeScene.scene = this.getScene(id)
      })

      bridge.onActivePlaybackChanged((id) => {
        console.log('Active playback changed', id)

        this._activePlayback.id = id
        this._activePlayback.playback = this.playbacks.find((p) => p.id === id) ?? null
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

  public async refresh () {
    await Promise.all([
      new Promise<void>((resolve) => bridge.getSlices().then((data) => {
        this.updateAllSlices(data)
        resolve()
      })),
      new Promise<void>((resolve) => bridge.getComponents().then((data) => {
        this.updateAllComponents(data)
        resolve()
      })),
      new Promise<void>((resolve) => bridge.getScenes().then((data) => {
        this.updateAllScenes(data)
        resolve()
      })),
      new Promise<void>((resolve) => bridge.getPlaybacks().then((data) => {
        this.updateAllPlaybacks(data)
        resolve()
      })),
      new Promise<void>((resolve) => bridge.getWindows().then((data) => {
        this.updateAllWindows(data)
        resolve()
      }))
    ])
  }

  private updateSlice (id: string, s: Partial<SliceJSON> | null) {
    // console.log(`Updating slice ${id}`, s)
    console.log(this.slices)

    if (s === null) {
      const index = this.slices.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.slices.splice(index, 1)
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

    // Remove slices that are no longer there
    for (const slice of this.slices) {
      if (!s.find((c) => c.id === slice.id)) {
        const index = this.slices.findIndex((c) => c.id === slice.id)
        if (index !== -1) {
          this.slices.splice(index, 1)
        }
      }
    }
  }

  private updateAllWindows (w: WindowJSON[]) {
    console.log('Updating all windows', w)

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
    // console.log(`Updating component ${id}`, c)

    if (c === null) {
      const index = this.components.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.components.splice(index, 1)
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

    // Remove components that are no longer there
    for (const component of this.components) {
      if (!c.find((c) => c.id === component.id)) {
        const index = this.components.findIndex((c) => c.id === component.id)
        if (index !== -1) {
          this.components.splice(index, 1)
        }
      }
    }
  }

  private updateScene (id: string, s: SceneJSON | null) {
    // console.log(`Updating scene ${id}`, s)

    if (s === null) {
      const index = this.scenes.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.scenes.splice(index, 1)
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

    // Remove scenes that are no longer there
    for (const scene of this.scenes) {
      if (!s.find((c) => c.id === scene.id)) {
        const index = this.scenes.findIndex((c) => c.id === scene.id)
        if (index !== -1) {
          this.scenes.splice(index, 1)
        }
      }
    }
  }

  private updatePlayback (id: string, p: Partial<PlaybackJSON> | null) {
    // console.log(`Updating playback ${id}`, p)

    if (p === null) {
      const index = this.playbacks.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.playbacks.splice(index, 1)
      }
    } else {
      const playback = this.playbacks.find((c) => c.id === id)
      if (playback) {
        playback.fromJSON(p)
      } else {
        this.playbacks.push(Playback.fromJSON(p))
      }
    }
  }

  private updateAllPlaybacks (p: PlaybackJSON[]) {
    console.log('Updating all playbacks', p)

    p.forEach((playback) => {
      const index = this.playbacks.findIndex((c) => c.id === playback.id)
      if (index !== -1) {
        this.playbacks[index].fromJSON(playback)
      } else {
        this.playbacks.push(Playback.fromJSON(playback))
      }
    })

    // Remove playbacks that are no longer there
    for (const playback of this.playbacks) {
      if (!p.find((c) => c.id === playback.id)) {
        const index = this.playbacks.findIndex((c) => c.id === playback.id)
        if (index !== -1) {
          this.playbacks.splice(index, 1)
        }
      }
    }
  }

  public sendSliceUpdate (id: string, s: Partial<SliceJSON> | null) {
    if (this.live) {
      if (s === null) {
        bridge.removeSlice(id)
      } else {
        s.id = id
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
  public selectSlot (id: string, multi: boolean = false) {
    if (!multi) {
      this.deselectAll()
      this.selectedElements.push(id)
      return
    }
    this.selectedElements.push(id)
  }
  public selectSlots (ids: string[], multi: boolean = false) {
    if (!multi) {
      this.deselectAll()
      this.selectedElements.push(...ids)
      return
    }
    this.selectedElements.push(...ids)
  }

  public selectSlice (id: string) {
    this.deselectAll()
    const slice = this.slices.find((s) => s.id === id)
    if (!slice) {
      console.error(`Slice ${id} not found`)
      return
    }

    this.selectedElements.push(slice.id)
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

  public getSelectedSlice (): Slice | undefined {
    if (this.selectedElements.length !== 1) return
    return this.slices.find((s) => s.id === this.selectedElements[0])
  }

  public removeSelectedSlots () {
    if (this.activeScene === null) return
    const sceneId = this.activeScene.id

    this.getSelected().forEach((s) => {
      this.sendSlotUpdate(sceneId, s.id, null)
    })
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

  public createComponent (type: string, options?: Partial<ComponentJSON>) {
    const c = Component.fromJSON({
      type,
      name: 'New ' + ComponentFactory.getComponents().find((c) => c.type === type)?.name ?? 'Component',
      ...options
    })
    this.sendComponentUpdate(c.id, c.toJSON())
    return c
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

  public addSlotToScene (sceneId: string, slot?: Partial<SlotJSON>) {
    const s = Slot.fromJSON(slot ?? {})
    this.sendSlotUpdate(sceneId, s.id, s.toJSON())
    return s
  }

  // Slices
  public getSlice (id: string): Slice | undefined {
    return this.slices.find((s) => s.id === id)
  }

  public removeSlice (id: string) {
    this.sendSliceUpdate(id, null)
  }

  public createSlice (slice?: Partial<SliceJSON>) {
    const s = Slice.fromJSON(slice ?? {})
    bridge.setSlice(s.toJSON())
    return s
  }

  // History
  public pushHistory () {
    bridge.pushHistory()
  }
}