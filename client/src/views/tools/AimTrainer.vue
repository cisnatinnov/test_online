<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const score = ref(0)
const hits = ref(0)
const misses = ref(0)
const timer = ref(30)
const running = ref(false)
const finalText = ref('')
const startDisabled = ref(false)

let targets = []
let animId = null
let spawnTimeout = null
let timeInterval = null

function start() {
  score.value = 0; hits.value = 0; misses.value = 0; timer.value = 30
  running.value = true; targets = []; finalText.value = ''
  startDisabled.value = true
  if (animId) cancelAnimationFrame(animId)
  spawnLoop(); timeLoop(); gameLoop()
}

function spawnLoop() {
  if (!running.value) return
  targets.push({ x: 15 + Math.random() * (520), y: 15 + Math.random() * (370), r: 15 + Math.random() * 25, life: 60 + Math.random() * 40 })
  spawnTimeout = setTimeout(spawnLoop, 700 - Math.min(score.value * 2, 500))
}

function timeLoop() {
  if (!running.value) return
  timer.value--
  if (timer.value <= 0) { running.value = false; end(); return }
  timeInterval = setTimeout(timeLoop, 1000)
}

function gameLoop() {
  if (!running.value) return
  const c = canvasRef.value, ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i]; t.life--
    if (t.life <= 0) { targets.splice(i, 1); continue }
    ctx.globalAlpha = Math.min(1, t.life / 20)
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fillStyle = '#e74c3c'; ctx.fill()
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#e74c3c'; ctx.fill()
    ctx.globalAlpha = 1
  }
  animId = requestAnimationFrame(gameLoop)
}

function end() {
  running.value = false; startDisabled.value = false
  const acc = hits.value + misses.value > 0 ? ((hits.value / (hits.value + misses.value)) * 100).toFixed(1) : 0
  finalText.value = 'Game Over! Score: ' + score.value + ' | Accuracy: ' + acc + '%'
}

function onClick(e) {
  if (!running.value) return
  const c = canvasRef.value, rect = c.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (c.width / rect.width)
  const my = (e.clientY - rect.top) * (c.height / rect.height)
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i], dx = mx - t.x, dy = my - t.y
    if (dx * dx + dy * dy <= t.r * t.r) {
      score.value += Math.round(10 + t.r); hits.value++; targets.splice(i, 1)
      return
    }
  }
  misses.value++
}

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (spawnTimeout) clearTimeout(spawnTimeout)
  if (timeInterval) clearTimeout(timeInterval)
})
</script>

<template>
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Aim Trainer</h2>
    <div style="display:flex;justify-content:space-between;margin:10px 0;font-size:18px">
      <span>Score: <strong>{{ score }}</strong></span>
      <span>Hits: <strong>{{ hits }}</strong></span>
      <span>Misses: <strong>{{ misses }}</strong></span>
      <span>Time: <strong>{{ timer }}</strong>s</span>
    </div>
    <canvas ref="canvasRef" width="550" height="400" @click="onClick"
      style="display:block;margin:0 auto;border:2px solid #444;border-radius:8px;background:#1a1a2e;cursor:crosshair"></canvas>
    <div style="text-align:center;margin-top:10px">
      <button :disabled="startDisabled" @click="start">Start</button>
      <p v-if="finalText" style="font-size:20px;font-weight:bold;color:#2ecc71">{{ finalText }}</p>
      <p style="color:#aaa;font-size:13px">Click the red targets as fast as you can!</p>
    </div>
  </div>
</template>
