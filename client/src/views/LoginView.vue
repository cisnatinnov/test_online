<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    const { data: res } = await api.post('/auth/login', form.value)
    const d = res.data
    if (d.require2fa) {
      auth.setTemp2FA(d.tempToken, d.channels)
      router.push('/verify-2fa')
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width:400px;margin:80px auto;padding:24px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <h2 style="text-align:center;margin-bottom:16px">Login</h2>
    <div v-if="error" style="color:red;margin-bottom:12px">{{ error }}</div>
    <form @submit.prevent="login">
      <div style="margin-bottom:12px">
        <input v-model="form.username" placeholder="Username atau Email" required style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px" />
      </div>
      <div style="margin-bottom:12px">
        <input v-model="form.password" type="password" placeholder="Password" required style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px" />
      </div>
      <button type="submit" :disabled="loading" style="width:100%;padding:10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">
        {{ loading ? 'Masuk...' : 'Masuk' }}
      </button>
    </form>
    <p style="text-align:center;margin-top:12px">
      Belum punya akun? <router-link to="/register">Daftar</router-link>
    </p>
  </div>
</template>
