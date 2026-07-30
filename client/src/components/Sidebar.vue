<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'collapsed-change'])

const collapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

onMounted(() => {
  emit('collapsed-change', collapsed.value)
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value)
  emit('collapsed-change', collapsed.value)
}

function nav(path) {
  router.push(path)
  emit('close')
}

function logout() {
  auth.logout()
  router.push('/login')
  emit('close')
}

const menuItems = computed(() => [
  { path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1', key: 'dashboard' },
  { path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', key: 'profile' },
  { path: '/health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', key: 'health' },
  ...(auth.user?.role !== 'admin' ? [{ path: '/money', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', key: 'money' }] : []),
  { path: '/estate', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', key: 'estate' },
  { path: '/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', key: 'chat' },
  { path: '/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', key: 'library' },
])

const adminItems = [
  { path: '/list', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', key: 'list' },
]

const extraItems = [
  ...(auth.user?.role !== 'admin' ? [{ path: '/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', key: 'categories' }] : []),
  { path: '/tools', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', key: 'tools' },
]
</script>

<template>
  <div class="sidebar-overlay" :class="{ visible: open }" @click="emit('close')"></div>
  <aside class="sidebar" :class="{ open, collapsed }">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <span class="brand-icon">V</span>
        <span v-if="!collapsed" class="brand-text">{{ t('app.title') }}</span>
      </div>
      <div class="sidebar-header-actions">
        <button class="sidebar-collapse-toggle desktop-only" @click="toggleCollapse" :title="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')">
          <svg v-if="!collapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 5l7 7-7 7M6 5l7 7-7 7"/></svg>
        </button>
        <button class="sidebar-close mobile-only" @click="emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <div class="sidebar-user" v-if="!collapsed">
      <div class="sidebar-avatar">{{ (auth.user?.username || '?')[0].toUpperCase() }}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-username">{{ auth.user?.username }}</div>
        <div class="sidebar-role">{{ auth.user?.role === 'admin' ? t('nav.admin') : t('nav.user') }}</div>
      </div>
    </div>

    <div class="sidebar-user-collapsed" v-else>
      <div class="sidebar-avatar" :title="auth.user?.username">{{ (auth.user?.username || '?')[0].toUpperCase() }}</div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <span v-if="!collapsed" class="sidebar-section-title">{{ t('nav.dashboard') }}</span>
        <button v-for="item in menuItems" :key="item.key" class="sidebar-link" :class="{ active: $route.path === item.path }" @click="nav(item.path)" :title="collapsed ? t('nav.' + item.key) : undefined">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="item.icon"/></svg>
          <span v-if="!collapsed">{{ t('nav.' + item.key) }}</span>
        </button>
      </div>

      <div v-if="auth.user?.role === 'admin'" class="sidebar-section">
        <span v-if="!collapsed" class="sidebar-section-title">{{ t('nav.admin') }}</span>
        <button v-for="item in adminItems" :key="item.key" class="sidebar-link" :class="{ active: $route.path === item.path }" @click="nav(item.path)" :title="collapsed ? t('nav.' + item.key) : undefined">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="item.icon"/></svg>
          <span v-if="!collapsed">{{ t('nav.' + item.key) }}</span>
        </button>
      </div>

      <div class="sidebar-section">
        <span v-if="!collapsed" class="sidebar-section-title">{{ t('nav.more') }}</span>
        <button v-for="item in extraItems" :key="item.key" class="sidebar-link" :class="{ active: $route.path === item.path }" @click="nav(item.path)" :title="collapsed ? t('nav.' + item.key) : undefined">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="item.icon"/></svg>
          <span v-if="!collapsed">{{ t('nav.' + item.key) }}</span>
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div v-if="!collapsed" class="sidebar-lang">
        <span class="sidebar-lang-label">{{ t('nav.language') }}</span>
        <LanguageSwitcher />
      </div>
      <button class="sidebar-link sidebar-logout" @click="logout" :title="collapsed ? t('nav.logout') : undefined">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        <span v-if="!collapsed">{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
  backdrop-filter: blur(2px);
}
.sidebar-overlay.visible { display: block; }

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid var(--border-color);
  min-height: 56px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.brand-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-teal));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
}

.brand-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.sidebar-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.sidebar-collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}
.sidebar-collapse-toggle:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }

.sidebar-close {
  display: none;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.sidebar-close:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-user-collapsed {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-teal));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.sidebar-user-info { overflow: hidden; }

.sidebar-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-role {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.sidebar-section {
  padding: 4px 0;
}

.sidebar-section-title {
  display: block;
  padding: 8px 16px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.collapsed .sidebar-section-title {
  padding: 4px 0;
  text-align: center;
  font-size: 9px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  border-left: 3px solid transparent;
}

.collapsed .sidebar-link {
  justify-content: center;
  padding: 10px;
  border-left: none;
}

.sidebar-link:hover {
  background: rgba(255,255,255,0.04);
  color: var(--text-primary);
}

.sidebar-link.active {
  background: rgba(52, 168, 83, 0.08);
  color: var(--accent-green);
  border-left-color: var(--accent-green);
}

.collapsed .sidebar-link.active {
  border-left-color: transparent;
}

.sidebar-link svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.sidebar-link.active svg {
  opacity: 1;
}

.sidebar-footer {
  padding: 8px 0;
  border-top: 1px solid var(--border-color);
}

.sidebar-lang {
  padding: 8px 16px;
}

.sidebar-lang-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.sidebar-logout {
  color: var(--accent-red) !important;
}
.sidebar-logout:hover {
  background: rgba(244, 67, 54, 0.08) !important;
}

.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); width: 240px; }
  .sidebar.open { transform: translateX(0); }
  .sidebar.collapsed { width: 240px; }
  .sidebar-close { display: flex; }
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
}
</style>
