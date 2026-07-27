<script setup>
import { useRouter } from 'vue-router'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
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
  <div class="page-container">
    <div class="page-header">
      <h2>Tools</h2>
      <div class="nav-bar">
        <LanguageSwitcher />
      </div>
    </div>
    <div v-for="cat in categories" :key="cat.title" style="margin-bottom:24px">
      <h3 style="margin-bottom:10px;color:var(--text-secondary);font-size:14px;text-transform:uppercase;letter-spacing:1px">{{ cat.title }}</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <button v-for="item in cat.items" :key="item.route" @click="router.push({ name: item.route })" class="tool-card">
          {{ item.name }}
        </button>
      </div>
    </div>
    <button @click="router.push('/')" class="btn btn-gray">Kembali</button>
  </div>
</template>

<style scoped>
.tool-card {
  display: block;
  padding: 18px 16px;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  text-align: center;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.tool-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-2px);
  border-color: var(--accent-green);
}
</style>
