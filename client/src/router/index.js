import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import Verify2FAView from '../views/Verify2FAView.vue'
import DashboardView from '../views/DashboardView.vue'
import ListView from '../views/ListView.vue'
import HistoryView from '../views/HistoryView.vue'
import SummaryView from '../views/SummaryView.vue'
import ToolsView from '../views/ToolsView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
  { path: '/verify-2fa', name: 'verify-2fa', component: Verify2FAView, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: DashboardView, meta: { auth: true } },
  { path: '/list', name: 'list', component: ListView, meta: { auth: true } },
  { path: '/history/:id', name: 'history', component: HistoryView, meta: { auth: true } },
  { path: '/summary', name: 'summary', component: SummaryView, meta: { auth: true } },
  { path: '/tools', name: 'tools', component: ToolsView, meta: { auth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return { name: 'login' }
  if (to.meta.guest && auth.isLoggedIn) return { name: 'dashboard' }
})

export default router
