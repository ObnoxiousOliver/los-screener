import { CanvasJSON } from './canvas/Canvas'
import { ComponentJSON } from './canvas/Component'

declare const bridge: {
  onCanvasUpdate(callback: (canvas: ComponentJSON | null) => void): void
  getCanvas(): Promise<CanvasJSON[]>
  onComponentUpdate(callback: (id: string, component: ComponentJSON | null) => void): void
  getComponents(): Promise<ComponentJSON[]>
}

const root = document.getElementById('root') as HTMLDivElement
