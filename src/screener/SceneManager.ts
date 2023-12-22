// import { deepProxy, unwrap } from '../helpers/DeepProxy'
import { app } from 'electron'
import { Rect } from '../helpers/Rect'
import { Component, ComponentFactory, ComponentJSON } from './Component'
import { Playback, PlaybackJSON } from './Playback'
import { Scene, SceneJSON } from './Scene'
import { Slice, SliceJSON } from './Slice'
import { WindowManager } from './WindowManager'
import { DefaultPlugin } from './default/defaultPlugin'
import * as fs from 'fs/promises'
import { join } from 'path'
import mime from 'mime'
import { id } from '../helpers/Id'
import { Slot, SlotJSON } from './Slot'
import { Video } from './default/Video'

import probe from 'node-ffprobe'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'

export interface ProjectJSON {
  scenes: SceneJSON[]
  activeScene: string
  slices: SliceJSON[]
  components: ComponentJSON[]
}

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

    const defaultScene = this.createSceneRaw()
    this.addScene(defaultScene)
    this.activeScene = defaultScene

    this.checkActiveScene()
    this.pushHistoryNow()

    const video = new Video({
      name: 'Video',
      src: 'E:\\LoS 2023\\Test.mp4'
    })

    this.addComponent(video)
    this.updateSlotWithJSON(defaultScene.id, new Slot(new Rect(0, 0, 1920, 1080), video.id).toJSON())
  }

  // #region Updates
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
    if (slice) {
      this.activeScene.sliceSetup[id] = slice?.rect ?? new Rect()
    } else {
      delete this.activeScene.sliceSetup[id]
    }

    this.activeSceneUpdated()

    WindowManager.getInstance().updateSlice(id, slice?.toJSON() ?? null)
  }

  public sceneUpdated (id: string, scene: Scene | null): void {
    WindowManager.getInstance().updateScene(id, scene?.toJSON() ?? null)
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

  private playbackUpdated (id: string, playback: Playback | null): void {
    WindowManager.getInstance().updatePlayback(id, playback?.toJSON() ?? null)
  }

  // #endregion

  // #region Scenes
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
    this.sceneUpdated(scene.id, scene)
    this.setActiveScene(scene)
  }

  public getScenes (): Scene[] {
    return this.scenes
  }

  public createScene (recordHistory = true): Scene {
    const scene = this.createSceneRaw()
    this.addScene(scene)
    recordHistory && this.pushHistoryNow()
    return scene
  }

  private createSceneRaw (): Scene {
    const scene = new Scene()
    scene.sliceSetup = Object.fromEntries(this.slices.map(s => [s.id, new Rect()]))
    return scene
  }

  public removeScene (id: string, recordHistory = true): void {
    if (this.scenes.length <= 1) {
      console.warn('Cannot remove last scene.')
      return
    }

    const sceneToActive = this.scenes[this.scenes.findIndex(s => s.id === id) - 1] ?? this.scenes[this.scenes.findIndex(s => s.id === id) + 1]
    this.scenes = this.scenes.filter(s => s.id !== id)
    this.sceneUpdated(id, null)
    this.setActiveScene(sceneToActive ?? this.scenes[0])
    recordHistory && this.pushHistoryNow()
  }
  // #endregion

  // #region Slots
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
  // #endregion

  // #region Slices
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

  public addSlice (slice: Slice, recordHistory = true): void {
    this.slices.push(slice)
    this.sliceUpdated(slice.id, slice)
    recordHistory && this.pushHistoryNow()
  }

  public removeSlice (id: string, recordHistory = true): void {
    const index = this.slices.findIndex(s => s.id === id)
    if (index > -1) {
      console.log(`Removing slice with id ${id}.`)
      this.slices.splice(index, 1)
    } else {
      console.warn(`Slice with id ${id} not found in SceneManager.`)
    }

    this.sceneUpdated
    this.sliceUpdated(id, null)
    recordHistory && this.pushHistoryNow()
  }
  // #endregion

  // #region Canvas
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
  // #endregion

  // #region Components
  public getComponents (): Component[] {
    return this.components
  }

  public getComponent (id: string): Component | undefined {
    return this.components.find(c => c.id === id)
  }

  public addComponent (component: Component, recordHistory = true): void {
    this.components.push(component)
    this.componentUpdated(component.id, component)
    recordHistory && this.pushHistoryNow()
  }

  public removeComponent (id: string, recordHistory = true): void {
    const index = this.components.findIndex(c => c.id === id)
    if (index > -1) {
      this.components.splice(index, 1)
    } else {
      console.warn(`Component with id ${id} not found in SceneManager.`)
    }

    this.componentUpdated(id, null)
    recordHistory && this.pushHistoryNow()
  }
  // #endregion

  // #region Playbacks
  public getPlaybacks (): Playback[] {
    return this.playbacks
  }

  public getPlayback (id: string): Playback | undefined {
    return this.playbacks.find(p => p.id === id)
  }

  public removePlayback (id: string, recordHistory = true): void {
    const index = this.playbacks.findIndex(p => p.id === id)
    if (index > -1) {
      this.playbacks.splice(index, 1)
    } else {
      console.warn(`Playback with id ${id} not found in SceneManager.`)
    }

    if (this.activePlayback?.id === id) {
      this.setActivePlayback(null)
    }

    this.playbackUpdated(id, null)
    recordHistory && this.pushHistoryNow()
  }

  private activePlayback: Playback | null = null
  private playbackTimeouts: NodeJS.Timeout[] = []
  public startPlayback (): void {
    for (const interval of this.playbackTimeouts) {
      clearTimeout(interval)
    }

    if (!this.activePlayback) {
      console.warn('No active playback found in SceneManager.')
      return
    }

    const pb = this.activePlayback

    console.log('Starting playback.', pb.timeline.tracks)

    for (const track of pb.timeline.tracks) {
      console.log('Starting track.', track)
      if (track.range.offset > 0) {
        WindowManager.getInstance().invokeComponentAction(track.component, 'pause', [])

        this.playbackTimeouts.push(setTimeout(() => {
          WindowManager.getInstance().invokeComponentAction(track.component, 'play', [track.range.start])
        }, track.range.offset * 1000))
      } else {
        WindowManager.getInstance().invokeComponentAction(track.component, 'play', [track.range.start])
      }

      if (track.range.duration) {
        this.playbackTimeouts.push(setTimeout(() => {
          WindowManager.getInstance().invokeComponentAction(track.component, 'pause', [])
        }, (track.range.offset + track.range.duration) * 1000))
      }
    }
  }

  public setActivePlayback (playback: Playback | null): void {
    this.activePlayback = playback
    WindowManager.getInstance().updateActivePlayback(playback?.id ?? null)
  }

  public setActivePlaybackFromId (id: string | null): void {
    if (!id) {
      this.setActivePlayback(null)
      return
    }

    const playback = this.playbacks.find(p => p.id === id)
    if (!playback) {
      console.warn(`Playback with id ${id} not found in SceneManager.`)
      return
    }

    this.setActivePlayback(playback)
  }

  public getActivePlayback (): Playback | null {
    return this.activePlayback
  }
  // #endregion

  // #region Media
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
      components: [
        ...this.mediaCache[src]?.components ?? [],
        componentId
      ].filter((v, i, a) => a.indexOf(v) === i)
    }

    return await promise
  }

  private async getMeta (path: string): Promise<Record<string, any>> {
    const type = mime.getType(path)

    const meta: Record<string, any> = {}
    let res: any
    probe.FFPROBE_PATH = ffprobeInstaller.path

    switch (type) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
        break
      case 'video/mp4':
      case 'video/webm':
      case 'video/ogg':
        res = await probe(path, { path: ffprobeInstaller.path })
        console.log(res)
        meta.duration = (res.streams as {
          duration: string | undefined
        }[]).reduce((acc, cur) => {
          if (cur.duration) {
            const duration = parseFloat(cur.duration)
            return Math.max(acc, isNaN(duration) ? 0 : duration)
          }
          return acc
        }, 0) * 1000
        break
    }

    return meta
  }

  // #endregion

  // #region JSON
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

  public updateSliceWithJSON (json: Partial<SliceJSON>, recordHistory = true): void {
    if (!json.id) throw new Error('Slice id not found in JSON.')

    let slice = this.slices.find(s => s.id === json.id)

    if (!slice) {
      slice = Slice.fromJSON(json)
      this.setSlice(slice)
      console.log(`Slice with id ${json.id} added.`)
      this.sliceUpdated(json.id, slice)
      recordHistory && this.pushHistoryNow()
    } else {
      slice.fromJSON(json)
      console.log(`Slice with id ${json.id} updated.`)
      this.sliceUpdated(json.id, slice)
      recordHistory && this.pushHistory()
    }
  }

  public updateComponentWithJSON (json: Partial<ComponentJSON>, recordHistory = true): void {
    if (!json.id) {
      const component = Component.fromJSON(json)
      this.components.push(component)
      recordHistory && this.pushHistoryNow()
      return
    }

    let component = this.components.find(c => c.id === json.id)
    if (!component) {
      component = Component.fromJSON(json)
      this.components.push(component)
    } else {
      component.fromJSON(json)
    }

    this.componentUpdated(json.id, component)
    recordHistory && this.pushHistory()
  }

  public updateSceneWithJSON (json: Partial<SceneJSON>, recordHistory = true): void {
    if (!json.id) {
      const scene = Scene.fromJSON(json)
      this.addScene(scene)
      recordHistory && this.pushHistoryNow()
      return
    }

    let scene = this.scenes.find(s => s.id === json.id)
    if (!scene) {
      scene = Scene.fromJSON(json)
      this.addScene(scene)
    } else {
      scene.fromJSON(json)
    }

    if (this.activeScene === scene) {
      this.activeSceneUpdated()
    }
    this.sceneUpdated(json.id, scene)
    recordHistory && this.pushHistory()
  }

  public updateSlotWithJSON (sceneId: string, json: Partial<SlotJSON>, recordHistory = true): void {
    const scene = this.scenes.find(c => c.id === sceneId)
    if (!scene) {
      throw new Error(`Scene with id ${sceneId} not found in SceneManager.`)
    }

    let slot = scene.slots.find(s => s.id === json.id)
    if (!slot) {
      slot = Slot.fromJSON(json)
      scene.addSlot(slot)
    } else {
      slot.fromJSON(json)
    }

    this.sceneUpdated(sceneId, this.activeScene)
    recordHistory && this.pushHistory()
  }

  public updatePlaybackWithJSON (json: Partial<PlaybackJSON>, recordHistory = true): void {
    let playback = this.playbacks.find(p => p.id === json.id)
    if (!playback) {
      playback = Playback.fromJSON(json)
      this.playbacks.push(playback)
    } else {
      playback.fromJSON(json)
    }

    this.playbackUpdated(playback.id, playback)
    recordHistory && this.pushHistory()
  }

  public toJSON (): ProjectJSON {
    return {
      scenes: this.scenes.map(s => s.toJSON()),
      activeScene: this.activeScene?.id,
      slices: this.slices.map(s => s.toJSON()),
      components: this.components.map(c => c.toJSON())
    }
  }

  public fromJSON (json: Partial<ProjectJSON>) {
    if (json.scenes !== undefined && Array.isArray(json.scenes)) {
      json.scenes.forEach(s => this.updateSceneWithJSON(s, false))
      for (const scene of this.scenes.filter(s => !json.scenes!.find(js => js.id === s.id))) {
        this.removeScene(scene.id, false)
      }
    }
    if (json.activeScene !== undefined) this.setActiveSceneFromId(json.activeScene)
    if (json.slices !== undefined && Array.isArray(json.slices)) {
      json.slices.forEach(s => this.updateSliceWithJSON(s, false))
      for (const slice of this.slices.filter(s => !json.slices!.find(js => js.id === s.id))) {
        this.removeSlice(slice.id, false)
      }
    }
    if (json.components !== undefined && Array.isArray(json.components)) {
      json.components.forEach(c => this.updateComponentWithJSON(c, false))
      for (const component of this.components.filter(c => !json.components!.find(js => js.id === c.id))) {
        this.removeComponent(component.id, false)
      }
    }
  }
  // #endregion

  // #region History
  private history: ProjectJSON[] = []
  private historyIndex = -1
  private historyTimeout: NodeJS.Timeout | null = null
  private maxHistoryLength = 100

  public pushHistory () {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout)
    }

    this.historyTimeout = setTimeout(() => {
      this.historyTimeout = null

      this.history.splice(this.historyIndex + 1)
      this.history.push(this.toJSON())
      this.historyIndex++

      // restrict history to 100 entries
      if (this.history.length > this.maxHistoryLength) {
        this.history.splice(0, this.history.length - this.maxHistoryLength)
        this.historyIndex = this.maxHistoryLength - 1
      }

      console.log('History updated.')
    }, 500)
  }

  public pushHistoryNow () {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout)
      this.historyTimeout = null
    }

    this.history.splice(this.historyIndex + 1)
    this.history.push(this.toJSON())
    this.historyIndex++

    // restrict history to 100 entries
    if (this.history.length > 100) {
      this.history.splice(0, this.history.length - 100)
      this.historyIndex = 99
    }

    console.log('History updated.')
  }

  public undo () {
    console.log(this.history)
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.fromJSON(this.history[this.historyIndex])
    }
  }

  public redo () {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.fromJSON(this.history[this.historyIndex])
    }
  }

  // #endregion

  // Singleton
  private static sm: SceneManager
  public static getInstance (): SceneManager {
    if (!this.sm) {
      this.sm = new SceneManager()
    }
    return this.sm
  }
}