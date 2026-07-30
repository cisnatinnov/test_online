<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref(null)
const wordDisplay = ref([])
const hintText = ref('')
const statusText = ref('')
const statusColor = ref('')
const letterButtons = ref([])

const WORDS = [
  { word: 'JAVASCRIPT', hint: 'Programming language for the web' },
  { word: 'DATABASE', hint: 'Stores structured data' },
  { word: 'ALGORITHM', hint: 'Step-by-step procedure to solve a problem' },
  { word: 'FUNCTION', hint: 'Reusable block of code' },
  { word: 'VARIABLE', hint: 'Named storage for data' },
  { word: 'LOOP', hint: 'Repeats a block of code' },
  { word: 'ARRAY', hint: 'Ordered collection of elements' },
  { word: 'BOOLEAN', hint: 'True or false value' },
  { word: 'STRING', hint: 'Sequence of characters' },
  { word: 'INTEGER', hint: 'Whole number type' },
  { word: 'PYTHON', hint: 'Snake-named programming language' },
  { word: 'COMPILER', hint: 'Converts source code to machine code' },
  { word: 'SYNTAX', hint: 'Rules for writing code' },
  { word: 'OBJECT', hint: 'Instance of a class' },
  { word: 'NETWORK', hint: 'Interconnected computers' },
  { word: 'BINARY', hint: 'Base-2 number system' },
  { word: 'PIXEL', hint: 'Smallest unit of a digital image' },
  { word: 'SERVER', hint: 'Provides data to other computers' },
  { word: 'BROWSER', hint: 'Software to access the web' },
  { word: 'KEYBOARD', hint: 'Input device for typing' },
]

let word = ''
let guessed = new Set()
let wrongs = 0
const maxWrongs = 6

function newGame() {
  const pick = WORDS[Math.floor(Math.random() * WORDS.length)]
  word = pick.word; guessed = new Set(); wrongs = 0
  hintText.value = 'Hint: ' + pick.hint
  statusText.value = ''
  renderWord(); renderLetters(); drawHangman()
}

function renderWord() {
  wordDisplay.value = [...word].map(c => ({ char: guessed.has(c) ? c : '' }))
}

function renderLetters() {
  const letters = []
  for (let i = 65; i <= 90; i++) {
    const c = String.fromCharCode(i)
    letters.push({ char: c, disabled: guessed.has(c) })
  }
  letterButtons.value = letters
}

function guess(c) {
  guessed.add(c)
  if (!word.includes(c)) { wrongs++; drawHangman() }
  renderWord(); renderLetters(); checkEnd()
}

function checkEnd() {
  const won = [...word].every(c => guessed.has(c))
  const lost = wrongs >= maxWrongs
  if (won) { statusText.value = 'You won!'; statusColor.value = '#2ecc71' }
  if (lost) { statusText.value = 'Game over! Word: ' + word; statusColor.value = '#e74c3c' }
  if (won || lost) letterButtons.value.forEach(b => b.disabled = true)
}

function drawHangman() {
  const c = canvasRef.value, ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(20, 230); ctx.lineTo(180, 230); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(60, 230); ctx.lineTo(60, 30); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(60, 30); ctx.lineTo(140, 30); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(140, 30); ctx.lineTo(140, 60); ctx.stroke()
  if (wrongs >= 1) { ctx.beginPath(); ctx.arc(140, 80, 20, 0, Math.PI * 2); ctx.stroke() }
  if (wrongs >= 2) { ctx.beginPath(); ctx.moveTo(140, 100); ctx.lineTo(140, 160); ctx.stroke() }
  if (wrongs >= 3) { ctx.beginPath(); ctx.moveTo(140, 115); ctx.lineTo(115, 145); ctx.stroke() }
  if (wrongs >= 4) { ctx.beginPath(); ctx.moveTo(140, 115); ctx.lineTo(165, 145); ctx.stroke() }
  if (wrongs >= 5) { ctx.beginPath(); ctx.moveTo(140, 160); ctx.lineTo(120, 200); ctx.stroke() }
  if (wrongs >= 6) { ctx.beginPath(); ctx.moveTo(140, 160); ctx.lineTo(160, 200); ctx.stroke() }
}

onMounted(() => newGame())
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Hangman</h2>
    <div style="display:flex;gap:30px;align-items:flex-start;justify-content:center;flex-wrap:wrap;margin-top:15px">
      <canvas ref="canvasRef" width="200" height="250" style="background:#1a1a2e;border-radius:12px;padding:15px"></canvas>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin:20px 0">
      <div v-for="(item, i) in wordDisplay" :key="i" style="width:36px;height:44px;border-bottom:3px solid #007BFF;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#fff;letter-spacing:2px">
        {{ item.char }}
      </div>
    </div>
    <div style="color:#aaa;text-align:center;margin:10px 0;font-style:italic">{{ hintText }}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;max-width:360px;margin:15px auto;justify-content:center">
      <button v-for="item in letterButtons" :key="item.char" :disabled="item.disabled" @click="guess(item.char)"
        style="width:38px;height:38px;border:2px solid #444;border-radius:6px;background:#2a2a3e;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">
        {{ item.char }}
      </button>
    </div>
    <div style="text-align:center;margin-top:15px">
      <p style="font-size:18px;font-weight:bold" :style="{ color: statusColor }">{{ statusText }}</p>
      <button @click="newGame" style="margin-top:10px">New Game</button>
    </div>
  </div>
</template>
