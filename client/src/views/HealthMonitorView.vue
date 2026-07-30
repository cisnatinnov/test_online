<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { calculateAge, translateBmiStatus, translateSugarConclusion, translateSugarDescription } from '../utils/helpers'
import Sidebar from '../components/Sidebar.vue'
import api from '../api'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const identities = ref([])
const selectedIdentity = ref(null)
const selectedIdentityData = ref(null)
const bmiWeight = ref('')
const sugarValue = ref('')
const vitals = ref({ systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' })
const msg = ref('')
const msgType = ref('')
const latestVitals = ref(null)
const latestBmi = ref(null)
const bmiHistory = ref([])
const latestBloodSugar = ref(null)
const bloodSugarHistory = ref([])
const vitalHistory = ref([])
const systemHealth = ref(null)
const loading = ref(false)
const lastSaved = ref(null)
const showBmiHistory = ref(false)
const showSugarHistory = ref(false)
const showVitalHistory = ref(false)
const bmiPage = ref(1); const bmiTotalPages = ref(1)
const sugarPage = ref(1); const sugarTotalPages = ref(1)
const vitalPage = ref(1); const vitalTotalPages = ref(1)
const trafficStats = ref(null)
const trafficPeriod = ref('24h')
const trafficLoading = ref(false)
const trafficPeriods = [
  { value: '1h', labelKey: 'healthMonitor.period1h' },
  { value: '24h', labelKey: 'healthMonitor.period24h' },
  { value: '7d', labelKey: 'healthMonitor.period7d' },
  { value: '30d', labelKey: 'healthMonitor.period30d' },
]

const metrics = computed(() => {
  const items = []

  if (latestVitals.value) {
    const v = latestVitals.value.vitalSigns
    const ev = latestVitals.value.evaluation
    if (v && ev) {
      if (ev.bloodPressure) {
        items.push({ type: 'vital', label: t('healthMonitor.bloodPressure'), value: `${v.systolic}/${v.diastolic}`, unit: t('healthMonitor.mmHg'), ...mapStatus(ev.bloodPressure.label) })
      }
      if (ev.heartRate) {
        items.push({ type: 'vital', label: t('healthMonitor.heartRate'), value: v.heart_rate, unit: t('healthMonitor.bpm'), ...mapStatus(ev.heartRate.label) })
      }
      if (ev.temperature) {
        items.push({ type: 'vital', label: t('healthMonitor.temperature'), value: v.temperature, unit: t('healthMonitor.celsius'), ...mapStatus(ev.temperature.label) })
      }
      if (ev.spo2) {
        items.push({ type: 'vital', label: t('healthMonitor.spo2Label'), value: v.spo2, unit: '%', ...mapStatus(ev.spo2.label) })
      }
      if (ev.respiratoryRate) {
        items.push({ type: 'vital', label: t('healthMonitor.respiratoryRate'), value: v.respiratory_rate, unit: t('healthMonitor.perMin'), ...mapStatus(ev.respiratoryRate.label) })
      }
    }
  }

  if (latestBmi.value) {
    items.push({ type: 'bmi', label: t('healthMonitor.bmiHeader'), value: latestBmi.value.bmi_value ?? latestBmi.value.bmi, unit: t('healthMonitor.kgM2'), ...mapBMIStatus(latestBmi.value.status) })
  }
  if (latestBloodSugar.value) {
    const sugarVal = latestBloodSugar.value.result
    const sugarUnit = sugarVal != null ? t('healthMonitor.mgDl') : ''
    const sugarDesc = translateSugarDescription(latestBloodSugar.value.description, t)
    items.push({ type: 'sugar', label: t('healthMonitor.bloodSugarLabel'), value: sugarVal, unit: sugarUnit, desc: sugarDesc, ...mapSugarStatus(latestBloodSugar.value.conclusion) })
  }
  return items
})

const overallStatus = computed(() => {
  if (!latestVitals.value?.evaluation) return 'unknown'
  return latestVitals.value.evaluation.overall === 'Semua normal' ? 'normal' : 'risk'
})

const patientAge = computed(() => calculateAge(selectedIdentityData.value?.birthdate))

function mapStatus(label) {
  const l = (label || '').toLowerCase()
  if (l.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: t('healthMonitor.normal') }
  if (l.includes('rendah') || l.includes('kritis') || l.includes('hipotermia') || l.includes('bradikardia') || l.includes('bradipnea') || l.includes('low') || l.includes('critical')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: t('healthMonitor.low') }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: t('healthMonitor.highRisk') }
}

function mapBMIStatus(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: t('healthMonitor.normal') }
  if (s.includes('kurus') || s.includes('sangat kurus')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: t('healthMonitor.underweight') }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: t('healthMonitor.overweight') }
}

function mapSugarStatus(result) {
  const r = (result || '').toLowerCase()
  if (r.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: t('healthMonitor.normal') }
  if (r.includes('rendah')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: t('healthMonitor.low') }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: t('healthMonitor.high') }
}

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 4000) }

async function loadTrafficStats() {
  trafficLoading.value = true
  try {
    const { data: res } = await api.get(`/health-traffic/stats?period=${trafficPeriod.value}`)
    trafficStats.value = res.data
  } catch (e) { console.error(e) }
  trafficLoading.value = false
}

onMounted(async () => {
  const preselected = route.query.identity ? parseInt(route.query.identity) : null
  if (route.query.identity) router.replace({ query: {} })
  await loadIdentities(preselected)
  await loadSystemHealth()
  if (auth.user?.role === 'admin') await loadTrafficStats()
})

async function loadIdentities(preselected) {
  try {
    const { data: res } = await api.get('/identities')
    const list = res?.data?.identities || []
    identities.value = list
    if (list.length > 0) {
      if (preselected && list.some(i => i.id === preselected)) {
        selectedIdentity.value = preselected
      } else {
        selectedIdentity.value = list[0].id
      }
      await loadPatientHealth()
    }
  } catch (e) { console.error(e) }
}

async function loadSystemHealth() {
  try {
    const { data: res } = await api.get('/health')
    systemHealth.value = res.data
  } catch (e) { systemHealth.value = { status: 'unknown' } }
}

async function loadPatientHealth() {
  if (!selectedIdentity.value) return
  try {
    const { data: res } = await api.get(`/vital-signs/latest/${selectedIdentity.value}`)
    latestVitals.value = res.data
    selectedIdentityData.value = identities.value.find(i => i.id === selectedIdentity.value) || null
    await loadBmiHistory(1)
    await loadSugarHistory(1)
    await loadVitalHistory(1)
  } catch (e) { console.error(e) }
}

async function loadBmiHistory(page) {
  try {
    const { data: res } = await api.get(`/bmi/history/${selectedIdentity.value}`, { params: { page, limit: 10 } })
    const list = res?.data?.history || []
    const current = page === 1 && list[0]
    if (page === 1) {
      latestBmi.value = current ? { weight: current.weight, bmi_value: current.bmi_value, bmi: current.result, status: current.result } : null
    }
    bmiHistory.value = list
    bmiTotalPages.value = Math.ceil((res?.data?.total || 0) / 10) || 1
    bmiPage.value = page
  } catch { if (page === 1) latestBmi.value = null; bmiHistory.value = []; bmiTotalPages.value = 1 }
}

async function loadSugarHistory(page) {
  try {
    const { data: res } = await api.get(`/bloodsugar/history/${selectedIdentity.value}`, { params: { page, limit: 10 } })
    const list = res?.data?.history || []
    const current = page === 1 && list[0]
    if (page === 1) {
      latestBloodSugar.value = current ? { result: current.result, conclusion: current.conclusion || 'Normal', description: current.description || '', age: current.age } : null
    }
    bloodSugarHistory.value = list
    sugarTotalPages.value = Math.ceil((res?.data?.total || 0) / 10) || 1
    sugarPage.value = page
  } catch { if (page === 1) latestBloodSugar.value = null; bloodSugarHistory.value = []; sugarTotalPages.value = 1 }
}

async function loadVitalHistory(page) {
  try {
    const hist = await api.get(`/vital-signs/history/${selectedIdentity.value}`, { params: { page, limit: 10 } })
    vitalHistory.value = hist?.data?.data?.history || []
    vitalTotalPages.value = Math.ceil((hist?.data?.data?.total || 0) / 10) || 1
    vitalPage.value = page
  } catch { vitalHistory.value = []; vitalTotalPages.value = 1 }
}

async function submitBMI() {
  try {
    await api.post('/bmi', { identity_id: selectedIdentity.value, weight: bmiWeight.value })
    bmiWeight.value = ''
    flash(t('flash.bmiSaved'), 'success')
    await loadPatientHealth()
  } catch (e) { flash(e.response?.data?.error || t('flash.bmiSaveFailed'), 'error') }
}

async function submitSugar() {
  try {
    await api.post('/bloodsugar', { identity_id: selectedIdentity.value, sugar: sugarValue.value })
    sugarValue.value = ''
    flash(t('flash.sugarSaved'), 'success')
    await loadPatientHealth()
  } catch (e) { flash(e.response?.data?.error || t('flash.sugarSaveFailed'), 'error') }
}

async function submitVitals() {
  loading.value = true
  try {
    await api.post('/vital-signs', { identity_id: selectedIdentity.value, ...vitals.value })
    vitals.value = { systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' }
    flash(t('flash.vitalsSaved'), 'success')
    await loadPatientHealth()
  } catch (e) { flash(e.response?.data?.error || t('flash.vitalsSaveFailed'), 'error') }
  loading.value = false
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toggleHistory(type) {
  if (type === 'bmi') showBmiHistory.value = !showBmiHistory.value
  else if (type === 'sugar') showSugarHistory.value = !showSugarHistory.value
  else if (type === 'vital') showVitalHistory.value = !showVitalHistory.value
}
</script>

<template>
  <div class="health-page" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />
    <nav class="top-nav">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h1 class="logo" @click="router.push('/')" style="cursor:pointer">{{ t('healthMonitor.title') }}</h1>
      <span class="user-badge">{{ auth.user?.username }}</span>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="layout">
      <aside class="sidebar">
        <div class="card" v-if="auth.user?.role==='admin'">
          <h3 class="card-title">{{ t('dashboard.selectOrCreate') }}</h3>
          <select v-model="selectedIdentity" @change="loadPatientHealth" class="select-input">
            <option :value="null" disabled>{{ t('dashboard.selectPatient') }}</option>
            <option v-for="i in identities" :key="i.id" :value="i.id">{{ i.name }} ({{ i.nik || '-' }})</option>
          </select>
        </div>

        <div class="card">
          <h3 class="card-title">{{ t('dashboard.bmi') }}</h3>
          <input v-model="bmiWeight" type="number" :placeholder="t('dashboard.weightKg')" class="input" style="margin-bottom:8px" />
          <button class="btn btn-primary btn-block" @click="submitBMI">{{ t('dashboard.saveBMI') }}</button>
        </div>

        <div class="card">
          <h3 class="card-title">{{ t('dashboard.bloodSugar') }}</h3>
          <input v-model="sugarValue" type="number" :placeholder="t('dashboard.sugarMgDl')" class="input" style="margin-bottom:8px" />
          <button class="btn btn-primary btn-block" @click="submitSugar">{{ t('dashboard.saveSugar') }}</button>
        </div>

        <div class="card">
          <h3 class="card-title">{{ t('dashboard.vitalSigns') }}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input v-model="vitals.systolic" type="number" :placeholder="t('dashboard.systolic')" class="input" />
            <input v-model="vitals.diastolic" type="number" :placeholder="t('dashboard.diastolic')" class="input" />
            <input v-model="vitals.heart_rate" type="number" :placeholder="t('dashboard.heartRate')" class="input" />
            <input v-model="vitals.temperature" type="number" step="0.1" :placeholder="t('dashboard.temperature')" class="input" />
            <input v-model="vitals.spo2" type="number" :placeholder="t('dashboard.spo2')" class="input" />
            <input v-model="vitals.respiratory_rate" type="number" :placeholder="t('dashboard.respiratoryRate')" class="input" />
          </div>
          <button class="btn btn-primary btn-block" style="margin-top:8px" @click="submitVitals" :disabled="loading">
            {{ loading ? t('healthMonitor.saving') : t('dashboard.saveVitals') }}
          </button>
        </div>
      </aside>

      <main class="content">
        <div class="section-header">
            <h2>{{ t('healthMonitor.healthDashboard') }}</h2>
            <span :class="['overall-badge', overallStatus]">
              {{ overallStatus === 'normal' ? t('healthMonitor.allNormal') : overallStatus === 'risk' ? t('healthMonitor.abnormalDetected') : t('healthMonitor.noData') }}
            </span>
          </div>

          <div v-if="selectedIdentityData" class="patient-chip">
            <span class="patient-name">{{ selectedIdentityData.name }}</span>
            <span class="patient-meta">{{ t('history.age') }}: {{ patientAge ?? '-' }}</span>
            <span class="patient-meta">{{ selectedIdentityData.gender === 'Male' ? t('auth.male') : selectedIdentityData.gender === 'Female' ? t('auth.female') : '-' }}</span>
          </div>

          <div class="metrics-grid">
            <div v-for="m in metrics" :key="m.label" class="metric-card card-clickable" :style="{ borderColor: m.color }" @click="toggleHistory(m.type)">
              <div class="metric-header">
                <span class="metric-label">{{ m.label }}</span>
                <span class="metric-badge" :style="{ background: m.bg, color: m.color }">{{ m.icon }}</span>
                <span class="metric-expand-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </div>
              <div class="metric-value" :style="{ color: m.color }">{{ m.value }}<small>{{ m.unit }}</small></div>
              <div v-if="m.desc" class="metric-desc">{{ m.desc }}</div>
              <div class="metric-bar">
                <div class="metric-bar-fill" :style="{ width: '100%', background: m.color, opacity: 0.3 }"></div>
              </div>
            </div>
          </div>

          <div v-if="metrics.length === 0" class="empty-metrics">
            {{ t('healthMonitor.noVitalsYet') }}
          </div>

          <div class="card" v-if="showBmiHistory && bmiHistory.length > 0">
            <h3 class="card-title">{{ t('history.bmiHistory') }}</h3>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>{{ t('healthMonitor.date') }}</th>
                    <th>{{ t('history.weight') }} (kg)</th>
                    <th>BMI</th>
                    <th>{{ t('history.result') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in bmiHistory" :key="row.id">
                    <td>{{ formatDate(row.createdAt) }}</td>
                    <td class="history-val">{{ row.weight }}</td>
                    <td class="history-val">{{ row.bmi_value != null ? Number(row.bmi_value).toFixed(1) : '-' }}</td>
                    <td>
                      <span :style="{ color: mapBMIStatus(row.result).color }">{{ translateBmiStatus(row.result, t) || '-' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="bmiTotalPages > 1" class="pagination">
              <button class="btn-page" :disabled="bmiPage <= 1" @click="loadBmiHistory(bmiPage - 1)">{{ t('library.previous') }}</button>
              <span class="page-info">{{ bmiPage }} / {{ bmiTotalPages }}</span>
              <button class="btn-page" :disabled="bmiPage >= bmiTotalPages" @click="loadBmiHistory(bmiPage + 1)">{{ t('library.next') }}</button>
            </div>
          </div>

          <div class="card" v-if="showSugarHistory && bloodSugarHistory.length > 0">
            <h3 class="card-title">{{ t('history.sugarHistory') }}</h3>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>{{ t('healthMonitor.date') }}</th>
                    <th>{{ t('healthMonitor.bloodSugarLabel') }} (mg/dL)</th>
                    <th>{{ t('history.conclusion') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in bloodSugarHistory" :key="row.id">
                    <td>{{ formatDate(row.createdAt) }}</td>
                    <td class="history-val">{{ row.result }}</td>
                    <td>
                      <span :style="{ color: mapSugarStatus(row.conclusion).color }">{{ translateSugarConclusion(row.conclusion, t) || '-' }}</span>
                      <div v-if="row.description" class="history-desc">{{ translateSugarDescription(row.description, t) }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="sugarTotalPages > 1" class="pagination">
              <button class="btn-page" :disabled="sugarPage <= 1" @click="loadSugarHistory(sugarPage - 1)">{{ t('library.previous') }}</button>
              <span class="page-info">{{ sugarPage }} / {{ sugarTotalPages }}</span>
              <button class="btn-page" :disabled="sugarPage >= sugarTotalPages" @click="loadSugarHistory(sugarPage + 1)">{{ t('library.next') }}</button>
            </div>
          </div>

          <div class="card" v-if="showVitalHistory && vitalHistory.length > 0">
            <h3 class="card-title">{{ t('healthMonitor.vitalHistory') }}</h3>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>{{ t('healthMonitor.date') }}</th>
                    <th>{{ t('healthMonitor.status') }}</th>
                    <th>{{ t('healthMonitor.bp') }}</th>
                    <th>{{ t('healthMonitor.hr') }}</th>
                    <th>{{ t('healthMonitor.temp') }}</th>
                    <th>{{ t('healthMonitor.spo2Header') }}</th>
                    <th>{{ t('healthMonitor.resp') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in vitalHistory" :key="row.id || idx" :class="{ 'row-current': row.status === 'current' }">
                    <td>{{ formatDate(row.date || row.createdAt) }}</td>
                    <td>
                      <span class="status-badge-sm" :style="row.status === 'current' ? { background: 'rgba(76,175,80,0.15)', color: '#81c784' } : { background: 'rgba(255,255,255,0.08)', color: '#999' }">
                        {{ row.status === 'current' ? t('healthMonitor.current') : t('healthMonitor.past') }}
                      </span>
                    </td>
                    <td>
                      <span v-if="row.systolic != null" class="prev-data" style="margin:0">
                        <span>{{ row.systolic }}/{{ row.diastolic ?? '-' }}</span>
                        <span v-if="row.evaluation?.bloodPressure" class="status-badge-sm" :style="{ background: mapStatus(row.evaluation.bloodPressure.label).bg, color: mapStatus(row.evaluation.bloodPressure.label).color }">
                          {{ row.evaluation.bloodPressure.label }}
                        </span>
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td class="history-val">
                      <span class="vital-label">HR: </span>{{ row.heart_rate ?? '-' }}
                      <span v-if="row.evaluation?.heartRate" class="status-badge-sm" :style="{ background: mapStatus(row.evaluation.heartRate.label).bg, color: mapStatus(row.evaluation.heartRate.label).color }">{{ row.evaluation.heartRate.label }}</span>
                    </td>
                    <td class="history-val">
                      <span class="vital-label">Temp: </span>{{ row.temperature != null ? Number(row.temperature).toFixed(1) : '-' }}
                      <span v-if="row.evaluation?.temperature" class="status-badge-sm" :style="{ background: mapStatus(row.evaluation.temperature.label).bg, color: mapStatus(row.evaluation.temperature.label).color }">{{ row.evaluation.temperature.label }}</span>
                    </td>
                    <td class="history-val">
                      <span class="vital-label">SpO2: </span>{{ row.spo2 ?? '-' }}
                      <span v-if="row.evaluation?.spo2" class="status-badge-sm" :style="{ background: mapStatus(row.evaluation.spo2.label).bg, color: mapStatus(row.evaluation.spo2.label).color }">{{ row.evaluation.spo2.label }}</span>
                    </td>
                    <td class="history-val">
                      <span class="vital-label">Resp: </span>{{ row.respiratory_rate ?? '-' }}
                      <span v-if="row.evaluation?.respiratoryRate" class="status-badge-sm" :style="{ background: mapStatus(row.evaluation.respiratoryRate.label).bg, color: mapStatus(row.evaluation.respiratoryRate.label).color }">{{ row.evaluation.respiratoryRate.label }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="vitalTotalPages > 1" class="pagination">
              <button class="btn-page" :disabled="vitalPage <= 1" @click="loadVitalHistory(vitalPage - 1)">{{ t('library.previous') }}</button>
              <span class="page-info">{{ vitalPage }} / {{ vitalTotalPages }}</span>
              <button class="btn-page" :disabled="vitalPage >= vitalTotalPages" @click="loadVitalHistory(vitalPage + 1)">{{ t('library.next') }}</button>
            </div>
          </div>

          <div v-if="bmiHistory.length === 0 && bloodSugarHistory.length === 0 && vitalHistory.length === 0 && metrics.length > 0">
            <div class="empty-metrics">{{ t('healthMonitor.noData') }}</div>
          </div>

          <div class="card" v-if="systemHealth">
            <h3 class="card-title">{{ t('healthMonitor.systemHealth') }}</h3>
            <div class="sys-grid">
              <div class="sys-item">
                <span class="sys-label">{{ t('healthMonitor.status') }}</span>
                <span :class="['sys-val', systemHealth.status === 'healthy' ? 'ok' : 'bad']">{{ systemHealth.status }}</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">{{ t('healthMonitor.database') }}</span>
                <span :class="['sys-val', systemHealth.checks?.database?.status === 'up' ? 'ok' : 'bad']">{{ systemHealth.checks?.database?.status }} ({{ systemHealth.checks?.database?.latencyMs }}ms)</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">{{ t('healthMonitor.memory') }}</span>
                <span class="sys-val">{{ systemHealth.checks?.memory?.heapUsed }}</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">{{ t('healthMonitor.uptime') }}</span>
                <span class="sys-val">{{ Math.floor((systemHealth.checks?.uptime?.serverSeconds || 0) / 60) }}m</span>
              </div>
            </div>
          </div>

          <div class="card" v-if="auth.user?.role === 'admin'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <h3 class="card-title" style="margin-bottom:0">{{ t('healthMonitor.apiTraffic') }}</h3>
              <div style="display:flex;gap:6px">
                <button v-for="per in trafficPeriods" :key="per.value" @click="trafficPeriod = per.value; loadTrafficStats()" :style="{ padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.72rem', fontWeight:700, background: trafficPeriod === per.value ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.08)', color: trafficPeriod === per.value ? '#81c784' : '#999' }">{{ t(per.labelKey) }}</button>
              </div>
            </div>
            <div v-if="trafficLoading" style="text-align:center;padding:20px;color:#666">{{ t('healthMonitor.loading') }}</div>
            <div v-else-if="!trafficStats" style="text-align:center;padding:20px;color:#666">{{ t('healthMonitor.noData') }}</div>
            <div v-else-if="trafficStats">
              <div class="traffic-kpi-grid">
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val">{{ trafficStats.totalRequests }}</span>
                  <span class="traffic-kpi-label">{{ t('healthMonitor.totalRequests') }}</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val">{{ trafficStats.avgResponseTime }}ms</span>
                  <span class="traffic-kpi-label">{{ t('healthMonitor.avgResponse') }}</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val" style="color:#66bb6a">{{ trafficStats.statusBreakdown?.[200] || 0 }}</span>
                  <span class="traffic-kpi-label">{{ t('healthMonitor.ok200') }}</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val" style="color:#ef5350">{{ (trafficStats.statusBreakdown?.[400] || 0) + (trafficStats.statusBreakdown?.[401] || 0) + (trafficStats.statusBreakdown?.[403] || 0) + (trafficStats.statusBreakdown?.[404] || 0) + (trafficStats.statusBreakdown?.[500] || 0) }}</span>
                  <span class="traffic-kpi-label">{{ t('healthMonitor.errors') }}</span>
                </div>
              </div>

              <div style="margin-top:14px">
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">{{ t('healthMonitor.requestsByMethod') }}</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <span v-for="(count, method) in trafficStats.methodBreakdown" :key="method" style="padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;background:rgba(255,255,255,0.06);color:#bbb">{{ method }}: {{ count }}</span>
                </div>
              </div>

              <div style="margin-top:14px">
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">{{ t('healthMonitor.hourlyTraffic') }}</h4>
                <div class="traffic-chart">
                  <div v-for="(h, idx) in trafficStats.hourlyTraffic" :key="idx" class="traffic-bar-wrap">
                    <div class="traffic-bar" :style="{ height: Math.max(4, (h.count / Math.max(...trafficStats.hourlyTraffic.map(x => x.count), 1)) * 80) + 'px' }">
                      <span class="traffic-bar-tip">{{ h.count }}</span>
                    </div>
                    <span class="traffic-bar-label">{{ new Date(h.hour).getHours() }}h</span>
                  </div>
                </div>
              </div>

              <div style="margin-top:14px">
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">{{ t('healthMonitor.recentRequests') }}</h4>
                <div class="traffic-table-wrap">
                  <table class="traffic-table">
                    <thead>
                      <tr><th>{{ t('healthMonitor.method') }}</th><th>{{ t('healthMonitor.path') }}</th><th>{{ t('healthMonitor.status') }}</th><th>{{ t('healthMonitor.time') }}</th><th>{{ t('healthMonitor.user') }}</th><th>{{ t('healthMonitor.date') }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in trafficStats.recentRequests" :key="r.id">
                        <td><span :class="['method-badge', r.method.toLowerCase()]">{{ r.method }}</span></td>
                        <td style="font-family:monospace;font-size:0.75rem">{{ r.path }}</td>
                        <td><span :class="['status-badge', r.statusCode < 400 ? 'ok' : 'err']">{{ r.statusCode }}</span></td>
                        <td>{{ r.responseTimeMs }}ms</td>
                        <td>{{ r.user }}</td>
                        <td>{{ formatDate(r.createdAt) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.health-page {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #0d1b2a, #1b2838, #172a3a);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary, #ccc);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.08); color: #fff; }

.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.logo {
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(90deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-badge {
  padding: 4px 10px;
  background: rgba(76,175,80,0.2);
  border: 1px solid rgba(76,175,80,0.4);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #81c784;
  margin-left: auto;
}

.toast {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}
.toast.success { background: #2e7d32; color: #c8e6c9; }
.toast.error { background: #c62828; color: #ffcdd2; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: calc(100vh - 54px);
}

.sidebar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-right: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.15);
  overflow-y: auto;
}

.card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 16px;
}

.card-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #81c784;
  margin-bottom: 12px;
}

.card-clickable {
  cursor: pointer;
  transition: transform 0.2s;
}
.card-clickable:hover {
  transform: translateY(-2px);
}

.select-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
}
.select-input option { background: #1b2838; color: #fff; }

.form-stack { display: flex; flex-direction: column; gap: 8px; }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.input-group { display: flex; flex-direction: column; gap: 3px; }
.input-group label { font-size: 0.72rem; color: #888; font-weight: 600; }
.input-group input {
  padding: 9px 10px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s;
}
.input-group input:focus { border-color: #4caf50; }
.input-disabled { opacity: 0.5; cursor: not-allowed; }

.prev-data { font-size:0.75rem; color:#999; margin-bottom:8px; display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.prev-vitals { gap:6px; font-size:0.7rem; }
.status-badge-sm { padding:1px 6px; border-radius:8px; font-size:0.65rem; font-weight:700; }
.status-dot-sm { display:inline-block; width:6px; height:6px; border-radius:50%; flex-shrink:0; }

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}
.btn-primary { background: linear-gradient(135deg, #2e7d32, #66bb6a); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(46,125,50,0.4); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.content { padding: 20px 24px; overflow-y: auto; }
.content .card { margin-bottom: 16px; }

.hero-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  color: #555;
}
.hero-icon {
  font-size: 2.5rem;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76,175,80,0.1);
  border-radius: 18px;
  color: #4caf50;
  margin-bottom: 14px;
}
.hero-empty h2 { color: #999; margin-bottom: 6px; }
.hero-empty p { font-size: 0.88rem; max-width: 360px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.section-header h2 { font-size: 1.2rem; }

.overall-badge {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.overall-badge.normal { background: rgba(76,175,80,0.2); color: #66bb6a; border: 1px solid rgba(76,175,80,0.3); }
.overall-badge.risk { background: rgba(244,67,54,0.2); color: #ef5350; border: 1px solid rgba(244,67,54,0.3); }
.overall-badge.unknown { background: rgba(158,158,158,0.2); color: #9e9e9e; border: 1px solid rgba(158,158,158,0.3); }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.metric-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-left: 4px solid;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.metric-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.metric-label { font-size: 0.78rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }
.metric-expand-hint { color: #555; opacity: 0; transition: opacity 0.2s, transform 0.2s; display: flex; align-items: center; }
.metric-card:hover .metric-expand-hint { opacity: 1; transform: translateX(2px); }

.metric-value { font-size: 1.6rem; font-weight: 800; line-height: 1; margin-bottom: 8px; }
.metric-value small { font-size: 0.55em; font-weight: 600; opacity: 0.7; margin-left: 2px; }

.metric-desc { font-size: 0.72rem; color: #999; margin-top: -4px; margin-bottom: 6px; }

.metric-bar { height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.metric-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

.empty-metrics {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 0.9rem;
}

.history-table-wrap { overflow-x: auto; }
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.history-table th {
  padding: 10px 12px;
  text-align: left;
  color: #888;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.history-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #bbb;
}

.history-val { font-weight: 700; }
.history-desc { font-size: 0.72rem; color: #888; font-weight: 400; margin-top: 2px; }
.vital-label { font-size: 0.65rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
.row-current { background: rgba(76,175,80,0.06); }

.patient-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  width: fit-content;
}
.patient-name { font-size: 0.88rem; font-weight: 700; color: #e0e0e0; }
.patient-meta {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(76,175,80,0.12);
  color: #81c784;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-dot.ok { background: #4caf50; box-shadow: 0 0 6px rgba(76,175,80,0.5); }
.status-dot.risk { background: #f44336; box-shadow: 0 0 6px rgba(244,67,54,0.5); }

.sys-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sys-item { display: flex; flex-direction: column; gap: 4px; }
.sys-label { font-size: 0.72rem; color: #888; font-weight: 600; text-transform: uppercase; }
.sys-val { font-size: 0.9rem; font-weight: 700; }
.sys-val.ok { color: #66bb6a; }
.sys-val.bad { color: #ef5350; }

.traffic-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.traffic-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
}
.traffic-kpi-val { font-size: 1.4rem; font-weight: 800; color: #e0e0e0; }
.traffic-kpi-label { font-size: 0.68rem; color: #888; text-transform: uppercase; font-weight: 600; }

.traffic-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
  padding: 8px 0;
}
.traffic-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.traffic-bar {
  width: 100%;
  max-width: 24px;
  background: linear-gradient(180deg, #66bb6a, #2e7d32);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s;
}
.traffic-bar-tip {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  color: #999;
  white-space: nowrap;
}
.traffic-bar-label { font-size: 0.58rem; color: #666; }

.traffic-table-wrap { overflow-x: auto; }
.traffic-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.traffic-table th {
  padding: 8px 10px;
  text-align: left;
  color: #888;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.traffic-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #bbb;
}

.method-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
}
.method-badge.get { background: rgba(33,150,243,0.2); color: #64b5f6; }
.method-badge.post { background: rgba(76,175,80,0.2); color: #81c784; }
.method-badge.put { background: rgba(255,193,7,0.2); color: #ffd54f; }
.method-badge.delete { background: rgba(244,67,54,0.2); color: #ef5350; }

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
}
.status-badge.ok { background: rgba(76,175,80,0.2); color: #66bb6a; }
.status-badge.err { background: rgba(244,67,54,0.2); color: #ef5350; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 12px; }
.page-info { font-size: 0.82rem; color: #999; }
.btn-page { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 700; background: rgba(76,175,80,0.2); color: #66bb6a; transition: all 0.2s; }
.btn-page:hover:not(:disabled) { background: rgba(76,175,80,0.35); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .health-page { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .layout { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .sys-grid { grid-template-columns: repeat(2, 1fr); }
  .traffic-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
