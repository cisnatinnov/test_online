<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const balance = ref(100)
const betDisplay = ref('-')
const betInput = ref(10)
const selected = ref(-1)
const showPickPhase = ref(true)
const showCanvas = ref(false)
const showResult = ref(false)
const resultText = ref('')
const resultColor = ref('')
const showAgainBtn = ref(false)

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22']
const NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange']
let turtles = []
let positions = []
let running = false
let anim = null

function init() {
  turtles = COLORS.map((c, i) => ({ color: c, name: NAMES[i], speed: 0.5 + Math.random() * 1.5 }))
  selected.value = -1; betInput.value = 10
  showPickPhase.value = true; showCanvas.value = false; showResult.value = false; showAgainBtn.value = false
  betDisplay.value = '-'
}

function selectTurtle(i) { selected.value = i }

function startRace() {
  if (selected.value < 0) return alert('Pick a turtle!')
  const b = parseInt(betInput.value) || 10
  if (b < 1 || b > balance.value) return alert('Invalid bet!')
  showPickPhase.value = false; showCanvas.value = true
  betDisplay.value = b
  running = true; positions = Array(6).fill(0)
  anim = requestAnimationFrame(loop)
}

function loop() {
  if (!running) return
  const c = canvasRef.value, ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  const trackH = c.height / 6
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#1a3a15'; ctx.fillRect(0, i * trackH, c.width, trackH)
    ctx.fillStyle = turtles[i].color
    ctx.fillRect(positions[i] * 5 + 5, i * trackH + trackH / 2 - 10, 30, 20)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(turtles[i].name, positions[i] * 5 + 20, i * trackH + trackH / 2 + 4)
    if (!running) continue
    positions[i] += turtles[i].speed * (0.3 + Math.random() * 0.7)
    if (positions[i] >= 120) {
      running = false
      const win = i === selected.value
      const b = parseInt(betDisplay.value) || 10
      balance.value += win ? b * 5 : 0
      resultText.value = win ? 'You won ' + b * 5 + ' coins!' : 'Turtle ' + turtles[i].name + ' won!'
      resultColor.value = win ? '#2ecc71' : '#e74c3c'
      showResult.value = true; showAgainBtn.value = true
      betDisplay.value = '-'
      return
    }
  }
  anim = requestAnimationFrame(loop)
}

function resetRace() {
  if (anim) cancelAnimationFrame(anim)
  init()
}

onUnmounted(() => { if (anim) cancelAnimationFrame(anim) })

init()
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Turtle Racing</h2>
    <div style="display:flex;justify-content:center;gap:20px;margin:10px 0;font-size:16px">
      <span>Balance: <strong>{{ balance }}</strong> coins</span>
      <span>Bet: <strong>{{ betDisplay }}</strong></span>
    </div>
    <div v-if="showPickPhase">
      <p style="text-align:center">Pick your turtle and place a bet:</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0">
        <button v-for="(t, i) in turtles" :key="i" @click="selectTurtle(i)"
          :style="{ background: t.color, color: '#fff', border: selected === i ? '3px solid #fff' : '3px solid transparent', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }">
          {{ t.name }}
        </button>
      </div>
      <div style="text-align:center">
        <label>Bet: <input type="number" v-model.number="betInput" min="1" max="100" style="width:70px;padding:5px;border-radius:4px;border:1px solid #ccc"></label>
        <button @click="startRace">Race!</button>
      </div>
    </div>
    <canvas v-if="showCanvas" ref="canvasRef" width="660" height="220"
      style="display:block;margin:0 auto;border:2px solid #444;border-radius:8px;background:#2d5a27"></canvas>
    <div v-if="showResult" style="text-align:center;font-size:20px;font-weight:bold;margin:10px 0" :style="{ color: resultColor }">
      {{ resultText }}
    </div>
    <div style="text-align:center;margin-top:15px">
      <button v-if="showAgainBtn" @click="resetRace">Race Again</button>
    </div>
  </div>
</template>
