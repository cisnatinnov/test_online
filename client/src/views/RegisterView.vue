<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { validatePassword } from '../utils/helpers'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', email: '', password: '', phone: '', name: '', nik: '', birthplace: '', birthdate: '', height: '', address: '' })
const error = ref('')
const success = ref('')
const loading = ref(false)

async function register() {
  error.value = ''
  success.value = ''
  const pwErrors = validatePassword(form.value.password)
  if (pwErrors.length) { error.value = pwErrors.join('. '); return }
  loading.value = true
  try {
    const { data: res } = await api.post('/auth/register', form.value)
    auth.setAuth(res.data.token, res.data.user)
    success.value = 'Registrasi berhasil!'
    setTimeout(() => router.push('/'), 1000)
  } catch (e) {
    error.value = e.response?.data?.error || 'Registrasi gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width:500px;margin:40px auto;padding:24px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <h2 style="text-align:center;margin-bottom:16px">Daftar</h2>
    <div v-if="error" style="color:red;margin-bottom:12px">{{ error }}</div>
    <div v-if="success" style="color:green;margin-bottom:12px">{{ success }}</div>
    <form @submit.prevent="register">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <input v-model="form.username" placeholder="Username *" required style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.email" type="email" placeholder="Email *" required style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.password" type="password" placeholder="Password *" required style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.phone" placeholder="Telepon" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.name" placeholder="Nama Lengkap" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.nik" placeholder="NIK" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.birthplace" placeholder="Tempat Lahir" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.birthdate" type="date" placeholder="Tanggal Lahir" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.height" type="number" placeholder="Tinggi (cm)" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
        <input v-model="form.address" placeholder="Alamat" style="padding:10px;border:1px solid #ccc;border-radius:4px" />
      </div>
      <button type="submit" :disabled="loading" style="width:100%;padding:10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">
        {{ loading ? 'Mendaftar...' : 'Daftar' }}
      </button>
    </form>
    <p style="text-align:center;margin-top:12px">
      Sudah punya akun? <router-link to="/login">Masuk</router-link>
    </p>
  </div>
</template>
