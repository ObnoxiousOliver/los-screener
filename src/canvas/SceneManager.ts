// import { deepProxy, unwrap } from '../helpers/DeepProxy'
import { Canvas, CanvasJSON } from './Canvas'
import { Component, ComponentJSON } from './Component'
import { Playback } from './Playback'
import { Scene, SceneJSON } from './Scene'
import { WindowManager } from '../electron/main/WindowManager'
import { Video } from './Video'
import { Slot } from './Slot'
import { Rect } from '../helpers/Rect'

export class SceneManager {
  private scenes: Scene[] = []
  private canvases: Canvas[] = []
  private components: Component[] = []
  private playbacks: Playback[] = []
  private activeScenes: Record<string, Scene> = {}

  private constructor () {
    // setup deep proxy
    // this.canvases = deepProxy([], {
    //   set: (target, prop, value, receiver, path) => {
    //     target[prop] = value
    //     const canvas: Canvas = path[1] ?? value
    //     if (path[1]) {
    //       this.canvasUpdated(canvas.id, canvas)
    //     } else if (typeof value === 'object') {
    //       // Canvas added
    //       this.canvasUpdated(canvas.id, canvas)
    //     }
    //     return true
    //   },
    //   deleteProperty: (target, prop, path) => {
    //     const canvas: Canvas = path[1] ?? target[prop]
    //     if (path[1]) {
    //       this.canvasUpdated(canvas.id, canvas)
    //     } else {
    //       // Canvas deleted
    //       this.canvasUpdated(canvas.id, null)
    //     }
    //     return delete target[prop]
    //   }
    // })

    // this.components = deepProxy<Component[]>([], {
    //   set: (target, prop, value, receiver, path) => {
    //     target[prop] = value
    //     const component: Component = path[1] ?? value
    //     if (path[1]) {
    //       console.log('component updated', component)
    //       this.componentUpdated(component.id, component)
    //     } else if (typeof value === 'object') {
    //       // Component added
    //       console.log('component added', component)
    //       this.componentUpdated(component.id, component)
    //     }
    //     return true
    //   },
    //   deleteProperty: (target, prop, path) => {
    //     const component: Component = path[1] ?? target[prop]
    //     if (path[1]) {
    //       console.log('component updated', component)
    //       this.componentUpdated(component.id, component)
    //     } else {
    //       // Component deleted
    //       console.log('component deleted', component)
    //       this.componentUpdated(component.id, null)
    //     }
    //     return delete target[prop]
    //   }
    // })

    const defaultCanvas = new Canvas()
    this.components.push(new Video({
      name: 'Video',
      src: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }))
    defaultCanvas.addChild(new Slot(new Rect(0, 0, 1280, 720), this.components[0].id))
    this.canvases.push(defaultCanvas)
  }

  private canvasUpdated (id: string, canvas: Canvas | null): void {
    this.checkActiveScene()

    if (canvas) {
      if (!this.activeScenes[canvas.id]) {
        this.activeScenes[canvas.id] = this.activeScenes[Object.keys(this.activeScenes)[0]]
      }
      this.activeScenes[canvas.id].sceneSetup[canvas.id] = canvas.children
    } else {
      delete this.activeScenes[id]
    }

    WindowManager.getInstance().updateCanvas(id, canvas?.toJSON() ?? null)
  }

  private activeSceneUpdated (): void {
    this.checkActiveScene()

    for (const canvas of this.canvases) {
      canvas.children = this.activeScenes[canvas.id].sceneSetup[canvas.id]
    }
  }

  private componentUpdated (id: string, component: Component | null): void {
    WindowManager.getInstance().updateComponent(id, component?.toJSON() ?? null)
  }

  // Scenes
  public setActiveScene (id: string, canvasIds?: string[]): void {
    const scene = this.scenes.find(s => s.id === id)
    if (!scene) {
      console.warn(`Scene with id ${id} not found in SceneManager.`)
      return
    }

    const canvases = (canvasIds
      ?.map(id => this.canvases.find(c => c.id === id))
      .filter(c => c !== undefined) as Canvas[] ?? this.canvases).filter(c => Object.keys(scene.sceneSetup).includes(c.id))
    if (canvasIds && canvases.length !== canvasIds.length) {
      console.warn('Not all canvas ids found in SceneManager or Scene does not contain all canvas ids.')
    }

    for (const canvas of canvases) {
      this.activeScenes[canvas.id] = scene
    }

    this.activeSceneUpdated()
  }

  private checkActiveScene (): void {
    // check if all canvases have an active scene
    const canvasesWithoutActiveScene = this.canvases.filter(c => !Object.keys(this.activeScenes).includes(c.id))
    if (canvasesWithoutActiveScene.length > 0) {
      console.warn('Not all canvases have an active scene. Setting scene to activeScene of first canvas.')

      if (this.scenes.length === 0) {
        console.warn('No scenes found in SceneManager. Creating default scene.')
        this.scenes.push(new Scene({
          name: 'Scene',
          sceneSetup: Object.fromEntries(canvasesWithoutActiveScene.map(c => [c.id, c.children ?? []]))
        }))
      }

      const scene = this.activeScenes[Object.keys(this.activeScenes)[0]] ?? this.scenes[0]
      for (const canvas of canvasesWithoutActiveScene) {
        this.activeScenes[canvas.id] = scene
        this.activeScenes[canvas.id].sceneSetup[canvas.id] = canvas.children
      }
    }
  }

  public getActiveScenes (): Record<string, Scene> {
    return this.activeScenes
  }

  public getScenes (): Scene[] {
    return this.scenes
  }

  public addScene (scene: Scene): void {
    this.scenes.push(scene)

    this.setActiveScene(scene.id)
  }

  public removeScene (id: string): void {
    this.scenes = this.scenes.filter(s => s.id !== id)
  }

  // Canvases
  public getCanvases (): Canvas[] {
    return this.canvases
  }

  public getCanvas (id: string): Canvas | undefined {
    return this.canvases.find(c => c.id === id)
  }

  public setCanvas (canvas: Canvas): void {
    const index = this.canvases.findIndex(c => c.id === canvas.id)
    if (index > -1) {
      this.canvases[index] = canvas
    } else {
      this.canvases.push(canvas)
    }
    this.canvasUpdated(canvas.id, canvas)
  }

  public addCanvas (canvas: Canvas): void {
    this.canvases.push(canvas)
    this.canvasUpdated(canvas.id, canvas)
  }

  public removeCanvas (id: string): void {
    const index = this.canvases.findIndex(c => c.id === id)
    if (index > -1) {
      delete this.canvases[index]
    }

    this.canvasUpdated(id, null)
  }

  // Components

  public getComponents (): Component[] {
    return this.components
  }

  public setComponent (component: Component): void {
    const index = this.components.findIndex(c => c.id === component.id)
    if (index > -1) {
      this.components[index] = component
    } else {
      this.components.push(component)
    }

    this.componentUpdated(component.id, component)
  }

  // Playbacks
  public getPlaybacks (): Playback[] {
    return this.playbacks
  }

  public addPlayback (playback: Playback): void {
    this.playbacks.push(playback)
  }

  public removePlayback (id: string): void {
    this.playbacks = this.playbacks.filter(p => p.id !== id)
  }

  public startPlayback (id: string): void {
    const playback = this.playbacks.find(p => p.id === id)
    if (!playback) {
      throw new Error(`Playback with id ${id} not found in SceneManager.`)
    }

    throw new Error('Not implemented.')
  }

  // JSON
  public updateCanvasWithJSON (json: CanvasJSON): void {
    let canvas = this.canvases.find(c => c.id === json.id)
    if (!canvas) {
      canvas = Canvas.fromJSON(json)
      this.addCanvas(canvas)
      console.log(`Canvas with id ${json.id} added.`)
    } else {
      canvas.fromJSON(json)
      console.log(`Canvas with id ${json.id} updated.`)
    }

    this.canvasUpdated(json.id, canvas)
  }

  public updateComponentWithJSON (json: ComponentJSON): void {
    const component = this.components.find(c => c.id === json.id)
    if (!component) {
      throw new Error(`Component with id ${json.id} not found in SceneManager.`)
    }

    component.fromJSON(json)
    this.componentUpdated(json.id, component)
  }

  public updateSceneWithJSON (json: SceneJSON): void {
    const scene = this.scenes.find(s => s.id === json.id)
    if (!scene) {
      throw new Error(`Scene with id ${json.id} not found in SceneManager.`)
    }

    scene.fromJSON(json)
    if (Object.keys(this.activeScenes).includes(scene.id)) {
      this.activeSceneUpdated()
    }
  }

  public toJSON () {
    return {
      scenes: this.scenes.map(s => s.toJSON()),
      activeScenes: Object.keys(this.activeScenes).map(key => ({
        [key]: this.activeScenes[key].id
      })).reduce((acc, val) => ({ ...acc, ...val }), {}),
      canvases: this.canvases.map(c => c.toJSON()),
      components: this.components.map(c => c.toJSON())
    }
  }

  // Singleton
  private static sm: SceneManager
  public static getInstance (): SceneManager {
    if (!this.sm) {
      this.sm = new SceneManager()
    }
    return this.sm
  }
}