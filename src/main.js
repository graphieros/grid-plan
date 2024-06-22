import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { GridPlan } from 'grid-plan'

const app = createApp(App)
app.component("GridPlan", GridPlan);
app.mount('#app')