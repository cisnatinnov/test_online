<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const logHtml = ref('')
const hp = ref(100)
const gold = ref(0)
const lvl = ref(1)
const actions = ref([])

let S = { hp: 100, maxHp: 100, gold: 0, lvl: 1, exp: 0, atk: 10, def: 5, room: 0, weapon: null, armor: null }
const M = [
  { id: 'start', text: 'You wake in a dark dungeon. A cold wind blows. You hear growling nearby.', actions: [{ text: 'Explore the corridor', go: 'corridor' }, { text: 'Search the room', go: 'search_start' }] },
  { id: 'search_start', text: 'You find a rusty dagger and a small health potion.', actions: [{ effect() { S.atk += 5; S.weapon = 'Rusty Dagger' }, text: 'Take dagger', go: 'corridor' }, { effect() { S.hp = Math.min(S.hp + 25, S.maxHp) }, text: 'Drink potion', go: 'corridor' }] },
  { id: 'corridor', text: 'A long corridor stretches ahead. A goblin blocks the path!', actions: [{ text: 'Fight!', go: 'goblin_fight' }, { text: 'Sneak past', go: 'sneak_goblin' }] },
  { id: 'sneak_goblin', text: 'You carefully tiptoe past. The goblin doesn\'t notice!', effect() { S.gold += 10 }, actions: [{ text: 'Continue', go: 'treasure_room' }] },
  { id: 'goblin_fight', text: 'The goblin snarls and attacks!', actions: [{ text: 'Attack!', effect() { S.hp -= Math.floor(Math.random() * 15) + 5; if (S.hp <= 0) S.hp = 0; S.exp += 20 }, go: 'goblin_win' }, { text: 'Run away', effect() { S.hp -= 10 }, go: 'corridor2' }] },
  { id: 'goblin_win', text: 'The goblin falls! You find 20 gold on its body.', effect() { S.gold += 20; if (S.exp >= S.lvl * 50) { S.lvl++; S.atk += 3; S.def += 2; S.maxHp += 15; S.hp = S.maxHp } }, actions: [{ text: 'Continue deeper', go: 'treasure_room' }] },
  { id: 'corridor2', text: 'You stumble back, wounded but alive. Another path leads forward.', actions: [{ text: 'Press on', go: 'treasure_room' }] },
  { id: 'treasure_room', text: 'A grand room with a treasure chest! But a skeleton guard stands watch.', actions: [{ text: 'Fight the skeleton', go: 'skeleton_fight' }, { text: 'Try to grab chest', go: 'grab_chest' }] },
  { id: 'skeleton_fight', text: 'The skeleton raises its sword!', actions: [{ text: 'Strike!', effect() { S.hp -= Math.max(1, 15 - S.def); if (S.hp <= 0) S.hp = 0; S.exp += 40; S.gold += 30 }, go: 'skeleton_win' }, { text: 'Flee', effect() { S.hp -= 8 }, go: 'final_door' }] },
  { id: 'skeleton_win', text: 'You shatter the skeleton! Inside the chest: gold and armor!', effect() { S.armor = 'Bone Armor'; S.def += 5 }, actions: [{ text: 'Continue', go: 'final_door' }] },
  { id: 'grab_chest', text: 'You lunge for the chest. The skeleton strikes you!', effect() { S.hp -= 25; S.gold += 15 }, actions: [{ text: 'Keep going', go: 'final_door' }] },
  { id: 'final_door', text: 'A massive door stands before you. This is the dungeon boss: a DRAGON!', actions: [{ text: 'Fight the dragon!', go: 'dragon_fight' }, { text: 'Try to negotiate', go: 'negotiate' }] },
  { id: 'negotiate', text: 'The dragon laughs. \'Brave or foolish? I\'ll spare you for 50 gold.\'', actions: [{ text: 'Pay 50 gold', condition: () => S.gold >= 50, effect() { S.gold -= 50 }, go: 'dragon_deal' }, { text: 'Refuse and fight', go: 'dragon_fight' }] },
  { id: 'dragon_deal', text: 'The dragon lets you pass. You escape the dungeon alive!', actions: [{ text: 'Victory!', go: 'victory' }] },
  { id: 'dragon_fight', text: 'The dragon breathes fire! This is your final battle!', actions: [{ text: 'All-out attack!', effect() { S.hp -= Math.max(1, 30 - S.def); if (S.hp <= 0) S.hp = 0; S.exp += 100; S.gold += 100 }, go: 'dragon_win' }, { text: 'Use potion', effect() { S.hp = Math.min(S.hp + 40, S.maxHp); S.hp -= 20 }, go: 'dragon_fight2' }] },
  { id: 'dragon_fight2', text: 'The dragon lunges again!', actions: [{ text: 'Strike!', effect() { S.hp -= Math.max(1, 25 - S.def); if (S.hp <= 0) S.hp = 0; else { S.exp += 100; S.gold += 100 } }, go: 'dragon_win' }] },
  { id: 'dragon_win', text: 'The dragon falls! You are the hero of the dungeon!', actions: [{ text: 'Victory!', go: 'victory' }] },
  { id: 'victory', text: 'Congratulations! You conquered the dungeon!', actions: [{ text: 'Play Again', go: 'start' }] },
]

function addLog(html) {
  logHtml.value += '<p>' + html + '</p>'
  nextTick(() => { const el = document.getElementById('raLog'); if (el) el.scrollTop = el.scrollHeight })
}

function updateStats() {
  hp.value = S.hp; gold.value = S.gold; lvl.value = S.lvl
}

function renderScene(scene) {
  addLog('<hr><em>' + scene.text.replace(/\n/g, '<br>') + '</em>')
  actions.value = scene.actions.map(a => ({
    ...a,
    disabled: a.condition ? !a.condition() : false,
  }))
  updateStats()
}

function doAction(a) {
  if (a.effect) a.effect()
  updateStats()
  if (S.hp <= 0) {
    addLog('<br><strong style=\'color:#e74c3c\'>You have died! Game Over.</strong>')
    actions.value = []
    return
  }
  const next = M.find(m => m.id === a.go)
  if (next) renderScene(next)
}

function reset() {
  S = { hp: 100, maxHp: 100, gold: 0, lvl: 1, exp: 0, atk: 10, def: 5, room: 0, weapon: null, armor: null }
  logHtml.value = ''; renderScene(M[0]); updateStats()
}

reset()
</script>

<template>
  <div style="max-width:650px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="reset()">New Game</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Roleplay Adventure</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0">
      <div style="background:#2a2a3e;padding:10px;border-radius:6px;text-align:center">
        <h4 style="margin:0;font-size:12px;color:#aaa">HP</h4>
        <div style="font-size:22px;font-weight:bold" :style="{ color: hp <= 30 ? '#e74c3c' : '#2ecc71' }">{{ hp }}</div>
      </div>
      <div style="background:#2a2a3e;padding:10px;border-radius:6px;text-align:center">
        <h4 style="margin:0;font-size:12px;color:#aaa">GOLD</h4>
        <div style="font-size:22px;font-weight:bold;color:#f1c40f">{{ gold }}</div>
      </div>
      <div style="background:#2a2a3e;padding:10px;border-radius:6px;text-align:center">
        <h4 style="margin:0;font-size:12px;color:#aaa">LVL</h4>
        <div style="font-size:22px;font-weight:bold;color:#007BFF">{{ lvl }}</div>
      </div>
    </div>
    <div id="raLog" style="height:300px;overflow-y:auto;background:#1a1a2e;color:#c8d6e5;padding:15px;border-radius:8px;margin:15px 0;font-size:14px;line-height:1.6" v-html="logHtml"></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
      <button v-for="(a, i) in actions" :key="i" :disabled="a.disabled" @click="doAction(a)"
        style="flex:1;min-width:120px">
        {{ a.text }}
      </button>
    </div>
  </div>
</template>
