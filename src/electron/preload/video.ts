import { contextBridge, ipcRenderer } from 'electron'
import { CanvasStatic } from '../../canvas/Canvas'

contextBridge.exposeInMainWorld('bridge', {
  setCanvas(canvasStatic: CanvasStatic) {
    ipcRenderer.send('setCanvasBw', canvasStatic)
  },
  onCanvasUpdate(callback: (canvas: any) => void) {
    ipcRenderer.on('canvasUpdate', (event, canvas) => {
      callback(canvas)
    })
  }
})