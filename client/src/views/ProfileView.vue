<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const identities = ref([])
const selectedIdentity = ref(null)
const identityData = ref(null)
const bmiHistory = ref([])
const bloodSugarHistory = ref([])
const vitalHistory = ref([])
const latestBmi = ref(null)
const latestBloodSugar = ref(null)
const latestVitals = ref(null)
const loading = ref(true)
const msg = ref('')
const msgType = ref('')

onMounted(async () => {
  await loadIdentities()
  loading.value = false
})

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities')
    identities.value = res.data
    if (res.data.length > 0) {
      selectedIdentity.value = res.data[0].id
      await loadIdentityHealth(res.data[0].id)
    }
  } catch (e) { console.error(e) }
}

async function selectIdentity(id) {
  selectedIdentity.value = id
  identityData.value = identities.value.find(i => i.id === id) || null
  await loadIdentityHealth(id)
}

async function loadIdentityHealth(id) {
  identityData.value = identities.value.find(i => i.id === id) || null
  try {
    const [bmiRes, sugarRes, vitalsRes] = await Promise.all([
      api.get(`/bmi/history/${id}`).catch(() => ({ data: { data: [] } })),
      api.get(`/bloodsugar/history/${id}`).catch(() => ({ data: { data: [] } })),
      api.get(`/vital-signs/history/${id}`).catch(() => ({ data: { data: [] } }))
    ])

    const bmiList = (bmiRes.data.data || bmiRes.data || [])
    const sugarList = (sugarRes.data.data || sugarRes.data || [])
    const vitalsList = (vitalsRes.data.data || vitalsRes.data || [])

    bmiHistory.value = bmiList.slice(0, 10)
    bloodSugarHistory.value = sugarList.slice(0, 10)
    vitalHistory.value = vitalsList.slice(0, 10)

    const currentBmi = bmiList.find(b => b.status === 'current') || bmiList[0] || null
    latestBmi.value = currentBmi ? {
      weight: currentBmi.weight,
      bmi_value: currentBmi.bmi_value,
      result: currentBmi.result
    } : null

    const currentSugar = sugarList.find(b => b.status === 'current') || sugarList[0] || null
    latestBloodSugar.value = currentSugar ? {
      result: currentSugar.result,
      conclusion: currentSugar.conclusion || 'Normal'
    } : null

    const currentVitals = vitalsList.find(v => v.status === 'current') || vitalsList[0] || null
    latestVitals.value = currentVitals || null
  } catch (e) { console.error(e) }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapStatus(label) {
  const l = (label || '').toLowerCase()
  if (l.includes('normal')) return { color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  if (l.includes('rendah') || l.includes('kritis') || l.includes('bradikardia') || l.includes('bradipnea') || l.includes('hipotermia')) return { color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  return { color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}

function mapBMIStatus(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('normal')) return { color: '#4caf50' }
  if (s.includes('kurus') || s.includes('sangat kurus')) return { color: '#ff9800' }
  return { color: '#f44336' }
}

function mapSugarStatus(result) {
  const r = (result || '').toLowerCase()
  if (r.includes('normal')) return { color: '#4caf50' }
  if (r.includes('rendah')) return { color: '#ff9800' }
  return { color: '#f44336' }
}

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 3000) }

function evalHRBadge(hr) {
  if (hr < 60) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (hr <= 100) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
function evalTempBadge(t) {
  if (t < 35) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (t <= 37.2) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
function evalSpO2Badge(s) {
  if (s < 90) return { label: t('healthMonitor.highRisk'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
  if (s < 95) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
}
function evalRespBadge(r) {
  if (r < 12) return { label: t('healthMonitor.low'), color: '#ff9800', bg: 'rgba(255,152,0,0.12)' }
  if (r <= 20) return { label: t('healthMonitor.normal'), color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
  return { label: t('healthMonitor.high'), color: '#f44336', bg: 'rgba(244,67,54,0.12)' }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('nav.profile') }}</h2>
      <div class="nav-bar">
        <LanguageSwitcher />
        <button @click="router.push('/')" class="btn btn-blue btn-sm">{{ t('nav.dashboard') }}</button>
      </div>
    </div>

    <div v-if="msg" :class="['flash', msgType === 'success' ? 'flash-success' : 'flash-error']">{{ msg }}</div>

    <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-muted)">{{ t('healthMonitor.loading') }}</div>

    <template v-else>
      <template v-if="identityData">
        <div class="card" style="margin-bottom:20px">
          <h3 style="margin-bottom:16px;color:#fff">{{ t('nav.profile') }}</h3>
          <div class="identity-grid">
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.fullName') }}</span>
              <span class="identity-value">{{ identityData.name }}</span>
            </div>
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.nik') }}</span>
              <span class="identity-value">{{ identityData.nik || '-' }}</span>
            </div>
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.height') }}</span>
              <span class="identity-value">{{ identityData.height ? identityData.height + ' ' + t('healthMonitor.celsius').replace('C', 'cm') : '-' }}</span>
            </div>
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.birthplace') }}</span>
              <span class="identity-value">{{ identityData.birthplace || '-' }}</span>
            </div>
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.birthdate') }}</span>
              <span class="identity-value">{{ identityData.birthdate || '-' }}</span>
            </div>
            <div class="identity-field">
              <span class="identity-label">{{ t('auth.address') }}</span>
              <span class="identity-value">{{ identityData.address || '-' }}</span>
            </div>
          </div>
        </div>

        <h3 style="margin-bottom:16px;color:#fff">{{ t('healthMonitor.healthDashboard') }}</h3>
        <div class="metrics-grid" style="margin-bottom:20px">
          <div v-if="latestBmi" class="metric-card" :style="{ borderLeftColor: mapBMIStatus(latestBmi.result).color }">
            <div class="metric-header">
              <span class="metric-label">{{ t('dashboard.bmi') }}</span>
              <span class="metric-badge" :style="{ background: mapBMIStatus(latestBmi.result).color + '22', color: mapBMIStatus(latestBmi.result).color }">{{ latestBmi.result }}</span>
            </div>
            <div class="metric-value" :style="{ color: mapBMIStatus(latestBmi.result).color }">{{ latestBmi.bmi_value ?? '-' }}<small>{{ t('healthMonitor.kgM2') }}</small></div>
          </div>

          <div v-if="latestBloodSugar" class="metric-card" :style="{ borderLeftColor: mapSugarStatus(latestBloodSugar.conclusion).color }">
            <div class="metric-header">
              <span class="metric-label">{{ t('dashboard.bloodSugar') }}</span>
              <span class="metric-badge" :style="{ background: mapSugarStatus(latestBloodSugar.conclusion).color + '22', color: mapSugarStatus(latestBloodSugar.conclusion).color }">{{ latestBloodSugar.conclusion }}</span>
            </div>
            <div class="metric-value" :style="{ color: mapSugarStatus(latestBloodSugar.conclusion).color }">{{ latestBloodSugar.result ?? '-' }}<small>{{ t('healthMonitor.mgDl') }}</small></div>
          </div>

          <div v-if="latestVitals" class="metric-card" :style="{ borderLeftColor: mapStatus('normal').color }">
            <div class="metric-header">
              <span class="metric-label">{{ t('healthMonitor.bloodPressure') }}</span>
              <span class="metric-badge" :style="{ background: mapStatus('normal').color + '22', color: mapStatus('normal').color }">{{ t('healthMonitor.normal') }}</span>
            </div>
            <div class="metric-value" :style="{ color: mapStatus('normal').color }">{{ latestVitals.systolic }}/{{ latestVitals.diastolic }}<small>{{ t('healthMonitor.mmHg') }}</small></div>
          </div>
        </div>

        <div class="card" v-if="bmiHistory.length > 0" style="margin-bottom:20px">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('history.bmiHistory') }}</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('history.date') }}</th>
                  <th>{{ t('dashboard.weightKg') }}</th>
                  <th>{{ t('dashboard.bmi') }}</th>
                  <th>{{ t('history.result') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(b, idx) in bmiHistory" :key="idx">
                  <td>{{ formatDate(b.createdAt) }}</td>
                  <td>{{ b.weight }} {{ t('healthMonitor.kgM2').split('/')[0] }}</td>
                  <td>{{ b.bmi_value ?? '-' }}</td>
                  <td><span :style="{ color: mapBMIStatus(b.result).color, fontWeight: 700 }">{{ b.result }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" v-if="bloodSugarHistory.length > 0" style="margin-bottom:20px">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('history.sugarHistory') }}</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('history.date') }}</th>
                  <th>{{ t('dashboard.sugarMgDl') }}</th>
                  <th>{{ t('history.conclusion') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, idx) in bloodSugarHistory" :key="idx">
                  <td>{{ formatDate(s.createdAt) }}</td>
                  <td>{{ s.result }} {{ t('healthMonitor.mgDl') }}</td>
                  <td><span :style="{ color: mapSugarStatus(s.conclusion).color, fontWeight: 700 }">{{ s.conclusion }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" v-if="vitalHistory.length > 0">
          <h3 style="margin-bottom:12px;color:#fff">{{ t('dashboard.vitalSigns') }}</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('history.date') }}</th>
                  <th>{{ t('healthMonitor.bloodPressure') }}</th>
                  <th>{{ t('healthMonitor.bpm') }}</th>
                  <th>{{ t('healthMonitor.celsius') }}</th>
                  <th>{{ t('healthMonitor.spo2Label') }}</th>
                  <th>{{ t('healthMonitor.perMin') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, idx) in vitalHistory" :key="idx">
                  <td>{{ formatDate(v.createdAt) }}</td>
                  <td>{{ v.systolic }}/{{ v.diastolic }}</td>
                  <td>
                    <span class="vital-label-sm">HR: </span>{{ v.heart_rate }}
                    <span v-if="v.heart_rate != null" class="status-badge-sm" :style="{ background: evalHRBadge(v.heart_rate).bg, color: evalHRBadge(v.heart_rate).color }">{{ evalHRBadge(v.heart_rate).label }}</span>
                  </td>
                  <td>
                    <span class="vital-label-sm">Temp: </span>{{ v.temperature }}
                    <span v-if="v.temperature != null" class="status-badge-sm" :style="{ background: evalTempBadge(v.temperature).bg, color: evalTempBadge(v.temperature).color }">{{ evalTempBadge(v.temperature).label }}</span>
                  </td>
                  <td>
                    <span class="vital-label-sm">SpO2: </span>{{ v.spo2 }}
                    <span v-if="v.spo2 != null" class="status-badge-sm" :style="{ background: evalSpO2Badge(v.spo2).bg, color: evalSpO2Badge(v.spo2).color }">{{ evalSpO2Badge(v.spo2).label }}</span>
                  </td>
                  <td>
                    <span class="vital-label-sm">Resp: </span>{{ v.respiratory_rate }}
                    <span v-if="v.respiratory_rate != null" class="status-badge-sm" :style="{ background: evalRespBadge(v.respiratory_rate).bg, color: evalRespBadge(v.respiratory_rate).color }">{{ evalRespBadge(v.respiratory_rate).label }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.identity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.identity-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.identity-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.identity-value {
  font-size: 0.92rem;
  color: var(--text-primary);
  font-weight: 500;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.metric-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-left: 4px solid;
  border-radius: 12px;
  padding: 16px;
}
.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.metric-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.metric-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
}
.metric-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}
.metric-value small {
  font-size: 0.55em;
  font-weight: 600;
  opacity: 0.7;
  margin-left: 2px;
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  padding: 10px 12px;
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: var(--text-secondary);
}
.vital-label-sm { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
.status-badge-sm { padding:1px 6px; border-radius:8px; font-size:0.65rem; font-weight:700; margin-left:4px; }
@media (max-width: 768px) {
  .identity-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
