<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const categories = [
  {
    title: 'Games',
    items: [
      { name: 'Hangman', route: 'tool-hangman' },
      { name: 'Coin Catcher', route: 'tool-coin-catcher' },
      { name: 'Roleplay Adventure', route: 'tool-roleplay-adventure' },
      { name: 'Turtle Racing', route: 'tool-turtle-racing' },
      { name: 'Aim Trainer', route: 'tool-aim-trainer' },
      { name: 'Rock Paper Scissors', route: 'tool-rps' },
    ]
  },
  {
    title: 'Math Tools',
    items: [
      { name: 'Scientific Calculator', route: 'tool-sci-calc' },
      { name: 'Equation Grapher', route: 'tool-eq-grapher' },
      { name: 'Statistics', route: 'tool-statistics' },
      { name: 'Quadratic', route: 'tool-quadratic' },
      { name: 'Shapes', route: 'tool-shapes' },
    ]
  },
  {
    title: 'NER Tools',
    items: [
      { name: 'Text Summarizer', route: 'tool-text-summarizer' },
      { name: 'Sentiment Analysis', route: 'tool-sentiment' },
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
        <button v-for="item in cat.items" :key="item.route" @click="router.push({ name: item.route })"
          style="display:block;padding:16px;background:#fff;border-radius:8px;text-align:center;text-decoration:none;color:#333;box-shadow:0 1px 4px rgba(0,0,0,.1);transition:transform .2s;cursor:pointer;border:none;font-size:14px"
          @mouseover="$event.target.style.transform='translateY(-2px)'" @mouseout="$event.target.style.transform='none'">
          {{ item.name }}
        </button>
      </div>
    </div>
    <button @click="router.push('/')" style="padding:8px 16px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Kembali</button>
  </div>
</template>
