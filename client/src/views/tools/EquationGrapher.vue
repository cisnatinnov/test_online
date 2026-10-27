<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { preparePlot, drawAxes, clipPlot } from '../../utils/plotCanvas'

const router = useRouter()
const canvasRef = ref(null)
const eqInput = ref('sin(x)')
const xMinVal = ref(-10)
const xMaxVal = ref(10)
const legendItems = ref([])
const graphError = ref('')

const COLORS = ['#ff9d9d', '#78ceff', '#65e4ca', '#f6d775', '#c5a3ff', '#ffc08a', '#75e1ed', '#ff9dcc']
let equations = []

function eqEval(expr, x) {
  try {
    const safe = expr.replace(/\^/g, '**').replace(/pi/g, 'Math.PI').replace(/e(?![a-z])/gi, 'Math.E')
      .replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan')
      .replace(/log/g, 'Math.log').replace(/sqrt/g, 'Math.sqrt').replace(/abs/g, 'Math.abs')
      .replace(/exp/g, 'Math.exp').replace(/asin/g, 'Math.asin').replace(/acos/g, 'Math.acos')
      .replace(/atan/g, 'Math.atan')
    const fn = new Function('x', 'return ' + safe)
    const val = fn(x)
    return isFinite(val) ? val : null
  } catch (e) { return null }
}

function addEq() {
  const expr = eqInput.value.trim()
  if (!expr) return
  if (equations.length >= 8) equations.shift()
  equations.push({ expr, color: COLORS[equations.length % COLORS.length] })
  draw()
}

function clearEqs() { equations = []; draw() }

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const { ctx, width: W, height: H } = preparePlot(canvas)
  const xMin = Number(xMinVal.value)
  const xMax = Number(xMaxVal.value)
  graphError.value = ''
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax <= xMin) {
    graphError.value = 'Enter a valid X range with the maximum greater than the minimum.'
    return
  }
  let yMin = -10, yMax = 10
  const pts = []
  equations.forEach(eq => {
    for (let px = 0; px < W; px += 2) {
      const x = xMin + (px / W) * (xMax - xMin)
      const y = eqEval(eq.expr, x)
      if (y !== null && isFinite(y)) pts.push({ x, y, color: eq.color, px })
    }
  })
  if (pts.length) {
    const ys = pts.map(p => p.y)
    yMin = Math.min(...ys) - 1; yMax = Math.max(...ys) + 1
    if (yMax - yMin < 2) { yMin -= 1; yMax += 1 }
  }
  const plot = drawAxes(ctx, { width: W, height: H, xMin, xMax, yMin, yMax })
  const { toY } = plot
  clipPlot(ctx, plot)
  equations.forEach(eq => {
    ctx.strokeStyle = eq.color; ctx.lineWidth = 2.5; ctx.beginPath()
    let started = false
    for (let px = plot.left; px <= plot.right; px += 1) {
      const x = xMin + ((px - plot.left) / (plot.right - plot.left)) * (xMax - xMin)
      const y = eqEval(eq.expr, x)
      if (y === null || !isFinite(y) || y < yMin - 50 || y > yMax + 50) { started = false; continue }
      const py = toY(y)
      if (!started) { ctx.moveTo(px, py); started = true } else ctx.lineTo(px, py)
    }
    ctx.stroke()
  })
  ctx.restore()
  legendItems.value = equations.map(eq => ({ expr: eq.expr, color: eq.color }))
}

onMounted(() => { draw(); window.addEventListener('resize', draw) })
onUnmounted(() => window.removeEventListener('resize', draw))
</script>

<template>
  <div class="tool-page" style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Equation Grapher</h2>
    <div style="margin:15px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <input v-model="eqInput" type="text" placeholder="e.g. sin(x), x^2, 2*x+1, log(x)" style="flex:1;min-width:250px;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:15px">
      <button @click="addEq">Plot</button>
      <button @click="clearEqs" style="background:#b91c1c">Clear All</button>
    </div>
    <div style="margin:15px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <label style="white-space:nowrap">X range:</label>
      <input v-model.number="xMinVal" type="number" style="width:70px;min-width:70px;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:15px">
      <span>to</span>
      <input v-model.number="xMaxVal" type="number" style="width:70px;min-width:70px;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:15px">
      <button @click="draw">Redraw</button>
    </div>
    <div style="margin:10px 0;font-size:13px">
      <span v-for="(eq, i) in legendItems" :key="i" :style="{ marginRight: '15px', padding: '2px 8px', borderRadius: '3px', background: eq.color + '22', color: eq.color, fontWeight: 'bold' }">
        {{ eq.expr }}
      </span>
    </div>
    <p v-if="graphError" class="flash flash-error" role="alert">{{ graphError }}</p>
    <canvas ref="canvasRef" width="660" height="500" class="tool-plot" role="img" aria-label="Equation graph with labelled X and Y axes"
      style="display:block;margin:0 auto;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary)"></canvas>
    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:5px">Supports: x^2, sin(x), cos(x), tan(x), log(x), sqrt(x), abs(x), exp(x), pi, e. Use * for multiply.</p>
  </div>
</template>
