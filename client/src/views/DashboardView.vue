<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import api from '../api'
import Sidebar from '../components/Sidebar.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const identities = ref([])
const users = ref([])
const selectedIdentity = ref(null)
const showNewIdentity = ref(false)
const newIdentity = ref({ nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '', id_user: '' })

const bmiWeight = ref('')
const sugarValue = ref('')
const vitals = ref({ systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' })

const msg = ref('')
const msgType = ref('')
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 3000) }

onMounted(async () => {
  await loadIdentities()
  if (auth.user?.role === 'admin') await loadUsers()
})

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities')
    identities.value = res.data
    if (auth.user?.role !== 'admin' && res.data.length > 0) {
      selectedIdentity.value = res.data[0].id
    }
  } catch (e) { console.error(e) }
}

async function loadUsers() {
  try {
    const { data: res } = await api.get('/admin/users')
    users.value = res.data
  } catch (e) { console.error(e) }
}

async function createIdentity() {
  try {
    const payload = { ...newIdentity.value }
    if (auth.user?.role === 'admin' && payload.id_user) {
      payload.id_user = Number(payload.id_user)
    } else {
      delete payload.id_user
    }
    const { data: res } = await api.post('/identities', payload)
    showNewIdentity.value = false
    newIdentity.value = { nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '', id_user: '' }
    await loadIdentities()
    selectedIdentity.value = res.data.id
    flash(t('flash.patientCreated'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.createFailed'), 'error') }
}

function selectIdentity(id) { selectedIdentity.value = id }

async function submitBMI() {
  if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); return }
  try {
    await api.post('/bmi', { identity_id: selectedIdentity.value, weight: bmiWeight.value })
    bmiWeight.value = ''
    flash(t('flash.bmiSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.bmiSaveFailed'), 'error') }
}

async function submitSugar() {
  if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); return }
  try {
    await api.post('/bloodsugar', { identity_id: selectedIdentity.value, sugar: sugarValue.value })
    sugarValue.value = ''
    flash(t('flash.sugarSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.sugarSaveFailed'), 'error') }
}

async function submitVitals() {
  if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); return }
  try {
    await api.post('/vital-signs', { identity_id: selectedIdentity.value, ...vitals.value })
    vitals.value = { systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' }
    flash(t('flash.vitalsSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.vitalsSaveFailed'), 'error') }
}
</script>

<template>
  <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />

  <div class="app-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <header class="top-bar">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h2 class="top-bar-title">{{ t('dashboard.title') }}</h2>
      <span class="top-bar-user">{{ auth.user?.username }}</span>
    </header>

    <main class="app-content">
      <div v-if="msg" :class="['flash', msgType === 'success' ? 'flash-success' : 'flash-error']">{{ msg }}</div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <h3 v-if="auth.user?.role==='admin'" style="margin-bottom:8px;color:#fff">{{ t('dashboard.selectOrCreate') }}</h3>
          <select v-model="selectedIdentity" :disabled="auth.user?.role !== 'admin'" class="select">
            <option :value="null" disabled>{{ t('dashboard.selectPatient') }}</option>
            <option v-for="i in identities" :key="i.id" :value="i.id">{{ i.name }} ({{ i.nik || '-' }})</option>
          </select>
          <button v-if="auth.user?.role==='admin'" @click="showNewIdentity = !showNewIdentity" class="btn btn-green btn-block" style="margin-top:8px">
            {{ showNewIdentity ? t('dashboard.cancel') : t('dashboard.newPatient') }}
          </button>
          <div v-if="showNewIdentity" style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <select v-if="auth.user?.role==='admin'" v-model="newIdentity.id_user" class="select">
              <option value="" disabled>{{ t('dashboard.selectUser') }}</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }} ({{ u.email }})</option>
            </select>
            <input v-model="newIdentity.name" :placeholder="t('dashboard.name')" required class="input" />
            <input v-model="newIdentity.nik" :placeholder="t('auth.nik')" class="input" />
            <input v-model="newIdentity.height" type="number" :placeholder="t('dashboard.weightKg').replace('Weight', 'Height').replace('kg', 'cm')" required class="input" />
            <input v-model="newIdentity.birthplace" :placeholder="t('auth.birthplace')" class="input" />
            <input v-model="newIdentity.birthdate" type="date" class="input" />
            <input v-model="newIdentity.address" :placeholder="t('auth.address')" class="input" />
            <button @click="createIdentity" class="btn btn-green btn-block">{{ t('dashboard.save') }}</button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('dashboard.bmi') }}</h3>
          <input v-model="bmiWeight" type="number" :placeholder="t('dashboard.weightKg')" class="input" style="margin-bottom:8px" />
          <button @click="submitBMI" class="btn btn-green btn-block">{{ t('dashboard.saveBMI') }}</button>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('dashboard.bloodSugar') }}</h3>
          <input v-model="sugarValue" type="number" :placeholder="t('dashboard.sugarMgDl')" class="input" style="margin-bottom:8px" />
          <button @click="submitSugar" class="btn btn-green btn-block">{{ t('dashboard.saveSugar') }}</button>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('dashboard.vitalSigns') }}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input v-model="vitals.systolic" type="number" :placeholder="t('dashboard.systolic')" class="input" />
            <input v-model="vitals.diastolic" type="number" :placeholder="t('dashboard.diastolic')" class="input" />
            <input v-model="vitals.heart_rate" type="number" :placeholder="t('dashboard.heartRate')" class="input" />
            <input v-model="vitals.temperature" type="number" step="0.1" :placeholder="t('dashboard.temperature')" class="input" />
            <input v-model="vitals.spo2" type="number" :placeholder="t('dashboard.spo2')" class="input" />
            <input v-model="vitals.respiratory_rate" type="number" :placeholder="t('dashboard.respiratoryRate')" class="input" />
          </div>
          <button @click="submitVitals" class="btn btn-green btn-block" style="margin-top:8px">{{ t('dashboard.saveVitals') }}</button>
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
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

.top-bar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.top-bar-user {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
}

.app-content {
  padding: 24px;
}

@media (max-width: 768px) {
  .app-layout { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .app-content { padding: 16px; }
}
</style>
