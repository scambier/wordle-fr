import './index.css'

import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'

import App from './App.vue'
import { showToast } from './composables/toast-manager'
import router from './router'

registerSW({
  onOfflineReady() {
    showToast('Ce jeu peut être installé<br>pour fonctionner hors-ligne.', 2000)
  },
})

const app = createApp(App)

app.use(router)

app.mount('#app')
