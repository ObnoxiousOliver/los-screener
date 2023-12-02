import { createApp } from 'vue'
import App from './App.vue'

import './style/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import colors from 'vuetify/util/colors'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

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