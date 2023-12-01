import { createApp } from 'vue'
import App from './App.vue'

import './style/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import colors from 'vuetify/util/colors'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { CanvasJSON } from './canvas/Canvas'
import { BridgeType } from './BridgeType'
import { SlotJSON } from './canvas/Slot'
import { ComponentJSON } from './canvas/Component'

declare const bridge: BridgeType

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          'primary': colors.deepPurple.base,
          'secondary': colors.teal.accent3
        }
      }
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
