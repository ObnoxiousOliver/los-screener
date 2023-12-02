import { contextBridge, ipcRenderer } from 'electron'
import { BridgeTypeSliceViewer } from '../../BridgeType'

const bridge: BridgeTypeSliceViewer = {
  getWindow () {
    return ipcRenderer.invoke('getWindow')
  },
  getSlice () {
    return ipcRenderer.invoke('getSlice')
  },
  getScene () {
    return ipcRenderer.invoke('getScene')
  },
  getComponents () {
    return ipcRenderer.invoke('getComponents')
  },

  onWindowUpdated (callback) {
    ipcRenderer.on('windowUpdate', (event, window) => {
      callback(window)
    })
  },
  onSliceUpdated (callback) {
    ipcRenderer.on('sliceUpdate', (event, slice) => {
      callback(slice)
    })
  },
  onSceneUpdated (callback) {
    ipcRenderer.on('sceneUpdate', (event, scene) => {
      callback(scene)
    })
  },
  onComponentUpdated (callback) {
    ipcRenderer.on('componentUpdate', (event, id, component) => {
      callback(id, component)
    })
  },

  onComponentActionInvoked (callback) {
    ipcRenderer.on('componentAction', (event, id, action, args) => {
      callback(id, action, args)
    })
  },

  requestMedia (id, src) {
    return ipcRenderer.invoke('requestMedia', id, src)
  }
}

contextBridge.exposeInMainWorld('bridge', bridge)