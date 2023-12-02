import { ComponentJSON } from './screener/Component'
import { SceneJSON } from './screener/Scene'
import { SliceJSON } from './screener/Slice'
import { SlotJSON } from './screener/Slot'
import { WindowJSON } from './screener/Window'

export interface BridgeType {
  // setCanvas (canvas: CanvasJSON): void
  // removeCanvas (id: string): void
  // onCanvasUpdated (callback: (id: string, canvas: CanvasJSON | null) => void): void
  // getCanvases (): Promise<CanvasJSON[]>

  setSlice (slice: Partial<SliceJSON>): void
  removeSlice (id: string): void
  onSliceUpdated (callback: (id: string, slice: SliceJSON | null) => void): void
  getSlices (): Promise<SliceJSON[]>

  setComponent (component: Partial<ComponentJSON>): void
  removeComponent (id: string): void
  onComponentUpdated (callback: (id: string, component: ComponentJSON | null) => void): void
  getComponents (): Promise<ComponentJSON[]>
  invokeComponentAction (id: string, action: string, ...args: any[]): void
  onComponentActionInvoked (callback: (id: string, action: string, args: any[]) => void): void

  setSlot (sceneId: string, slotId: string, slot: Partial<SlotJSON> | null): void

  setWindow (window: WindowJSON): void
  removeWindow (canvasId: string): void
  onWindowsUpdated (callback: (windows: WindowJSON[]) => void): void
  getWindows (): Promise<WindowJSON[]>
  showWindows (): void
  hideWindows (): void

  requestMedia (id: string, src: string): Promise<string | null>

  setScene (scene: SceneJSON): void
  createScene (canvasIds?: string[]): void
  removeScene (id: string): void
  onSceneUpdated (callback: (id: string, scene: SceneJSON | null) => void): void
  getScenes (): Promise<SceneJSON[]>
  setActiveScene (id: string): void
  onActiveSceneChanged (callback: (id: string) => void): void
}

export interface BridgeTypeSliceViewer {
  getWindow (): Promise<WindowJSON>
  getSlice (): Promise<SliceJSON>
  getScene (): Promise<SceneJSON>
  getComponents (): Promise<ComponentJSON[]>

  onWindowUpdated (callback: (window: WindowJSON | null) => void): void
  onSliceUpdated (callback: (slice: SliceJSON | null) => void): void
  onSceneUpdated (callback: (scene: SceneJSON | null) => void): void
  onComponentUpdated (callback: (id: string, component: ComponentJSON | null) => void): void

  onComponentActionInvoked (callback: (id: string, action: string, args: any[]) => void): void

  requestMedia (id: string, src: string): Promise<string | null>
}
