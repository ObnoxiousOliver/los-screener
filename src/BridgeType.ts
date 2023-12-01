import { CanvasJSON } from './canvas/Canvas'
import { ComponentJSON } from './canvas/Component'
import { SceneJSON } from './canvas/Scene'
import { SlotJSON } from './canvas/Slot'
import { Window, WindowJSON } from './canvas/Window'

export interface BridgeType {
  setCanvas (canvas: CanvasJSON): void
  removeCanvas (id: string): void
  onCanvasUpdated (callback: (id: string, canvas: CanvasJSON | null) => void): void
  getCanvases (): Promise<CanvasJSON[]>

  setComponent (component: ComponentJSON): void
  onComponentUpdated (callback: (id: string, component: ComponentJSON | null) => void): void
  getComponents (): Promise<ComponentJSON[]>
  invokeComponentAction (id: string, action: string, ...args: any[]): Promise<any>

  setSlot (canvasId: string, slot: SlotJSON): void

  setWindow (window: WindowJSON): void
  removeWindow (canvasId: string): void
  onWindowsUpdated (callback: (windows: Window[]) => void): void
  getWindows (): Promise<Window[]>
  showWindows (): void
  hideWindows (): void

  requestMedia (id: string, src: string): Promise<string | null>

  setScene (scene: SceneJSON): void
  createScene (canvasIds?: string[]): void
  removeScene (id: string): void
  onSceneUpdated (callback: (id: string, scene: SceneJSON | null) => void): void
  getScenes (): Promise<SceneJSON[]>
  setActiveScenes (canvasToSceneId: Record<string, string>): void
  onActiveScenesChanged (callback: (canvasToSceneId: Record<string, string>) => void): void
}
