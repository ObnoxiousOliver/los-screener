import { createApp } from 'vue'
import App from './App.vue'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { Canvas } from './canvas/Canvas'
import { BridgeType } from './BridgeType'

declare const bridge: BridgeType

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark'
  }
})

createApp(App)
  .use(vuetify)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })

export function sendCanvasUpdate (id: string, canvas: Canvas): void {
  bridge.setCanvas(canvas.toJSON())
}
