function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  }
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = 'loaders-css__square-spin'
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    }
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

// ----------------------------------------------------------------------

import { contextBridge, ipcRenderer } from 'electron'
import { BridgeType } from '../../BridgeType'
import { Rect } from '../../helpers/Rect'
import { Window, WindowJSON } from '../../canvas/Window'

const bridge: BridgeType = {
  // Canvas Management
  setCanvas(canvas) {
    ipcRenderer.send('setCanvas', canvas)
  },
  removeCanvas(id) {
    ipcRenderer.send('removeCanvas', id)
  },
  onCanvasUpdated(callback) {
    ipcRenderer.on('canvasUpdate', (event, id, canvas) => {
      callback(id, canvas)
    })
  },
  getCanvases() {
    return ipcRenderer.invoke('getCanvases')
  },

  // Component Management
  setComponent(component) {
    ipcRenderer.send('setComponent', component)
  },
  onComponentUpdated(callback) {
    ipcRenderer.on('componentUpdate', (event, id, component) => {
      callback(id, component)
    })
  },
  getComponents() {
    return ipcRenderer.invoke('getComponents')
  },
  invokeComponentAction(id, action, ...args) {
    return ipcRenderer.invoke('invokeComponentAction', id, action, args)
  },

  // Slot Management
  setSlot(canvasId, slot) {
    ipcRenderer.send('setSlot', canvasId, slot)
  },

  // Window Management
  setWindow(window) {
    ipcRenderer.send('setWindow', window)
  },
  removeWindow(canvasId) {
    ipcRenderer.send('removeWindow', canvasId)
  },
  onWindowsUpdated(callback) {
    ipcRenderer.on('windowUpdate', (event, windows) => {
      windows = Object.fromEntries(
        Object.entries(windows)
          .map(([id, window]) => [
            id, Rect.fromJSON(window)
          ]))
      callback(windows)
    })
  },
  async getWindows() {
    const windows: WindowJSON[] = await ipcRenderer.invoke('getWindows')
    return windows.map(w => Window.fromJSON(w))
  },
  showWindows() {
    ipcRenderer.send('showWindows')
  },
  hideWindows() {
    ipcRenderer.send('hideWindows')
  },

  // Media Management
  requestMedia(id, src) {
    return ipcRenderer.invoke('requestMedia', id, src)
  },

  // Scene Management
  setScene(scene) {
    ipcRenderer.send('setScene', scene)
  },

  createScene(canvasIds) {
    ipcRenderer.send('createScene', canvasIds)
  },

  removeScene(id) {
    ipcRenderer.send('removeScene', id)
  },

  onSceneUpdated(callback) {
    ipcRenderer.on('sceneUpdate', (event, id, scene) => {
      callback(id, scene)
    })
  },

  getScenes() {
    return ipcRenderer.invoke('getScenes')
  },

  setActiveScenes(canvasToSceneId) {
    ipcRenderer.send('setActiveScenes', canvasToSceneId)
  },

  onActiveScenesChanged(callback) {
    ipcRenderer.on('activeScenesChanged', (event, canvasToSceneId) => {
      callback(canvasToSceneId)
    })
    ipcRenderer.invoke('getActiveScenes').then(callback)
  }
}

contextBridge.exposeInMainWorld('bridge', bridge)
