<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
const wordScores = ref([])

const POS_WORDS = new Set(["good","great","excellent","amazing","wonderful","fantastic","love","happy","beautiful","best","awesome","brilliant","perfect","nice","superb","outstanding","pleased","glad","delighted","incredible","terrific","fabulous","magnificent","positive","enjoy","enjoyed","success","successful","win","won","victory","cheerful","joy","joyful","remarkable","impressive","spectacular","triumph","benefit","improve","improved","improvement","better","strong","powerful","efficient","reliable","innovative","advanced","exceptional","pleasant","satisfy","satisfied","satisfying","thank","thanks","grateful","appreciate","love","loved","loving","adore","celebrate","celebration","exciting","excited","excitement","fun","glorious","harmonious","ideal","inspire","inspired","inspiring","marvelous","miracle","optimistic","paradise","peaceful","refresh","refreshing","relief","reward","rewarding","smooth","soothing","sparkle","splendid","stunning","superior","surprise","surprised","sweet","thrill","thrilling","treasure","triumphant","upbeat","vibrant","vivid","warm","worthy","bright","creative","dynamic","elegant","encourage","encouraging","energetic","engaging","enthusiasm","extraordinary","flourish","generous","grace","graceful","growth","harmony","heal","healing","healthy","honor","hope","hopeful","humor","insight","insightful","intelligent","intuitive","keen","kind","laugh","laughter","lead","leadership","lively","loyal","luck","lucky","magic","meaningful","mindful","motivate","motivated","natural","nourish","open","opportunity","passion","passionate","patient","peace","phenomenal","pleasure","popular","praise","precious","pride","productive","progress","prosper","proud","purpose","radiant","rational","resilient","resourceful","respect","responsible","romantic","safe","satisfy","share","shine","sincere","skill","smart","solution","soul","spark","spirit","stable","strength","strong","succeed","super","support","talent","thankful","thrive","together","top","touch","tough","treasure","trend","triumph","trust","truth","unified","unique","unite","valuable","victory","vigor","virtue","warmth","wealth","welcome","wisdom","wonderful","worthy","youthful","zealous"])
const NEG_WORDS = new Set(["bad","terrible","horrible","awful","hate","ugly","worst","poor","sad","angry","disgusting","disappointing","disappointed","fail","failed","failure","fear","frightening","annoy","annoying","bitter","bore","boring","broken","brutal","clumsy","cold","confuse","confused","confusing","corrupt","coward","cruel","damage","damaged","danger","dangerous","dark","depress","depressed","depression","destroy","destroyed","disaster","disease","dislike","doubt","dread","dull","dump","dying","evil","explode","fierce","filthy","fool","foolish","force","fraud","grief","grim","gross","guilt","guilty","harm","harsh","helpless","horror","hostile","hurt","ill","inferior","injure","insult","jail","jealous","kill","killer","lack","lame","liar","lie","loss","lost","lousy","mad","malice","menace","misery","mistake","mock","murder","nasty","negative","neglect","never","nightmare","nobody","noise","nuisance","offend","pain","painful","panic","pathetic","penalty","pessimistic","plague","poison","pollute","prison","problem","protest","punish","rage","refuse","reject","revenge","rotten","rude","ruin","scare","scary","severe","shame","shock","sick","silly","slave","sorrow","sorry","stale","stupid","suffer","suffering","terrible","terrified","threat","toxic","tragic","trouble","ugly","unfair","unhappy","upset","useless","victim","violence","violent","vulgar","war","weak","weakness","weapon","wicked","worry","worse","worst","worthless","wound","wrong","yell"])
const INTENSIFIERS = new Set(["very","really","extremely","incredibly","absolutely","totally","completely","highly","deeply","truly","utterly","so","quite","rather","remarkably"])
const NEGATORS = new Set(["not","no","never","neither","nobody","nothing","nowhere","nor","cannot","cant","dont","doesnt","didnt","isnt","wasnt","werent","havent","hasnt","hadnt","wont","wouldnt","shouldnt","couldnt"])

function loadExample() {
  text.value = "This product is absolutely amazing! The quality is excellent and I love the design. However, the delivery was quite slow and the packaging was damaged. Overall, I'm very happy with my purchase and would definitely recommend it to friends. The customer service was helpful and responsive. Great value for the price!"
}

function analyze() {
  const t = text.value.trim().toLowerCase()
  if (!t) return alert('Enter some text!')
  const words = t.split(/[^a-z']+/).filter(w => w.length > 1)
  let posScore = 0, negScore = 0, neuCount = 0
  let negator = false
  const ws = []
  words.forEach(w => {
    if (NEGATORS.has(w)) { negator = true; return }
    if (INTENSIFIERS.has(w)) { negator = false; return }
    let s = 0
    if (POS_WORDS.has(w)) s = 1
    else if (NEG_WORDS.has(w)) s = -1
    if (negator && s !== 0) { s = -s; negator = false }
    if (s > 0) posScore += s
    else if (s < 0) negScore += Math.abs(s)
    else { neuCount++; if (!NEGATORS.has(w) && !INTENSIFIERS.has(w)) s = 0 }
    ws.push({ word: w, score: s })
  })
  const total = posScore + negScore + neuCount
  const pp = total > 0 ? Math.round(posScore / total * 100) : 0
  const np = total > 0 ? Math.round(negScore / total * 100) : 0
  const nup = Math.max(0, 100 - pp - np)
  const overall = posScore - negScore
  const s = overall > 2 ? 'positive' : overall < -2 ? 'negative' : 'neutral'
  posPct.value = pp
  negPct.value = np
  neuPct.value = nup
  sentimentEmoji.value = { positive: '😊', negative: '😠', neutral: '😐' }[s]
  sentimentLabel.value = { positive: 'Positive Sentiment', negative: 'Negative Sentiment', neutral: 'Neutral Sentiment' }[s]
  sentimentColor.value = { positive: '#2ecc71', negative: '#e74c3c', neutral: '#f39c12' }[s]
  needlePos.value = s === 'neutral' ? 50 : s === 'positive' ? 50 + Math.min(pp, 50) : 50 - Math.min(np, 50)
  wordScores.value = ws
  showOutput.value = true
}
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Dashboard</button>
    </div>
    <h2 style="text-align:center">Sentiment Analysis</h2>
    <textarea v-model="text" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.5" rows="5" placeholder="Enter text to analyze sentiment..."></textarea>
    <div style="display:flex;gap:10px;margin:10px 0">
      <button @click="analyze">Analyze</button>
      <button @click="loadExample">Load Example</button>
    </div>
    <div v-if="showOutput">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:5px">
        <span>Negative</span><span>Neutral</span><span>Positive</span>
      </div>
      <div style="height:30px;border-radius:15px;background:linear-gradient(to right,#e74c3c,#f39c12,#2ecc71);position:relative;margin:15px 0">
        <div :style="{ width: '4px', height: '40px', background: '#fff', border: '2px solid #333', position: 'absolute', top: '-5px', borderRadius: '2px', transition: 'left .5s', left: needlePos + '%' }"></div>
      </div>
      <div style="text-align:center;padding:20px;background:#f8f9fa;border-radius:8px;margin:15px 0">
        <div style="font-size:60px;margin:10px 0">{{ sentimentEmoji }}</div>
        <div :style="{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: sentimentColor }">{{ sentimentLabel }}</div>
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
