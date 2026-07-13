<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const aVal = ref(1)
const bVal = ref(-2)
const cVal = ref(-3)
const infoCards = ref([])
const stepsHtml = ref('')
const showSteps = ref(false)

function calc() {
  const a = parseFloat(aVal.value) || 0
  const b = parseFloat(bVal.value) || 0
  const c = parseFloat(cVal.value) || 0
  if (a === 0) {
    infoCards.value = [{ label: 'Not Quadratic', val: 'a cannot be 0 (it becomes linear).' }]
    showSteps.value = false; return
  }
  const disc = b * b - 4 * a * c
  const vx = -b / (2 * a)
  const vy = a * vx * vx + b * vx + c
  const yIntercept = c
  const x1 = disc > 0 ? (-b + Math.sqrt(disc)) / (2 * a) : null
  const x2 = disc > 0 ? (-b - Math.sqrt(disc)) / (2 * a) : null
  const xVertex = disc === 0 ? -b / (2 * a) : null
  let rootsText = ''
  if (disc > 0) rootsText = `Root 1: x = ${x1.toFixed(4)}, Root 2: x = ${x2.toFixed(4)}`
  else if (disc === 0) rootsText = `Double root: x = ${xVertex.toFixed(4)}`
  else { const rp = (-b / (2 * a)).toFixed(4); const ip = (Math.sqrt(-disc) / (2 * a)).toFixed(4); rootsText = `Complex: ${rp} ± ${ip}i` }
  infoCards.value = [
    { label: 'Vertex', val: `(${vx.toFixed(4)}, ${vy.toFixed(4)})` },
    { label: 'Axis of Symmetry', val: `x = ${vx.toFixed(4)}` },
    { label: 'Discriminant', val: `Δ = ${disc.toFixed(4)} ${disc > 0 ? '(2 real)' : disc === 0 ? '(1 double)' : '(complex)'}` },
    { label: 'Y-intercept', val: `(0, ${yIntercept})` },
    { label: 'Opens', val: a > 0 ? 'Upward (minimum)' : 'Downward (maximum)' },
    { label: 'Roots', val: rootsText },
  ]
  stepsHtml.value = `<h4>Solution Steps</h4><p><strong>1.</strong> f(x) = ${a}x² + ${b}x + ${c}</p><p><strong>2.</strong> Δ = b² - 4ac = ${b}² - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = <strong>${disc}</strong></p><p><strong>3.</strong> x = (-b ± √Δ) / 2a</p><p><strong>Vertex:</strong> x = ${vx.toFixed(4)}, f(x) = ${vy.toFixed(4)}</p>`
  showSteps.value = true
  drawGraph(a, b, c, vx, vy, x1, x2)
}

function drawGraph(a, b, c, vx, vy, x1, x2) {
  const canvas = canvasRef.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  let xMin, xMax
  if (x1 !== null && x2 !== null) { const sp = Math.abs(x2 - x1) * 0.5 || 2; xMin = Math.min(x1, x2) - sp; xMax = Math.max(x1, x2) + sp }
  else { xMin = vx - 5; xMax = vx + 5 }
  const samplePts = []
  for (let px = 0; px < W; px++) { const x = xMin + (px / W) * (xMax - xMin); samplePts.push({ px, y: a * x * x + b * x + c }) }
  const ys = samplePts.map(p => p.y)
  let yMin = Math.min(...ys, -1); let yMax = Math.max(...ys, 1)
  if (yMax - yMin < 4) { yMin -= 2; yMax += 2 }
  const pad = 0.15 * (yMax - yMin); yMin -= pad; yMax += pad
  const toX = v => ((v - xMin) / (xMax - xMin)) * W
  const toY = v => H - ((v - yMin) / (yMax - yMin)) * H
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1
  const y0 = toY(0); if (y0 > 0 && y0 < H) { ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke() }
  const x0 = toX(0); if (x0 > 0 && x0 < W) { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke() }
  ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'
  const xStep = Math.ceil((xMax - xMin) / 10)
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) { if (x === 0) continue; ctx.fillText(x, toX(x) + 2, y0 + 14) }
  const yStep = Math.ceil((yMax - yMin) / 8)
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) { if (y === 0) continue; ctx.fillText(y, x0 + 5, toY(y) - 3) }
  ctx.strokeStyle = '#007BFF'; ctx.lineWidth = 3; ctx.beginPath()
  let started = false
  for (let px = 0; px < W; px++) {
    const x = xMin + (px / W) * (xMax - xMin)
    const py = toY(a * x * x + b * x + c)
    if (py < -100 || py > H + 100) { started = false; continue }
    if (!started) { ctx.moveTo(px, py); started = true } else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.fillStyle = '#e74c3c'
  const vpx = toX(vx), vpy = toY(vy)
  ctx.beginPath(); ctx.arc(vpx, vpy, 6, 0, Math.PI * 2); ctx.fill()
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Vertex (' + vx.toFixed(2) + ',' + vy.toFixed(2) + ')', vpx + 10, vpy - 10)
  ctx.fillStyle = '#2ecc71'
  if (x1 !== null) { ctx.beginPath(); ctx.arc(toX(x1), y0, 5, 0, Math.PI * 2); ctx.fill() }
  if (x2 !== null) { ctx.beginPath(); ctx.arc(toX(x2), y0, 5, 0, Math.PI * 2); ctx.fill() }
  ctx.strokeStyle = '#e74c3c44'; ctx.lineWidth = 2; ctx.setLineDash([5, 5])
  ctx.beginPath(); ctx.moveTo(vpx, 0); ctx.lineTo(vpx, H); ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#888'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('f(x) = ' + a + 'x² + ' + b + 'x + ' + c, W / 2, 20)
}

onMounted(() => calc())
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Quadratic Function</h2>
    <p style="text-align:center;color:#888;font-size:14px">f(x) = ax² + bx + c</p>
    <div style="display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;gap:8px;align-items:center;margin:15px 0">
      <label style="font-size:18px;font-weight:bold;color:#007BFF">f(x) =</label>
      <input v-model.number="aVal" type="number" step="any" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:16px;box-sizing:border-box;text-align:center">
      <label style="font-size:18px;font-weight:bold;color:#007BFF">x² +</label>
      <input v-model.number="bVal" type="number" step="any" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:16px;box-sizing:border-box;text-align:center">
      <label style="font-size:18px;font-weight:bold;color:#007BFF">x +</label>
      <input v-model.number="cVal" type="number" step="any" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:16px;box-sizing:border-box;text-align:center">
      <button @click="calc" style="padding:10px 18px">Graph</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0">
      <div v-for="card in infoCards" :key="card.label" style="background:#f8f9fa;padding:12px;border-radius:8px;border:1px solid #dee2e6">
        <h4 style="margin:0 0 6px;font-size:13px;color:#666">{{ card.label }}</h4>
        <p style="margin:2px 0;font-size:14px">{{ card.val }}</p>
      </div>
    </div>
    <canvas ref="canvasRef" width="650" height="450"
      style="display:block;margin:15px auto;border:2px solid #444;border-radius:8px;background:#fff"></canvas>
    <div v-if="showSteps" style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;line-height:1.8;font-size:14px" v-html="stepsHtml"></div>
  </div>
</template>
