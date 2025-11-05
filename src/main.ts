import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TreeView from './views/TreeView.vue'

const app = createApp(TreeView)
app.use(createPinia())
app.mount('#app')
