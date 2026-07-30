<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SentimentIntensityAnalyzer } from 'vader-sentiment'

const router = useRouter()
const text = ref('')
const showOutput = ref(false)
const needlePos = ref(50)
const sentimentLabel = ref('')
const sentimentEmoji = ref('')
const sentimentColor = ref('')
const negPct = ref(0)
const neuPct = ref(0)
const posPct = ref(0)
const compoundScore = ref(0)
const wordScores = ref([])

const POS_WORDS = new Set(["good","great","excellent","amazing","wonderful","fantastic","love","happy","beautiful","best","awesome","brilliant","perfect","nice","superb","outstanding","pleased","glad","delighted","incredible","terrific","fabulous","positive","enjoy","success","win","cheerful","joy","remarkable","impressive","spectacular","triumph","benefit","better","strong","powerful","efficient","reliable","advanced","exceptional","pleasant","thank","grateful","appreciate","adore","celebrate","exciting","fun","glorious","ideal","inspire","marvelous","miracle","optimistic","paradise","peaceful","relief","reward","smooth","soothing","splendid","stunning","superior","sweet","thrill","treasure","warm","worthy","bright","creative","elegant","encourage","energetic","engaging","enthusiasm","extraordinary","flourish","generous","grace","growth","healthy","hope","humor","insight","intelligent","kind","laugh","leadership","lively","loyal","luck","magic","meaningful","motivate","natural","opportunity","passion","patient","peace","phenomenal","pleasure","praise","precious","pride","productive","progress","prosper","proud","purpose","radiant","respect","responsible","romantic","safe","shine","sincere","skill","smart","solution","spirit","stable","strength","succeed","super","support","talent","thankful","thrive","together","top","trust","welcome"])
const NEG_WORDS = new Set(["bad","terrible","horrible","awful","hate","ugly","worst","poor","sad","angry","disgusting","disappointing","fail","failure","fear","annoying","bitter","boring","broken","brutal","clumsy","cold","confuse","confused","corrupt","cruel","damage","danger","dangerous","dark","depress","depression","destroy","disaster","disease","doubt","dull","dying","evil","fierce","filthy","fool","foolish","grief","grim","gross","guilt","harm","harsh","helpless","horror","hostile","hurt","ill","inferior","insult","jealous","kill","lack","lame","liar","lie","loss","lost","lousy","mad","malice","misery","mistake","mock","nasty","negative","neglect","nightmare","nuisance","offend","pain","panic","pathetic","pessimistic","poison","pollute","problem","protest","punish","rage","refuse","reject","revenge","rotten","rude","ruin","scare","scary","severe","shame","shock","sick","silly","sorrow","sorry","stale","stupid","suffer","terrified","threat","toxic","tragic","trouble","ugly","unfair","unhappy","upset","useless","victim","violence","vulgar","war","weak","weakness","weapon","wicked","worry","worse","worthless","wound","wrong","yell"])

function loadExample() {
  text.value = "This product is absolutely amazing! The quality is excellent and I love the design. However, the delivery was quite slow and the packaging was damaged. Overall, I'm very happy with my purchase and would definitely recommend it to friends. The customer service was helpful and responsive. Great value for the price!"
}

function analyze() {
  const t = text.value.trim()
  if (!t) return alert('Enter some text!')
  const scores = SentimentIntensityAnalyzer.polarity_scores(t)
  negPct.value = Math.round(scores.neg * 100)
  neuPct.value = Math.round(scores.neu * 100)
  posPct.value = Math.round(scores.pos * 100)
  compoundScore.value = scores.compound
  const s = scores.compound >= 0.05 ? 'positive' : scores.compound <= -0.05 ? 'negative' : 'neutral'
  sentimentEmoji.value = { positive: '😊', negative: '😠', neutral: '😐' }[s]
  sentimentLabel.value = { positive: 'Positive Sentiment', negative: 'Negative Sentiment', neutral: 'Neutral Sentiment' }[s]
  sentimentColor.value = { positive: '#2ecc71', negative: '#e74c3c', neutral: '#f39c12' }[s]
  const pos = Math.max(0, scores.compound)
  const neg = Math.max(0, -scores.compound)
  needlePos.value = 50 + (pos - neg) * 50
  needlePos.value = Math.max(0, Math.min(100, needlePos.value))
  const words = t.toLowerCase().split(/[^a-z']+/).filter(w => w.length > 1)
  wordScores.value = words.map(w => {
    let score = 0
    if (POS_WORDS.has(w)) score = 1
    else if (NEG_WORDS.has(w)) score = -1
    return { word: w, score }
  })
  showOutput.value = true
}
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Sentiment Analysis</h2>
    <textarea v-model="text" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.5" rows="5" placeholder="Enter text to analyze sentiment..."></textarea>
    <div style="display:flex;gap:10px;margin:10px 0">
      <button @click="analyze">Analyze</button>
      <button @click="loadExample">Load Example</button>
    </div>
    <div v-if="showOutput">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:5px">
        <span>Negative <small>({{ compoundScore.toFixed(2) }})</small></span><span>Neutral</span><span>Positive <small>({{ compoundScore.toFixed(2) }})</small></span>
      </div>
      <div style="height:30px;border-radius:15px;background:linear-gradient(to right,#e74c3c,#f39c12,#2ecc71);position:relative;margin:15px 0">
        <div :style="{ width: '4px', height: '40px', background: '#fff', border: '2px solid #333', position: 'absolute', top: '-5px', borderRadius: '2px', transition: 'left .5s', left: needlePos + '%' }"></div>
      </div>
      <div style="text-align:center;padding:20px;background:#f8f9fa;border-radius:8px;margin:15px 0">
        <div style="font-size:60px;margin:10px 0">{{ sentimentEmoji }}</div>
        <div :style="{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: sentimentColor }">{{ sentimentLabel }}</div>
        <div style="font-size:13px;color:#666">Compound score: {{ compoundScore.toFixed(4) }}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0">
        <div style="text-align:center;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #dee2e6;border-color:#e74c3c">
          <h4 style="margin:0 0 5px;font-size:12px;color:#666">NEGATIVE</h4>
          <div style="font-size:24px;font-weight:bold;color:#e74c3c">{{ negPct }}%</div>
        </div>
        <div style="text-align:center;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #dee2e6;border-color:#f39c12">
          <h4 style="margin:0 0 5px;font-size:12px;color:#666">NEUTRAL</h4>
          <div style="font-size:24px;font-weight:bold;color:#f39c12">{{ neuPct }}%</div>
        </div>
        <div style="text-align:center;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #dee2e6;border-color:#2ecc71">
          <h4 style="margin:0 0 5px;font-size:12px;color:#666">POSITIVE</h4>
          <div style="font-size:24px;font-weight:bold;color:#2ecc71">{{ posPct }}%</div>
        </div>
      </div>
      <h3>Word Analysis</h3>
      <div>
        <span v-for="(ws, i) in wordScores" :key="i"
          :style="{ display: 'inline-block', padding: '3px 8px', margin: '2px', borderRadius: '4px', fontSize: '13px', background: ws.score > 0 ? '#2ecc7133' : ws.score < 0 ? '#e74c3c33' : '#f39c1233', color: ws.score > 0 ? '#2ecc71' : ws.score < 0 ? '#e74c3c' : '#888' }">
          {{ ws.word }}
        </span>
      </div>
    </div>
  </div>
</template>
