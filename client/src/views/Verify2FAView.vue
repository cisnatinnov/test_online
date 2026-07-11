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
  <div style="max-width:400px;margin:80px auto;padding:24px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <h2 style="text-align:center;margin-bottom:16px">Verifikasi 2FA</h2>
    <p style="text-align:center;margin-bottom:12px;color:#666" v-if="sentChannel">Kode dikirim ke {{ sentChannel }}</p>
    <div v-if="fallbackCode" style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:12px;margin-bottom:12px;text-align:center">
      <p style="margin:0 0 4px;color:#856404;font-weight:bold">Email gagal dikirim. Gunakan kode berikut:</p>
      <p style="margin:0;font-size:24px;letter-spacing:5px;font-weight:bold;color:#856404">{{ fallbackCode }}</p>
    </div>
    <div v-if="error" style="color:red;margin-bottom:12px">{{ error }}</div>
    <form @submit.prevent="verify">
      <div style="margin-bottom:12px">
        <input v-model="code" placeholder="Masukkan kode 6 digit" maxlength="6" required style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;text-align:center;font-size:18px;letter-spacing:4px" />
      </div>
      <button type="submit" :disabled="loading" style="width:100%;padding:10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">
        {{ loading ? 'Memverifikasi...' : 'Verifikasi' }}
      </button>
    </form>
    <p style="text-align:center;margin-top:12px">
      <a href="#" @click.prevent="router.push('/login')">Kembali ke login</a>
    </p>
  </div>
</template>
