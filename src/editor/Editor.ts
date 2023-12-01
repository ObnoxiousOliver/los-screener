import { reactive } from 'vue'
import { Component, ComponentJSON } from '../canvas/Component'
import { BridgeType } from '../BridgeType'
import { Canvas, CanvasJSON } from '../canvas/Canvas'
import { Slot } from '../canvas/Slot'
import { Scene, SceneJSON } from '../canvas/Scene'

declare const bridge: BridgeType

export class Editor {
  private _components: Component[] = reactive([])
  private _selectedElements: string[] = reactive([])
  private _canvases: Canvas[] = reactive([])
  private _scenes: Scene[] = reactive([])
  private _activeScenes: Record<string, string> = reactive({})

  public get components (): Component[] {
    return this._components
  }

  public get selectedElements (): string[] {
    return this._selectedElements
  }

  public get canvases (): Canvas[] {
    return this._canvases
  }

  public get scenes (): Scene[] {
    return this._scenes
  }

  public get activeScenes (): Record<string, string> {
    return this._activeScenes
  }

  constructor (live: boolean = false) {
    if (live) {
      bridge.onCanvasUpdated(this.updateCanvas.bind(this))
      bridge.getCanvases().then(this.updateAllCanvases.bind(this))

      bridge.onComponentUpdated(this.updateComponent.bind(this))
      bridge.getComponents().then(this.updateAllComponents.bind(this))

      bridge.onSceneUpdated(this.updateScene.bind(this))
      bridge.getScenes().then(this.updateAllScenes.bind(this))

      bridge.onActiveScenesChanged((canvasToSceneId) => {
        this.deselectAll()
        this._activeScenes = canvasToSceneId
      })
    }
  }

  private updateCanvas (id: string, c: CanvasJSON | null) {
    if (c === null) {
      const index = this.canvases.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.canvases.splice(index, 1)
      }
    } else {
      const canvas = this.canvases.find((c) => c.id === id)
      if (canvas) {
        canvas.fromJSON(c)
      } else {
        this.canvases.push(Canvas.fromJSON(c))
      }
    }
  }

  private updateAllCanvases (c: CanvasJSON[]) {
    console.log(c)
    c.forEach((canvasJSON) => {
      const canvas = this.canvases.find((c) => c.id === canvasJSON.id)
      if (canvas) {
        canvas.fromJSON(canvasJSON)
      } else {
        this.canvases.push(Canvas.fromJSON(canvasJSON))
      }
    })
  }

  private updateComponent (id: string, c: ComponentJSON | null) {
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
    s.forEach((scene) => {
      const index = this.scenes.findIndex((c) => c.id === scene.id)
      if (index !== -1) {
        this.scenes[index].fromJSON(scene)
      } else {
        this.scenes.push(Scene.fromJSON(scene))
      }
    })
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

  public getSelected (): (Slot | Canvas)[] {
    return this.selectedElements.map((id) => {
      const canvas = this.canvases.find((c) => c.id === id)
      if (canvas) return canvas
      return this.canvases.flatMap(c => c.children).find((s) => s.id === id)
    }).filter((e) => e !== undefined) as (Slot | Canvas)[]
  }

  // Components
  public getComponent (id: string): Component | undefined {
    return this.components.find((c) => c.id === id)
  }

  // Scenes
  public getScene (id: string): Scene | undefined {
    return this.scenes.find((c) => c.id === id)
  }

  public setActiveScenes (canvasToSceneId: Record<string, string>) {
    bridge.setActiveScenes(canvasToSceneId)
  }

  public setActiveSceneToAllCanvases (sceneId: string) {
    const canvasToSceneId: Record<string, string> = {}
    this.canvases.forEach((canvas) => {
      canvasToSceneId[canvas.id] = sceneId
    })
    bridge.setActiveScenes(canvasToSceneId)
  }

  public createScene (canvasIds?: string[]) {
    bridge.createScene(canvasIds)
  }
}