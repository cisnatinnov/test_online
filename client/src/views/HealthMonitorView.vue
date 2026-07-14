<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const auth = useAuthStore()
const router = useRouter()

const identities = ref([])
const selectedIdentity = ref(null)
const selectedIdentityData = ref(null)
const vitals = ref({ systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '', weight: '', blood_sugar: '' })
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
const trafficStats = ref(null)
const trafficPeriod = ref('24h')
const trafficLoading = ref(false)

const metrics = computed(() => {
  if (!latestVitals.value) return []
  const v = latestVitals.value.vitalSigns
  const ev = latestVitals.value.evaluation
  if (!v || !ev) return []

  const items = []
  if (ev.bloodPressure) {
    items.push({ label: 'Blood Pressure', value: `${v.systolic}/${v.diastolic}`, unit: 'mmHg', ...mapStatus(ev.bloodPressure.label) })
  }
  if (ev.heartRate) {
    items.push({ label: 'Heart Rate', value: v.heart_rate, unit: 'bpm', ...mapStatus(ev.heartRate.label) })
  }
  if (ev.temperature) {
    items.push({ label: 'Temperature', value: v.temperature, unit: 'C', ...mapStatus(ev.temperature.label) })
  }
  if (ev.spo2) {
    items.push({ label: 'SpO2', value: v.spo2, unit: '%', ...mapStatus(ev.spo2.label) })
  }
  if (ev.respiratoryRate) {
    items.push({ label: 'Respiratory Rate', value: v.respiratory_rate, unit: '/min', ...mapStatus(ev.respiratoryRate.label) })
  }
  if (latestBmi.value) {
    items.push({ label: 'BMI', value: latestBmi.value.bmi_value ?? latestBmi.value.bmi, unit: 'kg/m²', ...mapBMIStatus(latestBmi.value.status) })
  }
  if (latestBloodSugar.value) {
    const sugarVal = latestBloodSugar.value.result
    const sugarUnit = sugarVal != null ? 'mg/dL' : ''
    items.push({ label: 'Blood Sugar', value: sugarVal, unit: sugarUnit, ...mapSugarStatus(latestBloodSugar.value.conclusion) })
  }
  return items
})

const overallStatus = computed(() => {
  if (!latestVitals.value?.evaluation) return 'unknown'
  return latestVitals.value.evaluation.overall === 'Semua normal' ? 'normal' : 'risk'
})

function mapStatus(label) {
  const l = (label || '').toLowerCase()
  if (l.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: 'Normal' }
  if (l.includes('rendah') || l.includes('kritis') || l.includes('hipotermia') || l.includes('bradikardia') || l.includes('bradipnea')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: 'Low' }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: 'High/Risk' }
}

function mapBMIStatus(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: 'Normal' }
  if (s.includes('kurus') || s.includes('sangat kurus')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: 'Underweight' }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: 'Overweight' }
}

function mapSugarStatus(result) {
  const r = (result || '').toLowerCase()
  if (r.includes('normal')) return { status: 'normal', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', icon: 'Normal' }
  if (r.includes('rendah')) return { status: 'low', color: '#ff9800', bg: 'rgba(255,152,0,0.12)', icon: 'Low' }
  return { status: 'high', color: '#f44336', bg: 'rgba(244,67,54,0.12)', icon: 'High' }
}

function flash(m, t) { msg.value = m; msgType.value = t; setTimeout(() => msg.value = '', 4000) }

async function loadTrafficStats() {
  trafficLoading.value = true
  try {
    const { data: res } = await api.get(`/health-traffic/stats?period=${trafficPeriod.value}`)
    trafficStats.value = res.data
  } catch (e) { console.error(e) }
  trafficLoading.value = false
}

onMounted(async () => {
  await loadIdentities()
  await loadSystemHealth()
  if (auth.user?.role === 'admin') await loadTrafficStats()
})

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities')
    identities.value = res.data
    if (res.data.length > 0) {
      selectedIdentity.value = res.data[0].id
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
    const hist = await api.get(`/vital-signs/history/${selectedIdentity.value}`)
    vitalHistory.value = (hist.data.data || []).slice(0, 10)

    selectedIdentityData.value = identities.value.find(i => i.id === selectedIdentity.value) || null

    try {
      const { data: bmiRes } = await api.get(`/bmi/history/${selectedIdentity.value}`)
      const bmiList = bmiRes.data || []
      const current = bmiList.find(b => b.status === 'current') || bmiList[0] || null
      if (current) {
        latestBmi.value = {
          weight: current.weight,
          bmi_value: current.bmi_value,
          bmi: current.result,
          status: current.result,
        }
      } else {
        latestBmi.value = null
      }
      bmiHistory.value = bmiList.slice(0, 10)
    } catch { latestBmi.value = null; bmiHistory.value = [] }

    try {
      const { data: sugarRes } = await api.get(`/bloodsugar/history/${selectedIdentity.value}`)
      const sugarList = sugarRes.data || []
      const currentSugar = sugarList.find(b => b.status === 'current') || sugarList[0] || null
      if (currentSugar) {
        latestBloodSugar.value = {
          result: currentSugar.result,
          conclusion: currentSugar.conclusion || 'Normal',
          description: currentSugar.description || '',
          age: currentSugar.age,
        }
      } else {
        latestBloodSugar.value = null
      }
      bloodSugarHistory.value = sugarList.slice(0, 10)
    } catch { latestBloodSugar.value = null; bloodSugarHistory.value = [] }
  } catch (e) { console.error(e) }
}

async function submitVitals() {
  if (!selectedIdentity.value) { flash('Select a patient first', 'error'); return }
  loading.value = true
  try {
    await api.post('/vital-signs', { identity_id: selectedIdentity.value, ...vitals.value })
    const savedWeight = vitals.value.weight ? Number(vitals.value.weight) : null
    const savedSugar = vitals.value.blood_sugar ? Number(vitals.value.blood_sugar) : null
    if (savedWeight) {
      await api.post('/bmi', { identity_id: selectedIdentity.value, weight: savedWeight })
    }
    if (savedSugar) {
      await api.post('/bloodsugar', { identity_id: selectedIdentity.value, sugar: savedSugar })
    }
    lastSaved.value = { weight: savedWeight, sugar: savedSugar, time: new Date() }
    vitals.value = { systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '', weight: '', blood_sugar: '' }
    flash('Vital signs saved successfully', 'success')
    await loadPatientHealth()
  } catch (e) { flash(e.response?.data?.error || 'Failed to save vital signs', 'error') }
  loading.value = false
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function evalRow(vs) {
  if (!vs) return []
  const items = []
  if (vs.systolic != null && vs.diastolic != null) items.push({ label: 'BP', val: `${vs.systolic}/${vs.diastolic}`, ...mapStatus(evalBPLabel(vs.systolic, vs.diastolic)) })
  if (vs.heart_rate != null) items.push({ label: 'HR', val: vs.heart_rate, ...mapStatus(evalHRLabel(vs.heart_rate)) })
  if (vs.temperature != null) items.push({ label: 'Temp', val: vs.temperature, ...mapStatus(evalTempLabel(vs.temperature)) })
  if (vs.spo2 != null) items.push({ label: 'SpO2', val: vs.spo2, ...mapStatus(evalSpO2Label(vs.spo2)) })
  if (vs.respiratory_rate != null) items.push({ label: 'Resp', val: vs.respiratory_rate, ...mapStatus(evalRespLabel(vs.respiratory_rate)) })
  return items
}

function evalBPLabel(sys, dia) {
  if (sys < 90 || dia < 60) return 'Rendah'
  if (sys <= 120 && dia <= 80) return 'Normal'
  return 'Tinggi Stage 1'
}
function evalHRLabel(hr) {
  if (hr < 60) return 'Rendah'
  if (hr <= 100) return 'Normal'
  return 'Tinggi'
}
function evalTempLabel(t) {
  if (t < 35) return 'Rendah'
  if (t <= 37.2) return 'Normal'
  return 'Demam'
}
function evalSpO2Label(s) {
  if (s < 90) return 'Kritis'
  if (s < 95) return 'Rendah'
  return 'Normal'
}
function evalRespLabel(r) {
  if (r < 12) return 'Rendah'
  if (r <= 20) return 'Normal'
  return 'Tinggi'
}
</script>

<template>
  <div class="health-page">
    <nav class="top-nav">
      <h1 class="logo" @click="router.push('/')" style="cursor:pointer">Health Monitor</h1>
      <div class="nav-links">
        <button @click="router.push('/')" class="nav-btn">Dashboard</button>
        <button @click="router.push('/money')" class="nav-btn">Money</button>
        <button @click="router.push('/chat')" class="nav-btn">Chat</button>
        <span class="user-badge">{{ auth.user?.username }}</span>
      </div>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="layout">
      <aside class="sidebar">
        <div class="card">
          <h3 class="card-title">Select Patient</h3>
          <select v-model="selectedIdentity" @change="loadPatientHealth" class="select-input">
            <option :value="null" disabled>Choose patient...</option>
            <option v-for="i in identities" :key="i.id" :value="i.id">{{ i.name }} ({{ i.nik || '-' }})</option>
          </select>
        </div>

        <div class="card">
          <h3 class="card-title">Record Vitals</h3>
          <div class="form-stack">
            <div class="input-row">
              <div class="input-group">
                <label>Systolic (mmHg)</label>
                <input v-model="vitals.systolic" type="number" placeholder="e.g. 120" />
              </div>
              <div class="input-group">
                <label>Diastolic (mmHg)</label>
                <input v-model="vitals.diastolic" type="number" placeholder="e.g. 80" />
              </div>
            </div>
            <div class="input-group">
              <label>Heart Rate (bpm)</label>
              <input v-model="vitals.heart_rate" type="number" placeholder="e.g. 72" />
            </div>
            <div class="input-group">
              <label>Temperature (C)</label>
              <input v-model="vitals.temperature" type="number" step="0.1" placeholder="e.g. 36.5" />
            </div>
            <div class="input-group">
              <label>SpO2 (%)</label>
              <input v-model="vitals.spo2" type="number" placeholder="e.g. 98" />
            </div>
            <div class="input-group">
              <label>Respiratory Rate (/min)</label>
              <input v-model="vitals.respiratory_rate" type="number" placeholder="e.g. 16" />
            </div>
            <div class="input-row">
              <div class="input-group">
                <label>Weight (kg)</label>
                <input v-model="vitals.weight" type="number" step="0.1" placeholder="e.g. 65" />
              </div>
              <div class="input-group">
                <label>Height (cm)</label>
                <input :value="selectedIdentityData?.height || '-'" type="text" disabled class="input-disabled" />
              </div>
            </div>
            <div class="input-group">
              <label>Blood Sugar (mg/dL)</label>
              <input v-model="vitals.blood_sugar" type="number" placeholder="e.g. 85" />
            </div>
            <button class="btn btn-primary" @click="submitVitals" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save Vitals' }}
            </button>
            <div v-if="lastSaved" style="margin-top:8px;padding:8px 12px;background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.3);border-radius:8px;font-size:0.78rem;color:#81c784">
              <template v-if="lastSaved.weight">Weight saved: <strong>{{ lastSaved.weight }} kg</strong></template>
              <template v-if="lastSaved.weight && lastSaved.sugar"> &middot; </template>
              <template v-if="lastSaved.sugar">Sugar saved: <strong>{{ lastSaved.sugar }} mg/dL</strong></template>
            </div>
          </div>
        </div>
      </aside>

      <main class="content">
        <template v-if="!selectedIdentity">
          <div class="hero-empty">
            <div class="hero-icon">+</div>
            <h2>Select a Patient</h2>
            <p>Choose a patient from the sidebar to view and record health data.</p>
          </div>
        </template>

        <template v-else>
          <div class="section-header">
            <h2>Health Dashboard</h2>
            <span :class="['overall-badge', overallStatus]">
              {{ overallStatus === 'normal' ? 'All Normal' : overallStatus === 'risk' ? 'Abnormal Detected' : 'No Data' }}
            </span>
          </div>

          <div class="metrics-grid">
            <div v-for="m in metrics" :key="m.label" class="metric-card" :style="{ borderColor: m.color }">
              <div class="metric-header">
                <span class="metric-label">{{ m.label }}</span>
                <span class="metric-badge" :style="{ background: m.bg, color: m.color }">{{ m.icon }}</span>
              </div>
              <div class="metric-value" :style="{ color: m.color }">{{ m.value }}<small>{{ m.unit }}</small></div>
              <div class="metric-bar">
                <div class="metric-bar-fill" :style="{ width: '100%', background: m.color, opacity: 0.3 }"></div>
              </div>
            </div>
          </div>

          <div v-if="metrics.length === 0" class="empty-metrics">
            No vital signs recorded yet. Use the form to record your first reading.
          </div>

          <div class="card" v-if="vitalHistory.length > 0">
            <h3 class="card-title">Recent History</h3>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Temp</th>
                    <th>SpO2</th>
                    <th>Resp</th>
                    <th>BMI</th>
                    <th>Sugar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vs, idx) in vitalHistory" :key="idx">
                    <td>{{ formatDate(vs.date) }}</td>
                    <template v-for="item in evalRow(vs)" :key="item.label">
                      <td>
                        <span class="history-val" :style="{ color: item.color }">{{ item.val }}</span>
                      </td>
                    </template>
                    <template v-if="evalRow(vs).length < 5">
                      <td v-for="n in (5 - evalRow(vs).length)" :key="'e'+n"></td>
                    </template>
                    <td>
                      <span v-if="bmiHistory[idx]" class="history-val" :style="{ color: mapBMIStatus(bmiHistory[idx].result).color }">
                        <template v-if="bmiHistory[idx].bmi_value != null">{{ bmiHistory[idx].bmi_value }}</template>
                        <template v-else>-</template>
                        <small style="font-weight:400;opacity:0.7"> ({{ bmiHistory[idx].result }})</small>
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span v-if="bloodSugarHistory[idx]" class="history-val" :style="{ color: mapSugarStatus(bloodSugarHistory[idx].conclusion).color }">
                        <template v-if="bloodSugarHistory[idx].result != null">{{ bloodSugarHistory[idx].result }}</template>
                        <template v-else>-</template>
                        <small style="font-weight:400;opacity:0.7"> ({{ bloodSugarHistory[idx].conclusion }})</small>
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span :class="['status-dot', evalRow(vs).some(i => i.status !== 'normal') ? 'risk' : 'ok']"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card" v-if="systemHealth">
            <h3 class="card-title">System Health</h3>
            <div class="sys-grid">
              <div class="sys-item">
                <span class="sys-label">Status</span>
                <span :class="['sys-val', systemHealth.status === 'healthy' ? 'ok' : 'bad']">{{ systemHealth.status }}</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">Database</span>
                <span :class="['sys-val', systemHealth.checks?.database?.status === 'up' ? 'ok' : 'bad']">{{ systemHealth.checks?.database?.status }} ({{ systemHealth.checks?.database?.latencyMs }}ms)</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">Memory</span>
                <span class="sys-val">{{ systemHealth.checks?.memory?.heapUsed }}</span>
              </div>
              <div class="sys-item">
                <span class="sys-label">Uptime</span>
                <span class="sys-val">{{ Math.floor((systemHealth.checks?.uptime?.serverSeconds || 0) / 60) }}m</span>
              </div>
            </div>
          </div>

          <div class="card" v-if="auth.user?.role === 'admin'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <h3 class="card-title" style="margin-bottom:0">API Traffic</h3>
              <div style="display:flex;gap:6px">
                <button v-for="p in ['1h','24h','7d','30d']" :key="p" @click="trafficPeriod = p; loadTrafficStats()" :style="{ padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.72rem', fontWeight:700, background: trafficPeriod === p ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.08)', color: trafficPeriod === p ? '#81c784' : '#999' }">{{ p }}</button>
              </div>
            </div>
            <div v-if="trafficLoading" style="text-align:center;padding:20px;color:#666">Loading...</div>
            <div v-else-if="trafficStats">
              <div class="traffic-kpi-grid">
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val">{{ trafficStats.totalRequests }}</span>
                  <span class="traffic-kpi-label">Total Requests</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val">{{ trafficStats.avgResponseTime }}ms</span>
                  <span class="traffic-kpi-label">Avg Response</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val" style="color:#66bb6a">{{ trafficStats.statusBreakdown?.[200] || 0 }}</span>
                  <span class="traffic-kpi-label">200 OK</span>
                </div>
                <div class="traffic-kpi">
                  <span class="traffic-kpi-val" style="color:#ef5350">{{ (trafficStats.statusBreakdown?.[400] || 0) + (trafficStats.statusBreakdown?.[401] || 0) + (trafficStats.statusBreakdown?.[403] || 0) + (trafficStats.statusBreakdown?.[404] || 0) + (trafficStats.statusBreakdown?.[500] || 0) }}</span>
                  <span class="traffic-kpi-label">Errors</span>
                </div>
              </div>

              <div style="margin-top:14px">
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Requests by Method</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <span v-for="(count, method) in trafficStats.methodBreakdown" :key="method" style="padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;background:rgba(255,255,255,0.06);color:#bbb">{{ method }}: {{ count }}</span>
                </div>
              </div>

              <div style="margin-top:14px">
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Hourly Traffic</h4>
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
                <h4 style="font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Recent Requests</h4>
                <div class="traffic-table-wrap">
                  <table class="traffic-table">
                    <thead>
                      <tr><th>Method</th><th>Path</th><th>Status</th><th>Time</th><th>User</th><th>Date</th></tr>
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
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.health-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1b2a, #1b2838, #172a3a);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.nav-links { display: flex; align-items: center; gap: 10px; }

.nav-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(255,255,255,0.1);
  color: #ccc;
  transition: all 0.2s;
}
.nav-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }

.user-badge {
  padding: 4px 10px;
  background: rgba(76,175,80,0.2);
  border: 1px solid rgba(76,175,80,0.4);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #81c784;
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
  transition: transform 0.2s;
}
.metric-card:hover { transform: translateY(-2px); }

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.metric-label { font-size: 0.78rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }

.metric-value { font-size: 1.6rem; font-weight: 800; line-height: 1; margin-bottom: 8px; }
.metric-value small { font-size: 0.55em; font-weight: 600; opacity: 0.7; margin-left: 2px; }

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

@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .sys-grid { grid-template-columns: repeat(2, 1fr); }
  .traffic-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
