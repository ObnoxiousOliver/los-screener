// import { deepProxy, unwrap } from '../helpers/DeepProxy'
import { Canvas, CanvasJSON } from './Canvas'
import { Component, ComponentFactory, ComponentJSON } from './Component'
import { Playback } from './Playback'
import { Scene, SceneJSON } from './Scene'
import { WindowManager } from './WindowManager'
import { Slot, SlotJSON } from './Slot'
import { DefaultPlugin } from './default/defaultPlugin'
import { Rect } from '../helpers/Rect'
import { Text } from './default/Text'
import { access, readFile } from 'fs/promises'
import { getType as getMimeType } from 'mime'
import { Video } from './default/Video'

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

    ComponentFactory.registerPlugin(DefaultPlugin)

    const defaultCanvas = new Canvas()
    this.components.push(new Video({
      name: 'Image',
      src: 'E:\\LoS 2023\\Untitled.mp4'
    }))
    defaultCanvas.addChild(new Slot(new Rect(0, 0, 200, 300), this.components[0].id))

    this.components.push(new Text({
      name: 'Text',
      content: 'Hello World!'
    }))
    defaultCanvas.addChild(new Slot(new Rect(0, 0, 200, 300), this.components[1].id))

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
    return this.canvases.filter(c => c)
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
      this.canvases.splice(index, 1)
    } else {
      console.warn(`Canvas with id ${id} not found in SceneManager.`)
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

  // Media
  private mediaCache: Record<string, {
    value: string | null
    promise: Promise<string | null> | null
    components: string[]
  }> = {}
  public async requestMedia (componentId: string, src: string, noCache = false) {
    console.log(`Requesting media "${src}" for component "${componentId}".`)

    if (this.mediaCache[src]) {
      if (!noCache && this.mediaCache[src].value) {
        return this.mediaCache[src].value
      } else if (this.mediaCache[src].promise) {
        return await this.mediaCache[src].promise
      } else {
        delete this.mediaCache[src]
        throw new Error('Unexpected cache value.')
      }
    }

    const promise = (async () => {
      const isUrl = src.startsWith('http://') || src.startsWith('https://')
      if (isUrl) {
        console.log(`Fetching URL "${src}".`)
        try {
          const result = await fetch(src)
          const blob = await result.blob()
          const arrayBuffer = await blob.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const dataUrl = `data:${result.headers.get('content-type')};base64,${buffer.toString('base64')}`
          this.mediaCache[src] = {
            value: dataUrl,
            promise: null,
            components: [...this.mediaCache[src]?.components ?? [], componentId].filter((v, i, a) => a.indexOf(v) === i)
          }
          return dataUrl
        } catch (e) {
          console.warn(`Error fetching URL "${src}".`)

          delete this.mediaCache[src]
          return null
        }
      } else {
        try {
          await access(src)

          console.log(`Reading File "${src}".`)
          const buffer = await readFile(src)
          const mimeType = getMimeType(src)
          const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
          this.mediaCache[src] = {
            value: dataUrl,
            promise: null,
            components: [...this.mediaCache[src]?.components ?? [], componentId].filter((v, i, a) => a.indexOf(v) === i)
          }

          return dataUrl
        } catch (e) {
          console.warn(`Error reading File "${src}".`)

          delete this.mediaCache[src]
          return null
        }
      }
    })()

    this.mediaCache[src] = {
      value: this.mediaCache[src]?.value ?? null,
      promise,
      components: [...this.mediaCache[src]?.components ?? [], componentId].filter((v, i, a) => a.indexOf(v) === i)
    }

    return await promise
  }

  // JSON
  public updateCanvasWithJSON (json: CanvasJSON): void {
    console.log(json)
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

  public updateSlotWithJSON (canvasId: string, json: SlotJSON): void {
    const canvas = this.canvases.find(c => c.id === canvasId)
    if (!canvas) {
      throw new Error(`Canvas with id ${canvasId} not found in SceneManager.`)
    }

    const slot = canvas.children?.find(s => s.id === json.id)
    if (!slot) {
      throw new Error(`Slot with id ${json.id} not found in SceneManager.`)
    }

    slot.fromJSON(json)
    this.canvasUpdated(canvasId, canvas)
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