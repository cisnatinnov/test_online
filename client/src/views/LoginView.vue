<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { validateEmail } from '../utils/helpers'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const fieldErrors = ref({ username: '', password: '' })
const loading = ref(false)
const touched = ref({ username: false, password: false })

const isEmail = computed(() => form.value.username.includes('@'))

function validateField(field) {
  touched.value[field] = true
  if (field === 'username') {
    if (!form.value.username) {
      fieldErrors.value.username = 'Username atau email harus diisi'
    } else if (isEmail.value) {
      fieldErrors.value.username = validateEmail(form.value.username)
    } else {
      fieldErrors.value.username = ''
    }
  }
  if (field === 'password') {
    if (!form.value.password) {
      fieldErrors.value.password = 'Password harus diisi'
    } else if (form.value.password.length < 8) {
      fieldErrors.value.password = 'Password minimal 8 karakter'
    } else {
      fieldErrors.value.password = ''
    }
  }
}

async function login() {
  error.value = ''
  fieldErrors.value = { username: '', password: '' }
  validateField('username')
  validateField('password')
  if (fieldErrors.value.username || fieldErrors.value.password) return
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
    <div v-if="error" style="color:#e74c3c;margin-bottom:12px;padding:10px;background:#fdecea;border-radius:4px">{{ error }}</div>
    <form @submit.prevent="login">
      <div style="margin-bottom:12px">
        <input
          v-model="form.username"
          placeholder="Username atau Email"
          required
          :style="{width:'100%',padding:'10px',border:'1px solid '+(touched.username && fieldErrors.username ? '#e74c3c' : '#ccc'),borderRadius:'4px',boxSizing:'border-box'}"
          @blur="validateField('username')"
          @input="touched.username && validateField('username')"
        />
        <div v-if="touched.username && fieldErrors.username" style="color:#e74c3c;font-size:12px;margin-top:4px">{{ fieldErrors.username }}</div>
      </div>
      <div style="margin-bottom:12px">
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          required
          :style="{width:'100%',padding:'10px',border:'1px solid '+(touched.password && fieldErrors.password ? '#e74c3c' : '#ccc'),borderRadius:'4px',boxSizing:'border-box'}"
          @blur="validateField('password')"
          @input="touched.password && validateField('password')"
        />
        <div v-if="touched.password && fieldErrors.password" style="color:#e74c3c;font-size:12px;margin-top:4px">{{ fieldErrors.password }}</div>
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
