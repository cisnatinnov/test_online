<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword, passwordStrength } from '../utils/helpers'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const fieldErrors = ref({ username: '', password: [] })
const loading = ref(false)
const touched = ref({ username: false, password: false })

const isEmail = computed(() => form.value.username.includes('@'))
const pwStrength = computed(() => passwordStrength(form.value.password))
const pwProgress = computed(() => (pwStrength.value.score / 5) * 100)

const pwRules = computed(() => {
  const pw = form.value.password
  return [
    { label: 'Minimal 8 karakter', met: pw.length >= 8 },
    { label: 'Minimal 1 huruf kapital', met: /[A-Z]/.test(pw) },
    { label: 'Minimal 1 huruf kecil', met: /[a-z]/.test(pw) },
    { label: 'Minimal 1 angka', met: /[0-9]/.test(pw) },
    { label: 'Minimal 1 simbol', met: /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ]
})

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
      fieldErrors.value.password = ['Password harus diisi']
    } else {
      fieldErrors.value.password = validatePassword(form.value.password)
    }
  }
}

async function login() {
  error.value = ''
  fieldErrors.value = { username: '', password: [] }
  validateField('username')
  validateField('password')
  if (fieldErrors.value.username || fieldErrors.value.password.length) return
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
          @focus="touched.username = true"
          @input="validateField('username')"
          @blur="validateField('username')"
        />
        <div v-if="touched.username && fieldErrors.username" style="color:#e74c3c;font-size:12px;margin-top:4px">{{ fieldErrors.username }}</div>
      </div>
      <div style="margin-bottom:12px">
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          required
          :style="{width:'100%',padding:'10px',border:'1px solid '+(touched.password && fieldErrors.password.length ? '#e74c3c' : '#ccc'),borderRadius:'4px',boxSizing:'border-box'}"
          @focus="touched.password = true"
          @input="validateField('password')"
          @blur="validateField('password')"
        />
        <div v-if="form.password" style="margin-top:6px">
          <div style="height:6px;background:#eee;border-radius:3px;overflow:hidden">
            <div :style="{height:'100%',width:pwProgress+'%',background:pwStrength.color,borderRadius:'3px',transition:'width .3s,background .3s'}"></div>
          </div>
          <div :style="{fontSize:'11px',color:pwStrength.color,marginTop:'2px'}">{{ pwStrength.label }}</div>
        </div>
        <div v-if="form.password" style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:2px">
          <div v-for="rule in pwRules" :key="rule.label" :style="{fontSize:'11px',color:rule.met ? '#2ecc71' : '#999',display:'flex',alignItems:'center',gap:'4px'}">
            <span>{{ rule.met ? '\u2713' : '\u25CB' }}</span> {{ rule.label }}
          </div>
        </div>
        <div v-if="touched.password && fieldErrors.password.length" style="color:#e74c3c;font-size:11px;margin-top:4px">{{ fieldErrors.password.join('. ') }}</div>
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
