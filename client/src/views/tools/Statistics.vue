<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { preparePlot, drawAxes, plotColors } from '../../utils/plotCanvas'

const router = useRouter()
const input = ref('')
const cards = ref([])
const details = ref('')
const canvasRef = ref(null)
let histogramData = []

function loadExample() { input.value = '12, 15, 18, 20, 22, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60' }

function clearAll() {
  input.value = ''; cards.value = []; details.value = ''
  drawHist([])
}

function calc() {
  const nums = input.value.split(/[,\s]+/).map(Number).filter(n => isFinite(n))
  if (nums.length < 2) return alert('Enter at least 2 numbers!')
  nums.sort((a, b) => a - b)
  const n = nums.length
  const sum = nums.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const median = n % 2 === 1 ? nums[(n - 1) / 2] : (nums[n / 2 - 1] + nums[n / 2]) / 2
  const freq = {}; nums.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  let mode = '-'; let maxFreq = 0
  for (const [k, v] of Object.entries(freq)) { if (v > maxFreq) { maxFreq = v; mode = k } }
  if (maxFreq === 1) mode = 'No mode'
  const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  const range = nums[n - 1] - nums[0]
  const q1 = nums[Math.floor(n * 0.25)]
  const q3 = nums[Math.floor(n * 0.75)]
  const iqr = q3 - q1
  cards.value = [
    { label: 'Count', val: n }, { label: 'Mean', val: mean.toFixed(4) }, { label: 'Median', val: median },
    { label: 'Mode', val: mode }, { label: 'Std Dev', val: stdDev.toFixed(4) }, { label: 'Variance', val: variance.toFixed(4) },
    { label: 'Range', val: range }, { label: 'Min', val: nums[0] }, { label: 'Max', val: nums[n - 1] },
  ]
  details.value = `<p><strong>Sum:</strong> ${sum}</p><p><strong>Q1 (25th):</strong> ${q1}</p><p><strong>Q3 (75th):</strong> ${q3}</p><p><strong>IQR:</strong> ${iqr}</p><p><strong>Lower Fence:</strong> ${q1 - 1.5 * iqr}</p><p><strong>Upper Fence:</strong> ${q3 + 1.5 * iqr}</p>`
  drawHist(nums)
}

function drawHist(nums) {
  const c = canvasRef.value; if (!c) return
  histogramData = nums
  const { ctx, width, height } = preparePlot(c)
  if (!nums.length) {
    ctx.fillStyle = plotColors.text; ctx.textAlign = 'center'
    ctx.fillText('Calculate to view the distribution', width / 2, height / 2)
    return
  }
  const min = Math.min(...nums), max = Math.max(...nums)
  const bins = 10; const binW = (max - min) / bins || 1
  const counts = Array(bins).fill(0)
  nums.forEach(v => { let idx = Math.floor((v - min) / binW); if (idx >= bins) idx = bins - 1; counts[idx]++ })
  const maxC = Math.max(...counts)
  const plot = drawAxes(ctx, { width, height, xMin: min, xMax: min + bins * binW, yMin: 0, yMax: maxC + Math.max(1, maxC * .2) })
  const barW = (plot.right - plot.left) / bins
  counts.forEach((count, i) => {
    const x = plot.left + i * barW + 2
    const y = plot.toY(count)
    ctx.fillStyle = plotColors.curve; ctx.fillRect(x, y, Math.max(1, barW - 4), plot.bottom - y)
    ctx.fillStyle = plotColors.text; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'
    if (count > 0) ctx.fillText(count, x + barW / 2 - 2, y - 7)
  })
}
function redraw() { drawHist(histogramData) }
onMounted(() => { redraw(); window.addEventListener('resize', redraw) })
onUnmounted(() => window.removeEventListener('resize', redraw))
</script>

<template>
  <div class="tool-page" style="max-width:650px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Statistics Calculator</h2>
    <textarea v-model="input" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:15px;box-sizing:border-box;margin-bottom:10px" rows="3" placeholder="Enter numbers separated by commas, e.g. 12, 15, 18, 22, 25, 30"></textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
      <button @click="calc">Calculate</button>
      <button @click="loadExample">Load Example</button>
      <button @click="clearAll" style="background:#b91c1c">Clear</button>
    </div>
    <div class="tool-stat-grid">
      <div v-for="card in cards" :key="card.label" style="background:var(--bg-secondary);padding:15px;border-radius:8px;text-align:center;border:1px solid var(--border-color)">
        <h4 style="margin:0 0 5px;font-size:12px;color:var(--text-secondary)">{{ card.label }}</h4>
        <div style="font-size:22px;font-weight:bold;color:var(--accent-blue)">{{ card.val }}</div>
      </div>
    </div>
    <h3>Distribution</h3>
    <canvas ref="canvasRef" width="600" height="300" class="tool-plot" role="img" aria-label="Data distribution with value and frequency labels" style="display:block;margin:15px auto;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary)"></canvas>
    <h3>Details</h3>
    <div style="background:var(--bg-secondary);padding:15px;border-radius:8px" v-html="details"></div>
  </div>
</template>
