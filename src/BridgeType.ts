import { CanvasStatic } from './canvas/Canvas'
import { PlaybackEntryStatic } from './canvas/Playback'

export interface BridgeType {
  setCanvas (canvas: CanvasStatic): void
  removeCanvas (id: string): void
  onCanvasUpdate (callback: (canvases: CanvasStatic[]) => void): void
  getCanvases (): Promise<CanvasStatic[]>
  createBrowserWindows (createBrowserWindows: boolean): void
  setPlayback (id: string, entries: PlaybackEntryStatic[]): void
  getPlaybacks (): Promise<{ id: string, entries: PlaybackEntryStatic[] }[]>
  startPlayback (id: string): void
}
