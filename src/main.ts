import './styles/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installPersistence, loadProgress } from './stores/persistence'

// 建立應用：Pinia → Router → mount
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// 嘗試從 localStorage 還原進度（必須在 pinia 安裝後）
loadProgress()
installPersistence()

app.mount('#app')
