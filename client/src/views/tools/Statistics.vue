<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const input = ref('')
const cards = ref([])
const details = ref('')
const canvasRef = ref(null)

function loadExample() { input.value = '12, 15, 18, 20, 22, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60' }

function clearAll() {
  input.value = ''; cards.value = []; details.value = ''
  const c = canvasRef.value; if (c) c.getContext('2d').clearRect(0, 0, 600, 250)
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
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height)
  const min = Math.min(...nums), max = Math.max(...nums)
  const bins = 10; const binW = (max - min) / bins || 1
  const counts = Array(bins).fill(0)
  nums.forEach(v => { let idx = Math.floor((v - min) / binW); if (idx >= bins) idx = bins - 1; counts[idx]++ })
  const maxC = Math.max(...counts); const barW = (c.width - 60) / bins
  for (let i = 0; i <= bins; i++) {
    const x = 30 + i * barW
    ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, c.height - 30); ctx.strokeStyle = '#eee'; ctx.stroke()
  }
  const maxH = c.height - 50
  counts.forEach((count, i) => {
    const h = maxC > 0 ? (count / maxC) * maxH : 0
    const x = 30 + i * barW + 2
    ctx.fillStyle = '#007BFF'; ctx.fillRect(x, c.height - 30 - h, barW - 4, h)
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText((min + i * binW).toFixed(1), x + barW / 2 - 2, c.height - 15)
    if (count > 0) ctx.fillText(count, x + barW / 2 - 2, c.height - 35 - h)
  })
}
</script>

<template>
  <div style="max-width:650px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Statistics Calculator</h2>
    <textarea v-model="input" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:15px;box-sizing:border-box;margin-bottom:10px" rows="3" placeholder="Enter numbers separated by commas, e.g. 12, 15, 18, 22, 25, 30"></textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
      <button @click="calc">Calculate</button>
      <button @click="loadExample">Load Example</button>
      <button @click="clearAll" style="background:#e74c3c">Clear</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0">
      <div v-for="card in cards" :key="card.label" style="background:#f8f9fa;padding:15px;border-radius:8px;text-align:center;border:1px solid #dee2e6">
        <h4 style="margin:0 0 5px;font-size:12px;color:#666">{{ card.label }}</h4>
        <div style="font-size:22px;font-weight:bold;color:#007BFF">{{ card.val }}</div>
      </div>
    </div>
    <h3>Distribution</h3>
    <canvas ref="canvasRef" width="600" height="250" style="display:block;margin:15px auto;border:1px solid #ddd;border-radius:8px;background:#fff"></canvas>
    <h3>Details</h3>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px" v-html="details"></div>
  </div>
</template>
