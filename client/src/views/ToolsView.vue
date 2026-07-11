<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const auth = useAuthStore()

function toolUrl(path) {
  return `${path}?token=${auth.token}`
}

const categories = [
  {
    title: 'Games',
    items: [
      { name: 'Hangman', path: '/games/hangman.html' },
      { name: 'Coin Catcher', path: '/games/coin-catcher.html' },
      { name: 'Roleplay Adventure', path: '/games/roleplay-adventure.html' },
      { name: 'Turtle Racing', path: '/games/turtle-racing.html' },
      { name: 'Aim Trainer', path: '/games/aim-trainer.html' },
      { name: 'Rock Paper Scissors', path: '/games/rock-paper-scissors.html' },
    ]
  },
  {
    title: 'Math Tools',
    items: [
      { name: 'Scientific Calculator', path: '/math/scientific-calculator.html' },
      { name: 'Equation Grapher', path: '/math/equation-grapher.html' },
      { name: 'Statistics', path: '/math/statistics.html' },
      { name: 'Quadratic', path: '/math/quadratic.html' },
      { name: 'Shapes', path: '/math/shapes.html' },
    ]
  },
  {
    title: 'NER Tools',
    items: [
      { name: 'Text Summarizer', path: '/ner/summary.html' },
      { name: 'Sentiment Analysis', path: '/ner/sentiment.html' },
    ]
  }
]
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <h2 style="margin-bottom:16px">Tools</h2>
    <div v-for="cat in categories" :key="cat.title" style="margin-bottom:20px">
      <h3 style="margin-bottom:8px">{{ cat.title }}</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <a v-for="item in cat.items" :key="item.path" :href="toolUrl(item.path)" target="_blank"
           style="display:block;padding:16px;background:#fff;border-radius:8px;text-align:center;text-decoration:none;color:#333;box-shadow:0 1px 4px rgba(0,0,0,.1);transition:transform .2s"
           @mouseover="$event.target.style.transform='translateY(-2px)'" @mouseout="$event.target.style.transform='none'">
          {{ item.name }}
        </a>
      </div>
    </div>
    <button @click="router.push('/')" style="padding:8px 16px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Kembali</button>
  </div>
</template>
