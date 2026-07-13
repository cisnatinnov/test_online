<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const score = ref(0)
const lives = ref(3)
const timerVal = ref(30)
const startDisabled = ref(false)

let player = { x: 230, w: 60, h: 14 }
let items = []
let running = false
let animId = null
let spawnTimeout = null
let timeInterval = null

function startGame() {
  score.value = 0; lives.value = 3; timerVal.value = 30; running = true; items = []
  player.x = 230
  startDisabled.value = true
  if (animId) cancelAnimationFrame(animId)
  tick(); spawnLoop(); timeLoop(); gameLoop()
}

function tick() {}

function spawnLoop() {
  if (!running) return
  const isBomb = Math.random() < 0.25
  items.push({ x: Math.random() * (500 - 20), y: -20, speed: 2 + Math.random() * 3, bomb: isBomb, r: isBomb ? 14 : 12 })
  spawnTimeout = setTimeout(spawnLoop, 600 - Math.min(score.value * 5, 400))
}

function timeLoop() {
  if (!running) return
  timerVal.value--
  if (timerVal.value <= 0) { running = false; endGame(); return }
  timeInterval = setTimeout(timeLoop, 1000)
}

function gameLoop() {
  if (!running) return
  const c = canvasRef.value, ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(player.x, c.height - 30, player.w, player.h)
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; it.y += it.speed
    ctx.fillStyle = it.bomb ? '#e74c3c' : '#ffd700'
    ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(it.bomb ? '*' : '$', it.x, it.y + 5)
    if (it.y + it.r >= c.height - 30 && it.y - it.speed + it.r < c.height - 30 && it.x + it.r > player.x && it.x - it.r < player.x + player.w) {
      if (it.bomb) { lives.value--; if (lives.value <= 0) { running = false; endGame(); return } }
      else { score.value++ }
      items.splice(i, 1); continue
    }
    if (it.y > c.height + 20) items.splice(i, 1)
  }
  animId = requestAnimationFrame(gameLoop)
}

function endGame() {
  running = false; startDisabled.value = false
  alert('Game Over! Score: ' + score.value)
}

function onMouseMove(e) {
  if (!running) return
  const c = canvasRef.value, rect = c.getBoundingClientRect()
  player.x = Math.max(0, Math.min(c.width - player.w, (e.clientX - rect.left) * (c.width / rect.width) - player.w / 2))
}

function onKey(e) {
  if (!running) return
  if (e.key === 'ArrowLeft') player.x = Math.max(0, player.x - 20)
  if (e.key === 'ArrowRight') player.x = Math.min(500 - player.w, player.x + 20)
}

onMounted(() => { document.addEventListener('keydown', onKey) })
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  if (animId) cancelAnimationFrame(animId)
  if (spawnTimeout) clearTimeout(spawnTimeout)
  if (timeInterval) clearTimeout(timeInterval)
})
</script>

<template>
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Coin Catcher</h2>
    <div style="display:flex;justify-content:space-between;margin:10px 0;font-size:18px">
      <span>Score: <strong>{{ score }}</strong></span>
      <span>Lives: <strong>{{ lives }}</strong></span>
      <span>Time: <strong>{{ timerVal }}</strong>s</span>
    </div>
    <canvas ref="canvasRef" width="500" height="400" @mousemove="onMouseMove"
      style="display:block;margin:0 auto;border:2px solid #444;border-radius:8px;background:#1a1a2e"></canvas>
    <div style="text-align:center;margin-top:10px">
      <button :disabled="startDisabled" @click="startGame">Start</button>
      <p style="color:#aaa;font-size:13px">Move mouse or use arrow keys to catch coins. Avoid bombs!</p>
    </div>
  </div>
</template>
