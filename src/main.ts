import { createApp } from 'vue'
import App from './App.vue'

import './main.scss'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { CanvasJSON } from './canvas/Canvas'
import { BridgeType } from './BridgeType'
import { SlotJSON } from './canvas/Slot'
import { ComponentJSON } from './canvas/Component'

declare const bridge: BridgeType

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark'
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})

createApp(App)
  .use(vuetify)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })

export function sendCanvasUpdate (id: string, canvas: CanvasJSON): void {
  bridge.setCanvas(canvas)
}

export function sendComponentUpdate (component: ComponentJSON): void {
  bridge.setComponent(component)
}

export function sendSlotUpdate (canvasId: string, slot: SlotJSON): void {
  bridge.setSlot(canvasId, slot)
}
