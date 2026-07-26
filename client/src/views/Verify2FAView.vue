<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()

const code = ref('')
const error = ref('')
const loading = ref(false)
const sentChannel = ref('')
const fallbackCode = ref('')

async function sendCode() {
  error.value = ''
  fallbackCode.value = ''
  try {
    const { data: res } = await api.post('/auth/send-2fa', { tempToken: auth.tempToken, channel: 'email' })
    sentChannel.value = res.data.channel
    if (res.data.channel === 'console' && res.data.code) {
      fallbackCode.value = res.data.code
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal mengirim kode'
  }
}

onMounted(async () => {
  if (!auth.tempToken) { router.push('/login'); return }
  await sendCode()
})

async function verify() {
  error.value = ''
  loading.value = true
  try {
    const { data: res } = await api.post('/auth/verify-2fa', { tempToken: auth.tempToken, code: code.value })
    auth.clearTemp2FA()
    auth.setAuth(res.data.token, res.data.user)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Kode tidak valid'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:400px">
      <h2 style="text-align:center;margin-bottom:20px;color:#fff;font-size:1.4rem">Verifikasi 2FA</h2>
      <p style="text-align:center;margin-bottom:16px;color:var(--text-secondary)" v-if="sentChannel">Kode dikirim ke {{ sentChannel }}</p>
      <div v-if="fallbackCode" style="background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.4);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;text-align:center">
        <p style="margin:0 0 4px;color:var(--accent-yellow);font-weight:bold">Email gagal dikirim. Gunakan kode berikut:</p>
        <p style="margin:0;font-size:24px;letter-spacing:5px;font-weight:bold;color:var(--accent-yellow)">{{ fallbackCode }}</p>
      </div>
      <div v-if="error" class="flash flash-error">{{ error }}</div>
      <form @submit.prevent="verify">
        <div style="margin-bottom:16px">
          <input v-model="code" placeholder="Masukkan kode 6 digit" maxlength="6" required class="input" style="text-align:center;font-size:18px;letter-spacing:4px" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-green btn-block">
          {{ loading ? 'Memverifikasi...' : 'Verifikasi' }}
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;color:var(--text-secondary)">
        <a href="#" @click.prevent="router.push('/login')">Kembali ke login</a>
      </p>
    </div>
  </div>
</template>
