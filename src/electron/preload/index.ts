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
import { WindowJSON } from '../../screener/Window'

const bridge: BridgeType = {
  // Canvas Management
  // setCanvas(canvas) {
  //   ipcRenderer.send('setCanvas', canvas)
  // },
  // removeCanvas(id) {
  //   ipcRenderer.send('removeCanvas', id)
  // },
  // onCanvasUpdated(callback) {
  //   ipcRenderer.on('canvasUpdate', (event, id, canvas) => {
  //     callback(id, canvas)
  //   })
  // },
  // getCanvases() {
  //   return ipcRenderer.invoke('getCanvases')
  // },

  // Slice Management
  setSlice(slice) {
    ipcRenderer.send('setSlice', slice)
  },
  removeSlice(id) {
    ipcRenderer.send('removeSlice', id)
  },
  onSliceUpdated(callback) {
    ipcRenderer.on('sliceUpdate', (_, id, slice) => {
      callback(id, slice)
    })
  },
  getSlices() {
    return ipcRenderer.invoke('getSlices')
  },

  // Component Management
  setComponent(component) {
    ipcRenderer.send('setComponent', component)
  },
  removeComponent(id) {
    ipcRenderer.send('removeComponent', id)
  },
  onComponentUpdated(callback) {
    ipcRenderer.on('componentUpdate', (_, id, component) => {
      callback(id, component)
    })
  },
  getComponents() {
    return ipcRenderer.invoke('getComponents')
  },
  invokeComponentAction(id, action, args) {
    return ipcRenderer.invoke('invokeComponentAction', id, action, args)
  },
  onComponentActionInvoked(callback) {
    ipcRenderer.on('componentAction', (_, id, action, args) => {
      callback(id, action, args)
    })
  },

  // Slot Management
  setSlot(sceneId, slotId, slot) {
    ipcRenderer.send('setSlot', sceneId, slotId, slot)
  },

  // Window Management
  setWindow(window) {
    ipcRenderer.send('setWindow', window)
  },
  removeWindow(canvasId) {
    ipcRenderer.send('removeWindow', canvasId)
  },
  onWindowsUpdated(callback) {
    ipcRenderer.on('windowUpdate', (_, windows) => {
      callback(windows)
    })
  },
  async getWindows() {
    const windows: WindowJSON[] = await ipcRenderer.invoke('getWindows')
    return windows
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
    ipcRenderer.on('sceneUpdate', (_, id, scene) => {
      callback(id, scene)
    })
  },

  getScenes() {
    return ipcRenderer.invoke('getScenes')
  },

  setActiveScene(id) {
    ipcRenderer.send('setActiveScene', id)
  },

  onActiveSceneChanged(callback) {
    ipcRenderer.on('activeSceneChanged', (_, id) => {
      callback(id)
    })
    ipcRenderer.invoke('getActiveScene').then(callback)
  },

  // Playback Management
  onPlaybackUpdated(callback) {
    ipcRenderer.on('playbackUpdate', (_, id, playback) => {
      callback(id, playback)
    })
  },

  getPlaybacks() {
    return ipcRenderer.invoke('getPlaybacks')
  },

  setPlayback(playback) {
    ipcRenderer.send('setPlayback', playback)
  },

  removePlayback(id) {
    ipcRenderer.send('removePlayback', id)
  },

  setActivePlayback(id) {
    ipcRenderer.send('setActivePlayback', id)
  },

  onActivePlaybackChanged(callback) {
    ipcRenderer.on('activePlaybackChanged', (_, id) => {
      callback(id)
    })
    ipcRenderer.invoke('getActivePlayback').then(callback)
  },

  // Font Management
  getFonts() {
    return ipcRenderer.invoke('getFonts')
  },

  // History Management
  pushHistory() {
    ipcRenderer.send('pushHistory')
  },

  // Context Menu
  openContextMenu(template) {
    ipcRenderer.send('openContextMenu', template)
  },
  onContextMenuClicked(callback) {
    ipcRenderer.on('contextMenuClicked', (_, id) => {
      callback(id)
    })
    return () => {
      ipcRenderer.removeAllListeners('contextMenuClicked')
    }
  },
  onceContextMenuClosed(callback) {
    ipcRenderer.once('contextMenuClosed', callback)
  }
}

contextBridge.exposeInMainWorld('bridge', bridge)
