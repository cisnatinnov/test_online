<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const text = ref('')
const ratio = ref('0.2')
const sentences = ref([])
const topIndices = ref(new Set())
const stats = ref('')
const showResult = ref(false)

function loadExample() {
  text.value = "Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language. The goal is to enable computers to understand, interpret, and generate human language in a valuable way. NLP combines computational linguistics with statistical, machine learning, and deep learning models. These technologies enable computers to process human language in the form of text or voice data. They can understand its full meaning, complete with the speaker's intent and sentiment. NLP drives computer programs that translate text from one language to another, respond to spoken commands, and summarize large volumes of text rapidly. NLP is increasingly important in business applications. Companies use it to automate customer service, analyze customer feedback, and extract insights from documents. Modern NLP relies on machine learning, particularly deep learning using transformer architectures. Models like BERT, GPT, and T5 have revolutionized the field by achieving state-of-the-art results on many benchmarks. Despite advances, NLP still faces challenges including understanding context, handling ambiguity, and dealing with sarcasm and irony in text."
}

function summarize() {
  if (!text.value.trim()) return alert('Enter some text to summarize!')
  const sents = text.value.match(/[^.!?]+[.!?]+/g) || [text.value]
  sentences.value = sents
  const r = parseFloat(ratio.value)
  const numSents = Math.max(1, Math.round(sents.length * r))
  const scored = sents.map((s, i) => {
    let score = 0
    const words = s.trim().split(/\s+/)
    score += words.length * 0.5
    const important = /important|significant|key|main|primary|major|crucial|essential|fundamental|revolutionized|advances|challenges/i
    if (important.test(s)) score += 5
    if (i === 0) score += 3
    if (i === sents.length - 1) score += 2
    const stopwords = /the|a|an|is|are|was|were|in|on|at|to|for|of|and|or|but|with|by|from/
    const contentWords = words.filter(w => !stopwords.test(w))
    score += contentWords.length * 0.3
    return { sentence: s.trim(), score, index: i }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = new Set(scored.slice(0, numSents).map(s => s.index))
  top.add(0)
  topIndices.value = top
  stats.value = `Original: ${sents.length} sentences | Summary: ${top.size} sentences | Reduction: ${((1 - top.size / sents.length) * 100).toFixed(0)}%`
  showResult.value = true
}
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Text Summarizer</h2>
    <textarea v-model="text" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.5" rows="8" placeholder="Paste or type a long text to summarize..."></textarea>
    <div style="display:flex;gap:10px;margin:10px 0;align-items:center">
      <button @click="summarize">Summarize</button>
      <label style="font-size:13px">Summary ratio: <select v-model="ratio" style="padding:4px;border-radius:4px">
        <option value="0.3">30% (Brief)</option>
        <option value="0.2">20% (Medium)</option>
        <option value="0.1">10% (Detailed)</option>
      </select></label>
      <button @click="loadExample">Load Example</button>
    </div>
    <div v-if="stats" style="display:flex;gap:20px;margin:10px 0;font-size:13px;color:#666">{{ stats }}</div>
    <div v-if="showResult" style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;line-height:1.8">
      <h4>Summary ({{ topIndices.size }} of {{ sentences.length }} sentences)</h4>
      <div v-for="(s, i) in sentences" :key="i"
        :style="{ padding: '8px 12px', margin: '4px 0', borderRadius: '6px', borderLeft: '4px solid #007BFF', background: topIndices.has(i) ? '#fff3cd' : '#f0f7ff', fontWeight: topIndices.has(i) ? 'bold' : 'normal', borderColor: topIndices.has(i) ? '#f1c40f' : '#007BFF' }">
        {{ s.trim() }}
      </div>
    </div>
  </div>
</template>
