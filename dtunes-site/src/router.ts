import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'


import Home from "./components/Home.vue"

const routes: Array<RouteRecordRaw> =  [
  { path: '/', component: Home },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router