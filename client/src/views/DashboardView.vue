<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const features = [
  { route: '/health', icon: 'health', label: 'healthMonitoring', desc: 'healthMonitoringDesc' },
  ...(auth.user?.role !== 'admin' ? [{ route: '/money', icon: 'money', label: 'moneyManagement', desc: 'moneyManagementDesc' }] : []),
  { route: '/estate', icon: 'estate', label: 'estateManagement', desc: 'estateManagementDesc' },
  ...(auth.user?.role === 'admin' ? [{ route: '/list', icon: 'list', label: 'patientData', desc: 'patientDataDesc' }] : []),
  { route: '/tools', icon: 'tools', label: 'tools', desc: 'toolsDesc' },
  { route: '/library', icon: 'library', label: 'library', desc: 'libraryDesc' },
]
</script>

<template>
  <template v-if="auth.isLoggedIn">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />

    <div class="app-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
      <header class="top-bar">
        <button class="hamburger" @click="sidebarOpen = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <h2 class="top-bar-title">Home</h2>
        <span class="top-bar-user">{{ auth.user?.username }}</span>
      </header>

      <main class="app-content">
        <div class="welcome-section">
          <div class="welcome-avatar">{{ auth.user?.username?.charAt(0).toUpperCase() }}</div>
          <h1 class="welcome-greeting">{{ t('dashboard.greeting') }} {{ auth.user?.username }}!</h1>
          <p class="welcome-subtitle">{{ t('landing.subtitle') }}</p>
        </div>

        <div class="feature-grid">
          <div v-for="f in features" :key="f.route" class="feature-card" @click="router.push(f.route)">
            <div class="feature-icon">
              <svg v-if="f.icon === 'health'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <svg v-else-if="f.icon === 'money'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else-if="f.icon === 'estate'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else-if="f.icon === 'list'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <svg v-else-if="f.icon === 'tools'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              <svg v-else-if="f.icon === 'library'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </div>
            <h3 class="feature-label">{{ t('landing.' + f.label) }}</h3>
            <p class="feature-desc">{{ t('landing.' + f.desc) }}</p>
          </div>
        </div>
      </main>
    </div>
  </template>

  <template v-else>
    <div class="landing-page">
      <div class="landing-hero">
        <div class="landing-brand">
          <span class="landing-brand-icon">V</span>
          <span class="landing-brand-text">{{ t('app.title') }}</span>
        </div>
        <h1 class="landing-title">{{ t('landing.title') }}</h1>
        <p class="landing-subtitle">{{ t('landing.subtitle') }}</p>
        <div class="landing-actions">
          <button @click="router.push('/login')" class="btn btn-green btn-lg">{{ t('auth.loginBtn') }}</button>
          <button @click="router.push('/register')" class="btn btn-outline btn-lg">{{ t('auth.registerBtn') }}</button>
        </div>
      </div>
      <div class="landing-features">
        <div class="landing-feature-card">
          <div class="landing-feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
          <h3>{{ t('landing.healthMonitoring') }}</h3>
          <p>{{ t('landing.healthMonitoringDesc') }}</p>
        </div>
        <div class="landing-feature-card">
          <div class="landing-feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <h3>{{ t('landing.patientProfiles') }}</h3>
          <p>{{ t('landing.patientProfilesDesc') }}</p>
        </div>
        <div class="landing-feature-card">
          <div class="landing-feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3>{{ t('landing.moneyManagement') }}</h3>
          <p>{{ t('landing.moneyManagementDesc') }}</p>
        </div>
        <div class="landing-feature-card">
          <div class="landing-feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3>{{ t('landing.estateManagement') }}</h3>
          <p>{{ t('landing.estateManagementDesc') }}</p>
        </div>
      </div>
    </div>
  </template>
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

.top-bar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.top-bar-user {
  margin-left: auto;
  font-size: 13px;
  color: #999;
}

.app-content {
  padding: 40px 24px;
  max-width: 900px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 48px;
}

.welcome-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  font-size: 28px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 4px 20px rgba(76,175,80,0.3);
}

.welcome-greeting {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 1rem;
  color: #999;
  max-width: 500px;
  margin: 0 auto;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.feature-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  border-color: rgba(76,175,80,0.3);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(76,175,80,0.12);
  color: #66bb6a;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.feature-label {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 0.82rem;
  color: #888;
  line-height: 1.5;
}

.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1b2a, #1b2838, #172a3a);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.landing-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 60px;
  text-align: center;
}

.landing-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.landing-brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 22px;
}

.landing-brand-text {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.landing-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 16px;
  max-width: 600px;
}

.landing-subtitle {
  font-size: 1.1rem;
  color: #999;
  margin-bottom: 40px;
  max-width: 500px;
}

.landing-actions {
  display: flex;
  gap: 16px;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 1rem;
}

.btn-outline {
  background: transparent;
  border: 2px solid rgba(255,255,255,0.2);
  color: #e0e0e0;
}
.btn-outline:hover {
  border-color: #4caf50;
  color: #4caf50;
}

.landing-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  padding: 0 24px 80px;
  max-width: 1000px;
  margin: 0 auto;
}

.landing-feature-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.landing-feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(76,175,80,0.12);
  color: #66bb6a;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.landing-feature-card h3 {
  font-size: 1rem;
  color: #fff;
  margin-bottom: 8px;
}

.landing-feature-card p {
  font-size: 0.85rem;
  color: #888;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .app-layout { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .app-content { padding: 24px 16px; }
  .welcome-greeting { font-size: 1.4rem; }
  .feature-grid { grid-template-columns: 1fr; }
  .landing-title { font-size: 1.6rem; }
  .landing-actions { flex-direction: column; align-items: center; }
}
</style>
