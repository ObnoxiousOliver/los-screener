import { CanvasJSON } from './canvas/Canvas'
import { ComponentJSON } from './canvas/Component'

export interface BridgeType {
  setCanvas (canvas: CanvasJSON): void
  removeCanvas (id: string): void
  onCanvasUpdate (callback: (id: string, canvas: CanvasJSON | null) => void): void
  getCanvases (): Promise<CanvasJSON[]>
  setComponent (component: ComponentJSON): void
  onComponentUpdate (callback: (id: string, component: ComponentJSON | null) => void): void
  getComponents (): Promise<ComponentJSON[]>
}
