<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const activeTab = ref('2d')
const shape2d = ref('circle')
const shape3d = ref('cube')
const fields2d = ref([])
const fields3d = ref([])
const fieldValues2d = ref({})
const fieldValues3d = ref({})
const resultsHtml = ref('<h4>Results</h4><p style="color:#aaa">Select a shape and enter dimensions</p>')

const FIELDS_2D = { circle: ['Radius'], rectangle: ['Width', 'Height'], triangle: ['Base', 'Height'], square: ['Side'], ellipse: ['Semi-major', 'Semi-minor'], trapezoid: ['Base1', 'Base2', 'Height'], parallelogram: ['Base', 'Height'] }
const FIELDS_3D = { cube: ['Side'], sphere: ['Radius'], cylinder: ['Radius', 'Height'], cone: ['Radius', 'Height'], rectprism: ['Length', 'Width', 'Height'], pyramid: ['Base', 'Height'], torus: ['R', 'r'] }

function switchTab(tab) { activeTab.value = tab }

function update2dFields() {
  fields2d.value = FIELDS_2D[shape2d.value] || []
  fieldValues2d.value = {}
}
function update3dFields() {
  fields3d.value = FIELDS_3D[shape3d.value] || []
  fieldValues3d.value = {}
}

function g(vals, i) { return parseFloat(vals[i]) || 0 }

function drawCircle(r) {
  const c = canvasRef.value, ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height)
  ctx.beginPath(); ctx.arc(150, 125, r * 2, 0, Math.PI * 2); ctx.strokeStyle = '#007BFF'; ctx.lineWidth = 3; ctx.stroke()
  ctx.fillStyle = '#007BFF22'; ctx.fill()
}
function drawRect(w, h) {
  const c = canvasRef.value, ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height)
  const s = Math.min(240 / w, 200 / h); ctx.strokeStyle = '#007BFF'; ctx.lineWidth = 3
  ctx.strokeRect(150 - w * s / 2, 125 - h * s / 2, w * s, h * s)
  ctx.fillStyle = '#007BFF22'; ctx.fillRect(150 - w * s / 2, 125 - h * s / 2, w * s, h * s)
}
function drawSphere(r) {
  const c = canvasRef.value, ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height)
  const R = Math.min(r * 2, 100)
  ctx.beginPath(); ctx.arc(150, 125, R, 0, Math.PI * 2); ctx.strokeStyle = '#007BFF'; ctx.lineWidth = 3; ctx.stroke()
  ctx.fillStyle = '#007BFF22'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(150, 125, R, R * 0.3, 0, 0, Math.PI * 2); ctx.strokeStyle = '#007BFF88'; ctx.stroke()
  ctx.beginPath(); ctx.ellipse(150, 125, R * 0.3, R, 0, 0, Math.PI * 2); ctx.strokeStyle = '#007BFF88'; ctx.stroke()
}
function drawCyl(r, h) {
  const c = canvasRef.value, ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height)
  const s = Math.min(100 / r, 120 / h); const rr = r * s, hh = h * s
  ctx.beginPath(); ctx.ellipse(150, 125 - hh / 2, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.strokeStyle = '#007BFF'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(150 - rr, 125 - hh / 2); ctx.lineTo(150 - rr, 125 + hh / 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(150 + rr, 125 - hh / 2); ctx.lineTo(150 + rr, 125 + hh / 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(150, 125 + hh / 2, rr, rr * 0.3, 0, 0, Math.PI); ctx.stroke()
}

function calc2d() {
  const shape = shape2d.value; let area, perim, formula = ''
  const v = fieldValues2d.value
  if (shape === 'circle') { const r = g(v, 0); area = Math.PI * r * r; perim = 2 * Math.PI * r; formula = 'A=πr², P=2πr'; drawCircle(r) }
  else if (shape === 'rectangle') { const w = g(v, 0), h = g(v, 1); area = w * h; perim = 2 * (w + h); formula = 'A=wh, P=2(w+h)'; drawRect(w, h) }
  else if (shape === 'triangle') { const b = g(v, 0), h = g(v, 1); area = 0.5 * b * h; perim = '-'; formula = 'A=½bh'; drawRect(b, h) }
  else if (shape === 'square') { const s = g(v, 0); area = s * s; perim = 4 * s; formula = 'A=s², P=4s'; drawRect(s, s) }
  else if (shape === 'ellipse') { const a = g(v, 0), b = g(v, 1); area = Math.PI * a * b; perim = '≈' + (Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))).toFixed(2); formula = 'A=πab'; drawRect(a * 2, b * 2) }
  else if (shape === 'trapezoid') { const b1 = g(v, 0), b2 = g(v, 1), h = g(v, 2); area = 0.5 * (b1 + b2) * h; perim = '-'; formula = 'A=½(a+b)h'; drawRect(Math.max(b1, b2), h) }
  else { const b = g(v, 0), h = g(v, 1); area = b * h; perim = '-'; formula = 'A=bh'; drawRect(b, h) }
  resultsHtml.value = `<h4>${shape.charAt(0).toUpperCase() + shape.slice(1)}</h4><p><strong>Formula:</strong> ${formula}</p><p><strong>Area:</strong> ${typeof area === 'number' ? area.toFixed(4) : area}</p><p><strong>Perimeter:</strong> ${typeof perim === 'number' ? perim.toFixed(4) : perim}</p>`
}

function calc3d() {
  const shape = shape3d.value; let vol, surf, formula = ''
  const v = fieldValues3d.value
  if (shape === 'cube') { const s = g(v, 0); vol = s * s * s; surf = 6 * s * s; formula = 'V=s³, SA=6s²'; drawRect(s, s) }
  else if (shape === 'sphere') { const r = g(v, 0); vol = (4 / 3) * Math.PI * r * r * r; surf = 4 * Math.PI * r * r; formula = 'V=⁴⁄₃πr³, SA=4πr²'; drawSphere(r) }
  else if (shape === 'cylinder') { const r = g(v, 0), h = g(v, 1); vol = Math.PI * r * r * h; surf = 2 * Math.PI * r * (r + h); formula = 'V=πr²h, SA=2πr(r+h)'; drawCyl(r, h) }
  else if (shape === 'cone') { const r = g(v, 0), h = g(v, 1); const l = Math.sqrt(r * r + h * h); vol = (1 / 3) * Math.PI * r * r * h; surf = Math.PI * r * (r + l); formula = 'V=⅓πr²h, SA=πr(r+l)'; drawCyl(r, h) }
  else if (shape === 'rectprism') { const l = g(v, 0), w = g(v, 1), h = g(v, 2); vol = l * w * h; surf = 2 * (l * w + l * h + w * h); formula = 'V=lwh, SA=2(lw+lh+wh)'; drawRect(l, h) }
  else if (shape === 'pyramid') { const b = g(v, 0), h = g(v, 1); const l = Math.sqrt((b / 2) * (b / 2) + h * h); vol = (1 / 3) * b * b * h; surf = b * b + 2 * b * l; formula = 'V=⅓b²h, SA=b²+2bl'; drawRect(b, h) }
  else { const R = g(v, 0), r = g(v, 1); vol = 2 * Math.PI * Math.PI * R * r * r; surf = 4 * Math.PI * Math.PI * R * r; formula = 'V=2π²Rr², SA=4π²Rr'; drawRect(R * 2, R * 2) }
  const name = shape === 'rectprism' ? 'Rectangular Prism' : shape.charAt(0).toUpperCase() + shape.slice(1)
  resultsHtml.value = `<h4>${name}</h4><p><strong>Formula:</strong> ${formula}</p><p><strong>Volume:</strong> ${typeof vol === 'number' ? vol.toFixed(4) : vol}</p><p><strong>Surface Area:</strong> ${typeof surf === 'number' ? surf.toFixed(4) : surf}</p>`
}

update2dFields(); update3dFields()
</script>

<template>
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Shapes Calculator</h2>
    <div style="display:flex;gap:10px;margin:15px 0">
      <button :style="{ flex: 1, background: activeTab === '2d' ? '#007BFF' : '', borderColor: activeTab === '2d' ? '#007BFF' : '' }" @click="switchTab('2d')">2D Shapes</button>
      <button :style="{ flex: 1, background: activeTab === '3d' ? '#007BFF' : '', borderColor: activeTab === '3d' ? '#007BFF' : '' }" @click="switchTab('3d')">3D Shapes</button>
    </div>
    <div v-if="activeTab === '2d'">
      <div style="margin:15px 0">
        <label>Shape</label>
        <select v-model="shape2d" @change="update2dFields" style="padding:8px;border-radius:4px;width:100%">
          <option value="circle">Circle</option><option value="rectangle">Rectangle</option><option value="triangle">Triangle</option>
          <option value="square">Square</option><option value="ellipse">Ellipse</option><option value="trapezoid">Trapezoid</option>
          <option value="parallelogram">Parallelogram</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0">
        <div v-for="(f, i) in fields2d" :key="i">
          <label style="font-size:13px;color:#aaa">{{ f }}</label>
          <input type="number" v-model="fieldValues2d[i]" min="0" step="any" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box">
        </div>
      </div>
      <button @click="calc2d">Calculate</button>
    </div>
    <div v-if="activeTab === '3d'">
      <div style="margin:15px 0">
        <label>Shape</label>
        <select v-model="shape3d" @change="update3dFields" style="padding:8px;border-radius:4px;width:100%">
          <option value="cube">Cube</option><option value="sphere">Sphere</option><option value="cylinder">Cylinder</option>
          <option value="cone">Cone</option><option value="rectprism">Rectangular Prism</option><option value="pyramid">Square Pyramid</option>
          <option value="torus">Torus</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0">
        <div v-for="(f, i) in fields3d" :key="i">
          <label style="font-size:13px;color:#aaa">{{ f }}</label>
          <input type="number" v-model="fieldValues3d[i]" min="0" step="any" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box">
        </div>
      </div>
      <button @click="calc3d">Calculate</button>
    </div>
    <div style="display:flex;justify-content:center;margin:20px 0">
      <canvas ref="canvasRef" width="300" height="250" style="background:#1a1a2e;border-radius:8px"></canvas>
    </div>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0" v-html="resultsHtml"></div>
  </div>
</template>
