<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const categories = [
  {
    title: 'tools.games',
    items: [
      { name: 'Hangman', route: 'tool-hangman' },
      { name: 'Coin Catcher', route: 'tool-coin-catcher' },
      { name: 'Roleplay Adventure', route: 'tool-roleplay-adventure' },
      { name: 'Turtle Racing', route: 'tool-turtle-racing' },
      { name: 'Aim Trainer', route: 'tool-aim-trainer' },
      { name: 'Rock Paper Scissors', route: 'tool-rps' },
    ]
  },
  {
    title: 'tools.mathTools',
    items: [
      { name: 'Scientific Calculator', route: 'tool-sci-calc' },
      { name: 'Equation Grapher', route: 'tool-eq-grapher' },
      { name: 'Statistics', route: 'tool-statistics' },
      { name: 'Quadratic', route: 'tool-quadratic' },
      { name: 'Shapes', route: 'tool-shapes' },
    ]
  },
  {
    title: 'tools.nerTools',
    items: [
      { name: 'Text Summarizer', route: 'tool-text-summarizer' },
      { name: 'Sentiment Analysis', route: 'tool-sentiment' },
    ]
  },
  {
    title: 'tools.languageTools',
    items: [
      { name: 'Aksara Sunda Translator', route: 'tool-aksara-sunda' },
    ]
  }
]
</script>

<template>
  <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />

  <div class="app-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <header class="top-bar">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h2 class="top-bar-title">{{ t('tools.title') }}</h2>
      <span class="top-bar-user">{{ auth.user?.username }}</span>
    </header>

    <main class="app-content">
      <div v-for="cat in categories" :key="cat.title" class="category-section">
        <h3 class="category-title">{{ t(cat.title) }}</h3>
        <div class="tools-grid">
          <button v-for="item in cat.items" :key="item.route" @click="router.push({ name: item.route })" class="tool-card">
            {{ item.name }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.08); color: #fff; }

.top-bar-title { font-size: 1.1rem; font-weight: 700; color: #fff; }
.top-bar-user { margin-left: auto; font-size: 13px; color: #999; }

.app-content { padding: 24px; max-width: 800px; margin: 0 auto; }

.category-section { margin-bottom: 28px; }

.category-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #81c784;
  margin-bottom: 12px;
  font-weight: 700;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.tool-card {
  padding: 20px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  text-align: center;
  color: #e0e0e0;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.tool-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  border-color: rgba(76,175,80,0.3);
}

@media (max-width: 768px) {
  .app-layout { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .app-content { padding: 16px; }
  .tools-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
