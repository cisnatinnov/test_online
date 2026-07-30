<script setup>
import { ref, computed, watch, nextTick } from 'vue'
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

const estates = ref([])
const selectedEstateId = ref(null)
const newEstate = ref({ width: '', length: '' })
const newTree = ref({ x: '', y: '', height: '' })
const stats = ref(null)
const dronePlan = ref(null)
const maxDistance = ref('')
const msg = ref('')
const msgType = ref('')
const loading = ref(false)
const canvasRef = ref(null)

const selectedEstate = computed(() => estates.value.find(e => e.id === selectedEstateId.value))

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 4000) }

async function loadEstates() {
  try {
    const { data: res } = await api.get('/estate?all=1')
    estates.value = res.data || []
  } catch { estates.value = [] }
}

async function createEstate() {
  try {
    if (!newEstate.value.width || !newEstate.value.length) { flash(t('flash.allFieldsRequired'), 'error'); return }
    const { data: res } = await api.post('/estate', { width: Number(newEstate.value.width), length: Number(newEstate.value.length) })
    newEstate.value = { width: '', length: '' }
    await loadEstates()
    selectedEstateId.value = res.data.id
    flash(t('flash.estateCreated'), 'success')
  } catch (e) { flash(e.response?.data?.error || t('flash.estateCreateFailed'), 'error') }
}

async function selectEstate(id) {
  selectedEstateId.value = id
  stats.value = null
  dronePlan.value = null
  await loadStats()
}

async function loadStats() {
  if (!selectedEstateId.value) return
  try {
    const { data: res } = await api.get(`/estate/${selectedEstateId.value}/stats`)
    stats.value = res.data
    await nextTick()
    drawEstate()
  } catch (e) { flash(e.response?.data?.error || t('flash.statsLoadFailed'), 'error') }
}

async function addTree() {
  if (!selectedEstateId.value) { flash(t('flash.selectEstateFirst'), 'error'); return }
  try {
    const { x, y, height } = newTree.value
    if (!x || !y || !height) { flash(t('flash.allFieldsRequired'), 'error'); return }
    await api.post(`/estate/${selectedEstateId.value}/tree`, { x: Number(x), y: Number(y), height: Number(height) })
    newTree.value = { x: '', y: '', height: '' }
    flash(t('flash.treePlanted'), 'success')
    await loadStats()
  } catch (e) { flash(e.response?.data?.error || t('flash.treePlantFailed'), 'error') }
}

async function loadDronePlan() {
  if (!selectedEstateId.value) return
  try {
    let url = `/estate/${selectedEstateId.value}/drone-plan`
    if (maxDistance.value) url += `?max_distance=${maxDistance.value}`
    const { data: res } = await api.get(url)
    dronePlan.value = res.data
  } catch (e) { flash(e.response?.data?.error || t('flash.droneLoadFailed'), 'error') }
}

function drawEstate() {
  const canvas = canvasRef.value
  if (!canvas || !selectedEstate.value) return
  const ctx = canvas.getContext('2d')
  const est = selectedEstate.value
  const w = est.width
  const h = est.length

  const maxCanvasW = 500
  const maxCanvasH = 400
  const scale = Math.min(maxCanvasW / (w + 1), maxCanvasH / (h + 1), 30)
  const pad = 40

  canvas.width = w * scale + pad * 2
  canvas.height = h * scale + pad * 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  grad.addColorStop(0, '#1a472a')
  grad.addColorStop(1, '#2d5016')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= w; i++) {
    ctx.beginPath()
    ctx.moveTo(pad + i * scale, pad)
    ctx.lineTo(pad + i * scale, pad + h * scale)
    ctx.stroke()
  }
  for (let j = 0; j <= h; j++) {
    ctx.beginPath()
    ctx.moveTo(pad, pad + j * scale)
    ctx.lineTo(pad + w * scale, pad + j * scale)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.strokeRect(pad, pad, w * scale, h * scale)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  for (let i = 0; i <= w; i++) {
    ctx.fillText(i, pad + i * scale, pad + h * scale + 16)
  }
  ctx.textAlign = 'right'
  for (let j = 0; j <= h; j++) {
    ctx.fillText(j, pad - 8, pad + j * scale + 4)
  }

  loadTreesOnCanvas(ctx, scale, pad)
}

async function loadTreesOnCanvas(ctx, scale, pad) {
  try {
    const { data: res } = await api.get(`/estate/${selectedEstateId.value}/trees`)
    const trees = res.data?.trees || []
    for (const tree of trees) {
      const cx = pad + tree.x * scale
      const cy = pad + (selectedEstate.value.length - tree.y) * scale

      const greenIntensity = Math.floor(80 + (tree.height / 30) * 175)
      const radius = 4 + (tree.height / 30) * 6

      ctx.beginPath()
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,${greenIntensity},0,0.3)`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      const treeGrad = ctx.createRadialGradient(cx, cy - 2, 0, cx, cy, radius)
      treeGrad.addColorStop(0, `rgb(100,${greenIntensity + 40},60)`)
      treeGrad.addColorStop(1, `rgb(30,${greenIntensity - 30},20)`)
      ctx.fillStyle = treeGrad
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tree.height, cx, cy)
    }
  } catch {}
}

watch(selectedEstateId, () => { if (selectedEstateId.value) drawEstate() })

loadEstates()
</script>

<template>
  <div class="estate-page" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />
    <nav class="top-nav">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h1 class="logo">{{ t('estate.title') }}</h1>
      <span class="user-badge">{{ auth.user?.username }}</span>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="main-grid">
      <aside class="sidebar">
        <div class="card sidebar-card">
          <h3 class="card-title">{{ t('estate.createEstate') }}</h3>
          <div class="form-stack">
            <div class="input-group">
              <label>{{ t('estate.widthM') }}</label>
              <input v-model="newEstate.width" type="number" min="1" placeholder="e.g. 40" />
            </div>
            <div class="input-group">
              <label>{{ t('estate.lengthM') }}</label>
              <input v-model="newEstate.length" type="number" min="1" placeholder="e.g. 60" />
            </div>
            <button class="btn btn-primary" @click="createEstate">{{ t('estate.createEstate') }}</button>
          </div>
        </div>

        <div class="card sidebar-card">
          <h3 class="card-title">{{ t('estate.estates') }}</h3>
          <div v-if="estates.length === 0" class="empty-state">{{ t('estate.noEstates') }}</div>
          <div v-for="e in estates" :key="e.id" :class="['estate-item', { active: selectedEstateId === e.id }]" @click="selectEstate(e.id)">
            <span class="estate-icon">E#{{ e.id }}</span>
            <span class="estate-info">{{ e.width }}x{{ e.length }}m</span>
          </div>
        </div>

        <div v-if="selectedEstate" class="card sidebar-card">
          <h3 class="card-title">{{ t('estate.addTree') }}</h3>
          <div class="form-stack">
            <div class="form-row">
              <div class="input-group">
                <label>X</label>
                <input v-model="newTree.x" type="number" min="0" :max="selectedEstate.width" placeholder="0" />
              </div>
              <div class="input-group">
                <label>Y</label>
                <input v-model="newTree.y" type="number" min="0" :max="selectedEstate.length" placeholder="0" />
              </div>
            </div>
            <div class="input-group">
              <label>{{ t('estate.heightRange') }}</label>
              <input v-model="newTree.height" type="number" min="1" max="30" placeholder="15" />
            </div>
            <button class="btn btn-green" @click="addTree">{{ t('estate.plantTree') }}</button>
          </div>
        </div>
      </aside>

      <main class="content">
        <div v-if="!selectedEstate" class="hero-empty">
          <div class="hero-icon">Palm</div>
          <h2>{{ t('estate.selectOrCreate') }}</h2>
          <p>{{ t('estate.selectOrCreateDesc') }}</p>
        </div>

        <template v-else>
          <div class="section-header">
            <h2>{{ t('estate.estatePrefix') }}{{ selectedEstate.id }} <span class="badge">{{ selectedEstate.width }}x{{ selectedEstate.length }}m</span></h2>
          </div>

          <div class="estate-visual">
            <canvas ref="canvasRef" class="estate-canvas"></canvas>
          </div>

          <div class="stats-grid" v-if="stats">
            <div class="stat-card stat-count">
              <div class="stat-value">{{ stats.count }}</div>
              <div class="stat-label">{{ t('estate.trees') }}</div>
            </div>
            <div class="stat-card stat-max">
              <div class="stat-value">{{ stats.max }}<small>m</small></div>
              <div class="stat-label">{{ t('estate.maxHeight') }}</div>
            </div>
            <div class="stat-card stat-min">
              <div class="stat-value">{{ stats.min }}<small>m</small></div>
              <div class="stat-label">{{ t('estate.minHeight') }}</div>
            </div>
            <div class="stat-card stat-median">
              <div class="stat-value">{{ stats.median }}<small>m</small></div>
              <div class="stat-label">{{ t('estate.median') }}</div>
            </div>
          </div>

          <div class="card drone-section">
            <h3 class="card-title">{{ t('estate.dronePlan') }}</h3>
            <div class="drone-controls">
              <div class="input-group inline">
                <label>{{ t('estate.maxDistanceM') }}</label>
                <input v-model="maxDistance" type="number" min="0" :placeholder="t('estate.optional')" class="drone-input" />
              </div>
              <button class="btn btn-blue" @click="loadDronePlan">{{ t('estate.calculate') }}</button>
            </div>
            <div v-if="dronePlan" class="drone-result">
              <div class="drone-metric">
                <span class="drone-metric-label">{{ t('estate.totalDistance') }}</span>
                <span class="drone-metric-value">{{ dronePlan.sum_distance }}m</span>
              </div>
              <div v-if="dronePlan.rest" class="drone-landing">
                <span class="drone-metric-label">{{ t('estate.forcedLanding') }}</span>
                <span class="drone-metric-value">({{ dronePlan.rest.x }}, {{ dronePlan.rest.y }})</span>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.estate-page {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
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
  padding: 16px 24px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(90deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.user-badge {
  padding: 4px 10px;
  background: rgba(76,175,80,0.2);
  border: 1px solid rgba(76,175,80,0.4);
  border-radius: 20px;
  font-size: 0.8rem;
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
  font-size: 0.9rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success { background: #2e7d32; color: #c8e6c9; }
.toast.error { background: #c62828; color: #ffcdd2; }

@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.main-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  min-height: calc(100vh - 60px);
}

.sidebar {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.15);
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
}

.card-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #81c784;
  margin-bottom: 12px;
}

.form-stack { display: flex; flex-direction: column; gap: 10px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.input-group { display: flex; flex-direction: column; gap: 4px; }
.input-group label { font-size: 0.75rem; color: #999; font-weight: 600; }

.input-group input {
  padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus { border-color: #4caf50; }

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary { background: linear-gradient(135deg, #1976d2, #42a5f5); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(25,118,210,0.4); }

.btn-green { background: linear-gradient(135deg, #2e7d32, #66bb6a); color: #fff; }
.btn-green:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(46,125,50,0.4); }

.btn-blue { background: linear-gradient(135deg, #1565c0, #42a5f5); color: #fff; }
.btn-blue:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(21,101,192,0.4); }

.empty-state { color: #666; font-size: 0.85rem; text-align: center; padding: 12px 0; }

.estate-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.estate-item:hover { background: rgba(255,255,255,0.06); }
.estate-item.active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.3); }

.estate-icon {
  font-weight: 800;
  font-size: 0.8rem;
  background: rgba(76,175,80,0.2);
  padding: 4px 8px;
  border-radius: 6px;
  color: #81c784;
}

.estate-info { font-size: 0.85rem; color: #bbb; }

.content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.hero-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  color: #666;
}

.hero-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76,175,80,0.1);
  border-radius: 20px;
  font-weight: 800;
  color: #4caf50;
}

.hero-empty h2 { color: #aaa; margin-bottom: 8px; }
.hero-empty p { font-size: 0.9rem; max-width: 400px; }

.section-header { margin-bottom: 20px; }
.section-header h2 { font-size: 1.3rem; display: flex; align-items: center; gap: 10px; }

.badge {
  font-size: 0.75rem;
  background: rgba(76,175,80,0.2);
  padding: 4px 10px;
  border-radius: 20px;
  color: #81c784;
  font-weight: 600;
}

.estate-visual {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.estate-canvas {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  max-width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px 16px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.2s;
}

.stat-card:hover { transform: translateY(-2px); }

.stat-count { background: linear-gradient(135deg, rgba(33,150,243,0.2), rgba(33,150,243,0.05)); }
.stat-max { background: linear-gradient(135deg, rgba(244,67,54,0.2), rgba(244,67,54,0.05)); }
.stat-min { background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.05)); }
.stat-median { background: linear-gradient(135deg, rgba(156,39,176,0.2), rgba(156,39,176,0.05)); }

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-count .stat-value { color: #64b5f6; }
.stat-max .stat-value { color: #ef5350; }
.stat-min .stat-value { color: #66bb6a; }
.stat-median .stat-value { color: #ba68c8; }

.stat-value small { font-size: 0.6em; font-weight: 600; }

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  font-weight: 600;
}

.drone-section { margin-top: 0; }

.drone-controls {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.drone-input { width: 160px; }

.drone-result {
  margin-top: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.drone-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drone-metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #999;
  font-weight: 600;
}

.drone-metric-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: #42a5f5;
}

.drone-landing .drone-metric-value { color: #ff7043; }

@media (max-width: 768px) {
  .estate-page { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .main-grid { grid-template-columns: 1fr; }
  .sidebar { max-height: none; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .content { max-height: none; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
