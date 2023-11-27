import { contextBridge, ipcRenderer } from 'electron'
import { ComponentJSON } from '../../canvas/Component'

contextBridge.exposeInMainWorld('bridge', {
  onCanvasUpdate(callback: (canvas: ComponentJSON | null) => void) {
    ipcRenderer.on('canvasUpdate', (event, canvas) => {
      callback(canvas)
    })
  },
  getCanvas() {
    return ipcRenderer.invoke('getCanvas')
  },
  onComponentUpdate(callback: (id: string, component: ComponentJSON | null) => void): void {
    ipcRenderer.on('componentUpdate', (event, id, component) => {
      callback(id, component)
    })
  },
  getComponents() {
    return ipcRenderer.invoke('getComponents')
  }
})