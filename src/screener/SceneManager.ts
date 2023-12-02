// import { deepProxy, unwrap } from '../helpers/DeepProxy'
import { app } from 'electron'
import { Rect } from '../helpers/Rect'
import { Component, ComponentFactory, ComponentJSON } from './Component'
import { Playback } from './Playback'
import { Scene, SceneJSON } from './Scene'
import { Slice, SliceJSON } from './Slice'
import { Slot, SlotJSON } from './Slot'
import { JsonObject } from './TransferableObject'
import { WindowManager } from './WindowManager'
import { Text } from './default/Text'
import { Video } from './default/Video'
import { DefaultPlugin } from './default/defaultPlugin'
import * as fs from 'fs/promises'
import { join } from 'path'
import mime from 'mime'
import { id } from '../helpers/Id'

export class SceneManager {
  private scenes: Scene[] = []
  // private canvases: Canvas[] = []
  private slices: Slice[] = []
  private components: Component[] = []
  private playbacks: Playback[] = []
  private activeScene: Scene

  private constructor () {
    ComponentFactory.registerPlugin(DefaultPlugin)

    const defaultSlice = new Slice({
      name: 'Slice',
      rect: new Rect(0, 0, 1920, 1080)
    })
    this.slices.push(defaultSlice)
    this.slices.push(new Slice({
      name: 'Slice',
      rect: new Rect(1920, 0, 1920, 1080)
    }))

    const defaultScene = this.createSceneRaw()
    this.components.push(new Video({
      name: 'Image',
      src: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }))
    defaultScene.addSlot(new Slot(new Rect(0, 0, 200, 300), this.components[0].id))

    this.components.push(new Text({
      name: 'Text',
      content: 'Hello World!'
    }))
    defaultScene.addSlot(new Slot(new Rect(0, 0, 200, 300), this.components[1].id))
    this.activeScene = this.scenes[0]

    this.addScene(defaultScene)

    this.checkActiveScene()
  }

  // private canvasUpdated (id: string, canvas: Canvas | null): void {
  //   this.checkActiveScenes()

  //   if (canvas) {
  //     if (!this.activeScenes[canvas.id]) {
  //       this.activeScenes[canvas.id] = this.activeScenes[Object.keys(this.activeScenes)[0]]
  //     }
  //     this.activeScenes[canvas.id].sceneSetup[canvas.id] = canvas.children
  //   } else {
  //     delete this.activeScenes[id]
  //   }

  //   WindowManager.getInstance().updateCanvas(id, canvas?.toJSON() ?? null)
  // }

  private sliceUpdated (id: string, slice: Slice | null): void {
    WindowManager.getInstance().updateSlice(id, slice?.toJSON() ?? null)
  }

  private activeSceneUpdated (): void {
    this.checkActiveScene()

    // for (const canvas of this.canvases) {
    //   canvas.children = this.activeScenes[canvas.id].sceneSetup[canvas.id]
    //   WindowManager.getInstance().updateCanvas(canvas.id, canvas.toJSON())
    // }

    WindowManager.getInstance().updateActiveScene(this.activeScene.id)
  }

  private componentUpdated (id: string, component: Component | null): void {
    WindowManager.getInstance().updateComponent(id, component?.toJSON() ?? null)
  }

  // Scenes
  public setActiveScene (scene: Scene): void {
    // const scene = this.scenes.find(s => s.id === id)
    // if (!scene) {
    //   console.warn(`Scene with id ${id} not found in SceneManager.`)
    //   return
    // }

    // const canvases = (canvasIds
    //   ?.map(id => this.canvases.find(c => c.id === id))
    //   .filter(c => c !== undefined) as Canvas[] ?? this.canvases).filter(c => Object.keys(scene.sceneSetup).includes(c.id))
    // if (canvasIds && canvases.length !== canvasIds.length) {
    //   console.warn('Not all canvas ids found in SceneManager or Scene does not contain all canvas ids.')
    // }

    // for (const canvas of canvases) {
    //   this.activeScenes[canvas.id] = scene
    // }

    this.activeScene = scene
    this.activeSceneUpdated()
  }

  public setActiveSceneFromId (id: string): void {
    const scene = this.scenes.find(s => s.id === id)
    if (!scene) {
      console.warn(`Scene with id ${id} not found in SceneManager.`)
      return
    }

    this.setActiveScene(scene)
  }

  // public setActiveSceneForCanvas (canvasId: string, sceneId: string): void {
  //   console.log(`Setting scene ${sceneId} for canvas ${canvasId}.`)
  //   const scene = this.scenes.find(s => s.id === sceneId)
  //   if (!scene) {
  //     console.warn(`Scene with id ${sceneId} not found in SceneManager.`)
  //     return
  //   }

  //   const canvas = this.canvases.find(c => c.id === canvasId)
  //   if (!canvas) {
  //     console.warn(`Canvas with id ${canvasId} not found in SceneManager.`)
  //     return
  //   }

  //   this.activeScene[canvas.id] = scene
  //   this.activeSceneUpdated()
  // }

  private checkActiveScene (): void {
    // check if all canvases have an active scene
    // const canvasesWithoutActiveScene = this.canvases.filter(c => !Object.keys(this.activeScenes).includes(c.id))
    // if (canvasesWithoutActiveScene.length > 0) {
    //   console.warn('Not all canvases have an active scene. Setting scene to activeScene of first canvas.')

    //   if (this.scenes.length === 0) {
    //     console.warn('No scenes found in SceneManager. Creating default scene.')
    //     this.scenes.push(new Scene({
    //       name: 'Scene',
    //       sceneSetup: Object.fromEntries(canvasesWithoutActiveScene.map(c => [c.id, c.children ?? []]))
    //     }))
    //   }

    //   const scene = this.activeScenes[Object.keys(this.activeScenes)[0]] ?? this.scenes[0]
    //   for (const canvas of canvasesWithoutActiveScene) {
    //     this.activeScenes[canvas.id] = scene
    //     this.activeScenes[canvas.id].sceneSetup[canvas.id] = canvas.children
    //   }
    // }

    if (this.scenes.length === 0) {
      console.warn('No scenes found in SceneManager. Creating default scene.')
      this.scenes.push(new Scene({
        name: 'Scene',
        sliceSetup: Object.fromEntries(this.slices.map(s => [s.id, Rect.clone(s.rect)]))
      }))
    }

    if (!this.scenes.includes(this.activeScene)) {
      console.warn('Active scene not found in SceneManager. Setting first scene as active scene.')
      this.activeScene = this.scenes[0]
    }
  }

  public getActiveScene (): Scene {
    return this.activeScene
  }

  public addScene (scene: Scene): void {
    this.scenes.push(scene)
    this.setActiveScene(scene)
    this.sceneUpdated(scene.id, scene)
  }

  public getScenes (): Scene[] {
    return this.scenes
  }

  public createScene (): Scene {
    const scene = this.createSceneRaw()
    this.addScene(scene)
    return scene
  }

  private createSceneRaw (): Scene {
    const scene = new Scene()
    scene.sliceSetup = Object.fromEntries(this.slices.map(s => [s.id, new Rect()]))

    return scene
  }

  public removeScene (id: string): void {
    const sceneToActive = this.scenes[this.scenes.findIndex(s => s.id === id) - 1] ?? this.scenes[this.scenes.findIndex(s => s.id === id) + 1]
    this.scenes = this.scenes.filter(s => s.id !== id)
    this.sceneUpdated(id, null)
    this.setActiveScene(sceneToActive ?? this.scenes[0])
  }

  public sceneUpdated (id: string, scene: Scene | null): void {
    WindowManager.getInstance().updateScene(id, scene?.toJSON() ?? null)
  }

  public removeSlot (sceneId: string, slotId: string): void {
    const scene = this.scenes.find(c => c.id === sceneId)
    if (!scene) {
      throw new Error(`Scene with id ${sceneId} not found in SceneManager.`)
    }

    const slot = scene.slots.find(s => s.id === slotId)

    if (!slot) {
      console.warn(`Slot with id ${slotId} not found in SceneManager.`)
      return
    }

    scene.removeSlot(slot)
    this.sceneUpdated(sceneId, scene)
  }

  // Slices
  public getSlices (): Slice[] {
    return this.slices
  }

  public getSlice (id: string): Slice | undefined {
    return this.slices.find(s => s.id === id)
  }

  public setSlice (slice: Slice): void {
    const index = this.slices.findIndex(s => s.id === slice.id)
    if (index > -1) {
      this.slices[index] = slice
    } else {
      this.slices.push(slice)
    }
    this.sliceUpdated(slice.id, slice)
  }

  public addSlice (slice: Slice): void {
    this.slices.push(slice)
    this.sliceUpdated(slice.id, slice)
  }

  public removeSlice (id: string): void {
    const index = this.slices.findIndex(s => s.id === id)
    if (index > -1) {
      this.slices.splice(index, 1)
    } else {
      console.warn(`Slice with id ${id} not found in SceneManager.`)
    }

    this.sliceUpdated(id, null)
  }

  // Canvases
  // public getCanvases (): Canvas[] {
  //   return this.canvases.filter(c => c)
  // }

  // public getCanvas (id: string): Canvas | undefined {
  //   return this.canvases.find(c => c.id === id)
  // }

  // public setCanvas (canvas: Canvas): void {
  //   const index = this.canvases.findIndex(c => c.id === canvas.id)
  //   if (index > -1) {
  //     this.canvases[index] = canvas
  //   } else {
  //     this.canvases.push(canvas)
  //   }
  //   this.canvasUpdated(canvas.id, canvas)
  // }

  // public addCanvas (canvas: Canvas): void {
  //   this.canvases.push(canvas)
  //   this.canvasUpdated(canvas.id, canvas)
  // }

  // public removeCanvas (id: string): void {
  //   const index = this.canvases.findIndex(c => c.id === id)
  //   if (index > -1) {
  //     this.canvases.splice(index, 1)
  //   } else {
  //     console.warn(`Canvas with id ${id} not found in SceneManager.`)
  //   }

  //   this.canvasUpdated(id, null)
  // }

  // Components
  public getComponents (): Component[] {
    return this.components
  }

  public getComponent (id: string): Component | undefined {
    return this.components.find(c => c.id === id)
  }

  public removeComponent (id: string): void {
    const index = this.components.findIndex(c => c.id === id)
    if (index > -1) {
      this.components.splice(index, 1)
    } else {
      console.warn(`Component with id ${id} not found in SceneManager.`)
    }

    this.componentUpdated(id, null)
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
          const extention = mime.getExtension(blob.type) ?? 'application/octet-stream'

          const dirPath = join(app.getPath('temp'), 'screener', 'media')
          const filePath = join(dirPath, `${src.replace(/[^a-zA-Z0-9]/g, '_')}_${id()}.${extention}`)

          await fs.access(dirPath)
            .catch(async () => {
              await fs.mkdir(dirPath, { recursive: true })
            })

          await fs.writeFile(filePath, Buffer.from(arrayBuffer))
            .catch(e => {
              console.warn(`Error writing file "${filePath}".`, e)
            })

          this.mediaCache[src] = {
            value: filePath,
            promise: null,
            components: [...this.mediaCache[src]?.components ?? [], componentId].filter((v, i, a) => a.indexOf(v) === i)
          }
          return filePath
        } catch (e) {
          console.warn(`Error fetching URL "${src}".`, e)

          delete this.mediaCache[src]
          return null
        }
      } else {
        try {
          await fs.access(src)

          console.log(`Reading File "${src}".`)
          this.mediaCache[src] = {
            value: src,
            promise: null,
            components: [...this.mediaCache[src]?.components ?? [], componentId].filter((v, i, a) => a.indexOf(v) === i)
          }

          return src
        } catch (e) {
          console.warn(`Error reading File "${src}".`, e)

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
  // public updateCanvasWithJSON (json: CanvasJSON): void {
  //   console.log(json)
  //   let canvas = this.canvases.find(c => c.id === json.id)
  //   if (!canvas) {
  //     canvas = Canvas.fromJSON(json)
  //     this.addCanvas(canvas)
  //     console.log(`Canvas with id ${json.id} added.`)
  //   } else {
  //     canvas.fromJSON(json)
  //     console.log(`Canvas with id ${json.id} updated.`)
  //   }

  //   this.canvasUpdated(json.id, canvas)
  // }

  public updateSliceWithJSON (json: Partial<SliceJSON>): void {
    if (!json.id) throw new Error('Slice id not found in JSON.')

    let slice = this.slices.find(s => s.id === json.id)

    if (!slice) {
      slice = Slice.fromJSON(json)
      this.setSlice(slice)
      console.log(`Slice with id ${json.id} added.`)
    } else {
      slice.fromJSON(json)
      console.log(`Slice with id ${json.id} updated.`)
    }

    this.sliceUpdated(json.id, slice)
  }

  public updateComponentWithJSON (json: Partial<ComponentJSON>): void {
    if (!json.id) throw new Error('Component id not found in JSON.')

    const component = this.components.find(c => c.id === json.id)
    if (!component) {
      throw new Error(`Component with id ${json.id} not found in SceneManager.`)
    }

    component.fromJSON(json)
    this.componentUpdated(json.id, component)
  }

  public updateSceneWithJSON (json: Partial<SceneJSON>): void {
    if (!json.id) throw new Error('Scene id not found in JSON.')

    const scene = this.scenes.find(s => s.id === json.id)
    if (!scene) {
      throw new Error(`Scene with id ${json.id} not found in SceneManager.`)
    }

    scene.fromJSON(json)
    if (this.activeScene === scene) {
      this.activeSceneUpdated()
    }
    this.sceneUpdated(json.id, scene)
  }

  public updateSlotWithJSON (sceneId: string, json: Partial<SlotJSON>): void {
    const scene = this.scenes.find(c => c.id === sceneId)
    if (!scene) {
      throw new Error(`Scene with id ${sceneId} not found in SceneManager.`)
    }

    const slot = scene.slots.find(s => s.id === json.id)
    if (!slot) {
      throw new Error(`Slot with id ${json.id} not found in SceneManager.`)
    }

    slot.fromJSON(json)
    this.sceneUpdated(sceneId, this.activeScene)
  }

  public toJSON () {
    return {
      scenes: this.scenes.map(s => s.toJSON()),
      activeScene: this.activeScene?.id,
      slices: this.slices.map(s => s.toJSON()),
      components: this.components.map(c => c.toJSON())
    }
  }

  public fromJSON (json: JsonObject) {
    if (json.scenes && Array.isArray(json.scenes)) {
      this.scenes = (json.scenes as Partial<SceneJSON>[]).map(s => Scene.fromJSON(s))
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