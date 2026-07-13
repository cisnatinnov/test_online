<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
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

function play(pick) {
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
  <div style="max-width:500px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Rock Paper Scissors</h2>
    <div style="display:flex;gap:30px;justify-content:center;margin:15px 0">
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">YOU</h4><div style="font-size:28px;font-weight:bold;color:#2ecc71">{{ w }}</div></div>
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">DRAWS</h4><div style="font-size:28px;font-weight:bold;color:#f1c40f">{{ d }}</div></div>
      <div style="text-align:center"><h4 style="margin:0;color:#aaa;font-size:13px">COMPUTER</h4><div style="font-size:28px;font-weight:bold;color:#e74c3c">{{ l }}</div></div>
    </div>
    <div style="display:flex;justify-content:center;gap:30px;align-items:center;margin:20px 0">
      <div style="text-align:center;font-size:40px">{{ playerEmoji }}</div>
      <div style="font-size:24px;color:#aaa">VS</div>
      <div style="text-align:center;font-size:40px">{{ compEmoji }}</div>
    </div>
    <div style="display:flex;gap:15px;justify-content:center;margin:25px 0">
      <div v-for="choice in ['rock', 'paper', 'scissors']" :key="choice"
        style="width:100px;height:100px;border-radius:50%;border:3px solid #444;display:flex;align-items:center;justify-content:center;font-size:40px;cursor:pointer;transition:.2s"
        @click="play(choice)"
        @mouseover="$event.target.style.borderColor='#007BFF';$event.target.style.transform='scale(1.1)'"
        @mouseout="$event.target.style.borderColor='#444';$event.target.style.transform='none'">
        {{ emojis[choice] }}
      </div>
    </div>
    <div style="text-align:center;font-size:24px;font-weight:bold;margin:20px 0;min-height:80px" :style="{ color: resultColor }">{{ resultText }}</div>
    <p style="text-align:center;color:#aaa;font-size:13px">{{ vsLabel }}</p>
  </div>
</template>
