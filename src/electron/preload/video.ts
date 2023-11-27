import { contextBridge, ipcRenderer } from 'electron'
import { ComponentJSON } from '../../canvas/Component'
import { CanvasJSON } from '../../canvas/Canvas'
import { WindowJSON } from '../../canvas/Window'

contextBridge.exposeInMainWorld('bridge', {
  onCanvasUpdated(callback: (canvas: CanvasJSON | null) => void) {
    ipcRenderer.on('canvasUpdate', (event, canvas) => {
      callback(canvas)
    })
  },
  getCanvas() {
    return ipcRenderer.invoke('getCanvas')
  },
  onComponentUpdated(callback: (id: string, component: ComponentJSON | null) => void): void {
    ipcRenderer.on('componentUpdate', (event, id, component) => {
      callback(id, component)
    })
  },
  getComponents() {
    return ipcRenderer.invoke('getComponents')
  },
  getWindow () {
    return ipcRenderer.invoke('getWindow')
  },
  onWindowUpdated (callback: (window: WindowJSON | null) => void) {
    ipcRenderer.on('windowUpdate', (event, window) => {
      callback(window)
    })
  },
  requestMedia (id: string, src: string) {
    return ipcRenderer.invoke('requestMedia', id, src)
  }
})