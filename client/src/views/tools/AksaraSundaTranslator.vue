<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toAksaraSunda } from '../../utils/aksaraSunda'

const router = useRouter()
const input = ref('')
const output = ref('')
const error = ref('')
const showResult = ref(false)
const copied = ref(false)

function loadExample() {
  input.value = 'Basa Sunda teh basa anu dipake ku urang Sunda, anu kaasup kana rumpun basa Austronesia.'
  translate()
}

function translate() {
  error.value = ''
  copied.value = false
  if (!input.value.trim()) {
    error.value = 'Enter some text to translate!'
    showResult.value = false
    return
  }
  const res = toAksaraSunda(input.value)
  if (res.status === 400) {
    error.value = res.message
    showResult.value = false
    return
  }
  output.value = res.data.result
  showResult.value = true
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch (e) {
    alert('Copy failed!')
  }
}
</script>

<template>
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="link-btn" @click="router.push('/tools')">Back</button>
      <button class="link-btn" @click="router.push('/')">Home</button>
    </div>
    <h2 style="text-align:center">Aksara Sunda Translator</h2>
    <p style="text-align:center;color:#888;font-size:13px;margin:6px 0 16px">Convert Latin text to Aksara Sunda (Sundanese script).</p>
    <textarea v-model="input" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.5" rows="5" placeholder="Type Indonesian / Sundanese text in Latin script, e.g. 'aku cinta sunda'"></textarea>
    <div style="display:flex;gap:10px;margin:10px 0">
      <button @click="translate">Translate</button>
      <button @click="loadExample">Load Example</button>
    </div>
    <p v-if="error" style="color:#e74c3c;font-size:13px">{{ error }}</p>
    <div v-if="showResult" style="background:#f8f9fa;border-radius:8px;margin:15px 0;padding:20px;text-align:center">
      <h4 style="margin:0 0 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Aksara Sunda</h4>
      <div style="font-size:34px;line-height:1.6;word-break:break-word;color:#1a1a2e" dir="ltr">{{ output }}</div>
      <div style="margin-top:16px">
        <button @click="copyResult" style="padding:6px 14px;border:none;border-radius:6px;background:#007BFF;color:#fff;font-size:13px;cursor:pointer">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>
    <div style="margin-top:20px;padding:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:12px;color:#999;line-height:1.6">
      <strong style="color:#ccc">How it works:</strong>
      Consonants carry the inherent vowel <em>a</em> (ᮊ = ka). Vowel diacritics mark i, u, é, o, e. The pamaéh (᮪) suppresses the inherent vowel after a final consonant, e.g. <em>sunda</em> → ᮞᮥᮔ᮪ᮓ.
    </div>
  </div>
</template>
