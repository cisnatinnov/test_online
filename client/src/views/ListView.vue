<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import api from '../api'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const users = ref([])
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  try {
    const userRes = await api.get('/admin/users?limit=100')
    const userList = userRes.data?.data?.users || []
    const identitiesRes = await api.get('/identities?limit=100')
    const allIdentities = identitiesRes.data?.data?.identities || []

    users.value = userList.map(u => ({
      ...u,
      identities: allIdentities.filter(i => i.id_user === u.id),
    }))
  } catch (e) { console.error(e) }
  loading.value = false
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    u.username?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.identities?.some(i => i.name?.toLowerCase().includes(q) || i.nik?.includes(q))
  )
})

function openHealth(id) {
  router.push(`/health?identity=${id}`)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />

  <div class="app-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <header class="top-bar">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h2 class="top-bar-title">{{ t('list.title') }}</h2>
      <span class="top-bar-user">{{ auth.user?.username }}</span>
    </header>

    <main class="app-content">
      <div v-if="loading" class="loading-state">{{ t('healthMonitor.loading') }}</div>

      <template v-else>
        <input v-model="search" :placeholder="t('list.searchPlaceholder')" class="input" />

        <div v-for="u in filtered" :key="u.id" class="user-section">
          <div class="user-header">
            <div class="user-avatar">{{ u.username?.charAt(0).toUpperCase() }}</div>
            <div class="user-meta">
              <span class="user-name">{{ u.username }}</span>
              <span class="user-email">{{ u.email }}</span>
              <span class="user-role-badge">{{ u.role }}</span>
            </div>
          </div>

          <div v-if="u.identities?.length" class="identity-list">
            <div v-for="id in u.identities" :key="id.id" class="identity-row">
              <div class="identity-info">
                <span class="identity-name">{{ id.name }}</span>
                <span class="identity-detail">{{ id.nik ? `NIK: ${id.nik}` : '' }}{{ id.gender ? ` | ${id.gender}` : '' }}{{ id.birthdate ? ` | ${formatDate(id.birthdate)}` : '' }}</span>
              </div>
              <button @click="openHealth(id.id)" class="btn btn-sm btn-primary">{{ t('healthMonitor.title') }}</button>
            </div>
          </div>

          <div v-else class="no-identities">{{ t('list.noData') }}</div>
        </div>

        <div v-if="!filtered.length && !loading" class="empty-state">{{ t('list.noData') }}</div>
      </template>
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

.loading-state { text-align: center; padding: 40px; color: #888; }
.empty-state { text-align: center; padding: 40px; color: #666; font-size: 0.9rem; }

.input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  margin-bottom: 20px;
  box-sizing: border-box;
}
.input:focus { border-color: #4caf50; }

.user-section {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-meta { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-size: 0.95rem; font-weight: 700; color: #fff; }
.user-email { font-size: 0.78rem; color: #999; }
.user-role-badge {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(76,175,80,0.15);
  color: #81c784;
  width: fit-content;
}

.identity-list { display: flex; flex-direction: column; gap: 8px; }

.identity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.identity-info { display: flex; flex-direction: column; gap: 2px; }
.identity-name { font-size: 0.88rem; font-weight: 600; color: #e0e0e0; }
.identity-detail { font-size: 0.72rem; color: #888; }

.no-identities { padding: 8px 12px; font-size: 0.82rem; color: #666; }

.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-primary { background: linear-gradient(135deg, #2e7d32, #66bb6a); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(46,125,50,0.4); }

@media (max-width: 768px) {
  .app-layout { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .app-content { padding: 16px; }
  .identity-row { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
