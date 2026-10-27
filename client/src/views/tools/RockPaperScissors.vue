<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const winningScore = 5
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' }
const labels = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' }

const w = ref(0)
const d = ref(0)
const l = ref(0)
const playerEmoji = ref('?')
const compEmoji = ref('?')
const resultText = ref('')
const resultColor = ref('')
const vsLabel = ref('Rock / Paper / Scissors')
const gameOver = computed(() => w.value >= winningScore || l.value >= winningScore)

function newGame() {
  w.value = 0
  d.value = 0
  l.value = 0
  playerEmoji.value = '?'
  compEmoji.value = '?'
  resultText.value = ''
  resultColor.value = ''
  vsLabel.value = 'Rock / Paper / Scissors'
}

function play(pick) {
  if (gameOver.value) return
  const choices = ['rock', 'paper', 'scissors']
  const comp = choices[Math.floor(Math.random() * 3)]
  playerEmoji.value = emojis[pick]
  compEmoji.value = emojis[comp]
  vsLabel.value = labels[pick] + ' vs ' + labels[comp]
  if (pick === comp) {
    d.value++
    resultText.value = 'Draw!'
    resultColor.value = '#f1c40f'
  } else if ((pick === 'rock' && comp === 'scissors') || (pick === 'paper' && comp === 'rock') || (pick === 'scissors' && comp === 'paper')) {
    w.value++
    resultText.value = 'You win!'
    resultColor.value = '#2ecc71'
  } else {
    l.value++
    resultText.value = 'Computer wins!'
    resultColor.value = '#e74c3c'
  }
}
</script>

<template>
  <div class="tool-page" style="max-width:500px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Rock Paper Scissors</h2>
    <div style="display:flex;gap:30px;justify-content:center;margin:15px 0">
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">YOU</h4><div data-testid="player-score" style="font-size:28px;font-weight:bold;color:#2ecc71">{{ w }}</div></div>
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">DRAWS</h4><div data-testid="draw-score" style="font-size:28px;font-weight:bold;color:#f1c40f">{{ d }}</div></div>
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">COMPUTER</h4><div data-testid="computer-score" style="font-size:28px;font-weight:bold;color:#e74c3c">{{ l }}</div></div>
    </div>
    <div style="display:flex;justify-content:center;gap:30px;align-items:center;margin:20px 0">
      <div style="text-align:center;font-size:40px">{{ playerEmoji }}</div>
      <div style="font-size:24px;color:#aaa">VS</div>
      <div style="text-align:center;font-size:40px">{{ compEmoji }}</div>
    </div>
    <div style="display:flex;gap:15px;justify-content:center;margin:25px 0">
      <button v-for="choice in ['rock', 'paper', 'scissors']" :key="choice"
        type="button" class="choice-button" :aria-label="labels[choice]" :disabled="gameOver"
        @click="play(choice)">
        {{ emojis[choice] }}
      </button>
    </div>
    <div style="text-align:center;font-size:24px;font-weight:bold;margin:20px 0;min-height:80px" :style="{ color: resultColor }">{{ resultText }}</div>
    <p style="text-align:center;color:#aaa;font-size:13px">{{ vsLabel }}</p>
    <div v-if="gameOver" class="game-over">
      <p role="status">{{ t('tools.gameOver') }} {{ t(w >= winningScore ? 'tools.youWin' : 'tools.computerWins') }}</p>
      <button type="button" class="btn btn-green" @click="newGame">{{ t('tools.newGame') }}</button>
    </div>
  </div>
</template>

<style scoped>
.choice-button { width: 100px; max-width: 28%; aspect-ratio: 1; border-radius: 50%; border: 3px solid #444; display: flex; align-items: center; justify-content: center; background: transparent; color: inherit; font-size: clamp(28px, 8vw, 40px); cursor: pointer; transition: border-color .2s, transform .2s; }
.choice-button:hover:not(:disabled) { border-color: var(--accent-cyan); transform: scale(1.1); }
.choice-button:disabled { opacity: .4; cursor: not-allowed; }
.game-over { margin-top: 24px; padding: 20px; text-align: center; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--bg-card); }
.game-over p { margin-bottom: 14px; color: var(--text-primary); font-weight: 600; }
</style>
