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

const bmiHistory = ref([])
const sugarHistory = ref([])
const vitalHistory = ref([])
const showBmiHistory = ref(false)
const showSugarHistory = ref(false)
const showVitalHistory = ref(false)
const historyLoading = ref(false)

onMounted(async () => {
  if (!auth.isLoggedIn) return
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
  try {
    await api.post('/bmi', { identity_id: selectedIdentity.value, weight: bmiWeight.value })
    bmiWeight.value = ''
    flash(t('flash.bmiSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.bmiSaveFailed'), 'error') }
}

async function submitSugar() {
  try {
    await api.post('/bloodsugar', { identity_id: selectedIdentity.value, sugar: sugarValue.value })
    sugarValue.value = ''
    flash(t('flash.sugarSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.sugarSaveFailed'), 'error') }
}

async function submitVitals() {
  try {
    await api.post('/vital-signs', { identity_id: selectedIdentity.value, ...vitals.value })
    vitals.value = { systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' }
    flash(t('flash.vitalsSaved'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.vitalsSaveFailed'), 'error') }
}

async function toggleBmiHistory() {
  showBmiHistory.value = !showBmiHistory.value
  if (showBmiHistory.value && bmiHistory.value.length === 0) {
    if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); showBmiHistory.value = false; return }
    historyLoading.value = true
    try {
      const { data: res } = await api.get(`/bmi/history/${selectedIdentity.value}`)
      bmiHistory.value = (res?.data?.history || res?.data || []).slice(0, 10)
    } catch (e) { console.error(e) }
    historyLoading.value = false
  }
}

async function toggleSugarHistory() {
  showSugarHistory.value = !showSugarHistory.value
  if (showSugarHistory.value && sugarHistory.value.length === 0) {
    if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); showSugarHistory.value = false; return }
    historyLoading.value = true
    try {
      const { data: res } = await api.get(`/bloodsugar/history/${selectedIdentity.value}`)
      sugarHistory.value = (res?.data?.history || res?.data || []).slice(0, 10)
    } catch (e) { console.error(e) }
    historyLoading.value = false
  }
}

async function toggleVitalHistory() {
  showVitalHistory.value = !showVitalHistory.value
  if (showVitalHistory.value && vitalHistory.value.length === 0) {
    if (!selectedIdentity.value) { flash(t('flash.selectPatientFirst'), 'error'); showVitalHistory.value = false; return }
    historyLoading.value = true
    try {
      const { data: res } = await api.get(`/vital-signs/history/${selectedIdentity.value}`)
      vitalHistory.value = (res?.data?.history || res?.data || []).slice(0, 10)
    } catch (e) { console.error(e) }
    historyLoading.value = false
  }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function evalBadgeHR(hr) {
  if (hr < 60) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (hr <= 100) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
function evalBadgeTemp(t) {
  if (t < 35) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (t <= 37.2) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
function evalBadgeSpO2(s) {
  if (s < 90) return { label: t('healthMonitor.highRisk'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
  if (s < 95) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
}
function evalBadgeResp(r) {
  if (r < 12) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (r <= 20) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
</script>

<template>
  <template v-if="auth.isLoggedIn">
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
            <select v-model="selectedIdentity" class="select">
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

          <div class="card card-clickable">
            <h3 style="margin-bottom:12px;color:#fff;cursor:pointer" @click="toggleBmiHistory">{{ t('dashboard.bmi') }}</h3>
            <input v-model="bmiWeight" type="number" :placeholder="t('dashboard.weightKg')" class="input" style="margin-bottom:8px" />
            <button @click="submitBMI" class="btn btn-green btn-block">{{ t('dashboard.saveBMI') }}</button>
            <div v-if="showBmiHistory && bmiHistory.length > 0" class="history-section">
              <h4 style="margin:12px 0 8px;color:#81c784;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px">{{ t('history.bmiHistory') }}</h4>
              <div class="history-table-wrap">
                <table class="history-table">
                  <thead>
                    <tr><th>{{ t('healthMonitor.date') }}</th><th>{{ t('history.weight') }} (kg)</th><th>BMI</th><th>{{ t('history.result') }}</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in bmiHistory" :key="row.id">
                      <td>{{ formatDate(row.createdAt) }}</td>
                      <td>{{ row.weight }}</td>
                      <td>{{ row.bmi_value != null ? Number(row.bmi_value).toFixed(1) : '-' }}</td>
                      <td><span :style="{ color: row.result?.toLowerCase().includes('normal') ? '#4caf50' : row.result?.toLowerCase().includes('kurus') ? '#ff9800' : '#f44336' }">{{ row.result || '-' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="showBmiHistory && bmiHistory.length === 0 && !historyLoading" style="margin-top:8px;font-size:0.8rem;color:#888">{{ t('healthMonitor.noData') }}</div>
          </div>

          <div class="card card-clickable">
            <h3 style="margin-bottom:12px;color:#fff;cursor:pointer" @click="toggleSugarHistory">{{ t('dashboard.bloodSugar') }}</h3>
            <input v-model="sugarValue" type="number" :placeholder="t('dashboard.sugarMgDl')" class="input" style="margin-bottom:8px" />
            <button @click="submitSugar" class="btn btn-green btn-block">{{ t('dashboard.saveSugar') }}</button>
            <div v-if="showSugarHistory && sugarHistory.length > 0" class="history-section">
              <h4 style="margin:12px 0 8px;color:#81c784;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px">{{ t('history.sugarHistory') }}</h4>
              <div class="history-table-wrap">
                <table class="history-table">
                  <thead>
                    <tr><th>{{ t('healthMonitor.date') }}</th><th>{{ t('healthMonitor.bloodSugarLabel') }} (mg/dL)</th><th>{{ t('history.conclusion') }}</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in sugarHistory" :key="row.id">
                      <td>{{ formatDate(row.createdAt) }}</td>
                      <td>{{ row.result }}</td>
                      <td><span :style="{ color: row.conclusion?.toLowerCase().includes('normal') ? '#4caf50' : row.conclusion?.toLowerCase().includes('rendah') ? '#ff9800' : '#f44336' }">{{ row.conclusion || '-' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="showSugarHistory && sugarHistory.length === 0 && !historyLoading" style="margin-top:8px;font-size:0.8rem;color:#888">{{ t('healthMonitor.noData') }}</div>
          </div>

          <div class="card card-clickable">
            <h3 style="margin-bottom:12px;color:#fff;cursor:pointer" @click="toggleVitalHistory">{{ t('dashboard.vitalSigns') }}</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input v-model="vitals.systolic" type="number" :placeholder="t('dashboard.systolic')" class="input" />
              <input v-model="vitals.diastolic" type="number" :placeholder="t('dashboard.diastolic')" class="input" />
              <input v-model="vitals.heart_rate" type="number" :placeholder="t('dashboard.heartRate')" class="input" />
              <input v-model="vitals.temperature" type="number" step="0.1" :placeholder="t('dashboard.temperature')" class="input" />
              <input v-model="vitals.spo2" type="number" :placeholder="t('dashboard.spo2')" class="input" />
              <input v-model="vitals.respiratory_rate" type="number" :placeholder="t('dashboard.respiratoryRate')" class="input" />
            </div>
            <button @click="submitVitals" class="btn btn-green btn-block" style="margin-top:8px">{{ t('dashboard.saveVitals') }}</button>
            <div v-if="showVitalHistory && vitalHistory.length > 0" class="history-section">
              <h4 style="margin:12px 0 8px;color:#81c784;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px">{{ t('healthMonitor.vitalHistory') }}</h4>
              <div class="history-table-wrap">
                <table class="history-table">
                  <thead>
                    <tr><th>{{ t('healthMonitor.date') }}</th><th>BP</th><th>HR</th><th>Temp</th><th>SpO2</th><th>Resp</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in vitalHistory" :key="row.id">
                      <td>{{ formatDate(row.date || row.createdAt) }}</td>
                      <td>{{ row.systolic != null ? row.systolic + '/' + (row.diastolic ?? '-') : '-' }}</td>
                      <td>
                        <span class="vital-label">HR: </span>{{ row.heart_rate ?? '-' }}
                        <span v-if="row.heart_rate != null" class="status-badge-sm" :style="{ background: evalBadgeHR(row.heart_rate).bg, color: evalBadgeHR(row.heart_rate).color }">{{ evalBadgeHR(row.heart_rate).label }}</span>
                      </td>
                      <td>
                        <span class="vital-label">Temp: </span>{{ row.temperature != null ? Number(row.temperature).toFixed(1) : '-' }}
                        <span v-if="row.temperature != null" class="status-badge-sm" :style="{ background: evalBadgeTemp(row.temperature).bg, color: evalBadgeTemp(row.temperature).color }">{{ evalBadgeTemp(row.temperature).label }}</span>
                      </td>
                      <td>
                        <span class="vital-label">SpO2: </span>{{ row.spo2 ?? '-' }}
                        <span v-if="row.spo2 != null" class="status-badge-sm" :style="{ background: evalBadgeSpO2(row.spo2).bg, color: evalBadgeSpO2(row.spo2).color }">{{ evalBadgeSpO2(row.spo2).label }}</span>
                      </td>
                      <td>
                        <span class="vital-label">Resp: </span>{{ row.respiratory_rate ?? '-' }}
                        <span v-if="row.respiratory_rate != null" class="status-badge-sm" :style="{ background: evalBadgeResp(row.respiratory_rate).bg, color: evalBadgeResp(row.respiratory_rate).color }">{{ evalBadgeResp(row.respiratory_rate).label }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="showVitalHistory && vitalHistory.length === 0 && !historyLoading" style="margin-top:8px;font-size:0.8rem;color:#888">{{ t('healthMonitor.noData') }}</div>
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

.card-clickable {
  cursor: pointer;
  transition: transform 0.2s;
}
.card-clickable:hover {
  transform: translateY(-2px);
}

.history-section {
  border-top: 1px solid rgba(255,255,255,0.08);
  margin-top: 12px;
}

.history-table-wrap { overflow-x: auto; }
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.history-table th {
  padding: 8px 10px;
  text-align: left;
  color: #888;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.history-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #bbb;
}

.vital-label {
  font-size: 0.65rem;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge-sm { padding:1px 6px; border-radius:8px; font-size:0.65rem; font-weight:700; margin-left:4px; }

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
  .app-content { padding: 16px; }
  .landing-title { font-size: 1.6rem; }
  .landing-actions { flex-direction: column; align-items: center; }
}
</style>
