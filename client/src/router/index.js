import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import Verify2FAView from '../views/Verify2FAView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import ListView from '../views/ListView.vue'
import HistoryView from '../views/HistoryView.vue'
import ToolsView from '../views/ToolsView.vue'
import EstateView from '../views/EstateView.vue'
import HealthMonitorView from '../views/HealthMonitorView.vue'
import MoneyDashboardView from '../views/MoneyDashboardView.vue'
import ChatView from '../views/ChatView.vue'
import LibraryView from '../views/LibraryView.vue'
import CategoriesView from '../views/CategoriesView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
  { path: '/verify-2fa', name: 'verify-2fa', component: Verify2FAView, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { auth: true } },
  { path: '/list', name: 'list', component: ListView, meta: { auth: true, admin: true } },
  { path: '/history/:id', name: 'history', component: HistoryView, meta: { auth: true } },
  { path: '/tools', name: 'tools', component: ToolsView, meta: { auth: true } },
  { path: '/estate', name: 'estate', component: EstateView, meta: { auth: true } },
  { path: '/health', name: 'health', component: HealthMonitorView, meta: { auth: true } },
  { path: '/money', name: 'money', component: MoneyDashboardView, meta: { auth: true } },
  { path: '/chat', name: 'chat', component: ChatView, meta: { auth: true } },
  { path: '/library', name: 'library', component: LibraryView, meta: { auth: true } },
  { path: '/categories', name: 'categories', component: CategoriesView, meta: { auth: true } },

  { path: '/tools/hangman', name: 'tool-hangman', component: () => import('../views/tools/Hangman.vue'), meta: { auth: true } },
  { path: '/tools/coin-catcher', name: 'tool-coin-catcher', component: () => import('../views/tools/CoinCatcher.vue'), meta: { auth: true } },
  { path: '/tools/roleplay-adventure', name: 'tool-roleplay-adventure', component: () => import('../views/tools/RoleplayAdventure.vue'), meta: { auth: true } },
  { path: '/tools/turtle-racing', name: 'tool-turtle-racing', component: () => import('../views/tools/TurtleRacing.vue'), meta: { auth: true } },
  { path: '/tools/aim-trainer', name: 'tool-aim-trainer', component: () => import('../views/tools/AimTrainer.vue'), meta: { auth: true } },
  { path: '/tools/rock-paper-scissors', name: 'tool-rps', component: () => import('../views/tools/RockPaperScissors.vue'), meta: { auth: true } },
  { path: '/tools/scientific-calculator', name: 'tool-sci-calc', component: () => import('../views/tools/ScientificCalculator.vue'), meta: { auth: true } },
  { path: '/tools/equation-grapher', name: 'tool-eq-grapher', component: () => import('../views/tools/EquationGrapher.vue'), meta: { auth: true } },
  { path: '/tools/statistics', name: 'tool-statistics', component: () => import('../views/tools/Statistics.vue'), meta: { auth: true } },
  { path: '/tools/quadratic', name: 'tool-quadratic', component: () => import('../views/tools/Quadratic.vue'), meta: { auth: true } },
  { path: '/tools/shapes', name: 'tool-shapes', component: () => import('../views/tools/Shapes.vue'), meta: { auth: true } },
  { path: '/tools/text-summarizer', name: 'tool-text-summarizer', component: () => import('../views/tools/TextSummarizer.vue'), meta: { auth: true } },
  { path: '/tools/sentiment-analysis', name: 'tool-sentiment', component: () => import('../views/tools/SentimentAnalysis.vue'), meta: { auth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) {
    auth.logout()
    return { name: 'login' }
  }
  if (to.meta.guest && auth.isLoggedIn) return { name: 'dashboard' }
  if (to.meta.admin && auth.user?.role !== 'admin') return { name: 'dashboard' }
})

export default router
