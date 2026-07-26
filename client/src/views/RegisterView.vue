<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword, passwordStrength } from '../utils/helpers'
import api from '../api'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', email: '', password: '', phone: '', name: '', nik: '', birthplace: '', birthdate: '', height: '', address: '' })
const error = ref('')
const success = ref('')
const loading = ref(false)
const touched = ref({ username: false, email: false, password: false })
const fieldErrors = ref({ username: '', email: '', password: [] })

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
    fieldErrors.value.username = form.value.username ? '' : 'Username harus diisi'
  }
  if (field === 'email') {
    fieldErrors.value.email = validateEmail(form.value.email)
  }
  if (field === 'password') {
    fieldErrors.value.password = form.value.password ? validatePassword(form.value.password) : []
  }
}

function inputClass(field) {
  const hasError = touched.value[field] && (
    (field === 'username' && fieldErrors.value.username) ||
    (field === 'email' && fieldErrors.value.email) ||
    (field === 'password' && fieldErrors.value.password.length)
  )
  return ['input', hasError ? 'input-error' : '']
}

async function register() {
  error.value = ''
  success.value = ''
  validateField('username')
  validateField('email')
  validateField('password')
  if (fieldErrors.value.username || fieldErrors.value.email || fieldErrors.value.password.length) return
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
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:520px">
      <h2 style="text-align:center;margin-bottom:20px;color:#fff;font-size:1.4rem">Daftar</h2>
      <div v-if="error" class="flash flash-error">{{ error }}</div>
      <div v-if="success" class="flash flash-success">{{ success }}</div>
      <form @submit.prevent="register">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <div>
            <input v-model="form.username" placeholder="Username *" required :class="inputClass('username')" @focus="touched.username = true" @input="validateField('username')" @blur="validateField('username')" />
            <div v-if="touched.username && fieldErrors.username" style="color:var(--accent-red);font-size:11px;margin-top:2px">{{ fieldErrors.username }}</div>
          </div>
          <div>
            <input v-model="form.email" type="email" placeholder="Email *" required :class="inputClass('email')" @focus="touched.email = true" @input="validateField('email')" @blur="validateField('email')" />
            <div v-if="touched.email && fieldErrors.email" style="color:var(--accent-red);font-size:11px;margin-top:2px">{{ fieldErrors.email }}</div>
          </div>
          <div style="grid-column:span 2">
            <input v-model="form.password" type="password" placeholder="Password *" required :class="inputClass('password')" @focus="touched.password = true" @input="validateField('password')" @blur="validateField('password')" />
            <div v-if="form.password" style="margin-top:6px">
              <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden">
                <div :style="{height:'100%',width:pwProgress+'%',background:pwStrength.color,borderRadius:'3px',transition:'width .3s,background .3s'}"></div>
              </div>
              <div :style="{fontSize:'11px',color:pwStrength.color,marginTop:'2px'}">{{ pwStrength.label }}</div>
            </div>
            <div v-if="form.password" style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:2px">
              <div v-for="rule in pwRules" :key="rule.label" :style="{fontSize:'11px',color:rule.met ? '#2ecc71' : 'var(--text-muted)',display:'flex',alignItems:'center',gap:'4px'}">
                <span>{{ rule.met ? '\u2713' : '\u25CB' }}</span> {{ rule.label }}
              </div>
            </div>
            <div v-if="touched.password && fieldErrors.password.length" style="color:var(--accent-red);font-size:11px;margin-top:2px">{{ fieldErrors.password.join('. ') }}</div>
          </div>
          <input v-model="form.phone" placeholder="Telepon" class="input" />
          <input v-model="form.name" placeholder="Nama Lengkap" class="input" />
          <input v-model="form.nik" placeholder="NIK" class="input" />
          <input v-model="form.birthplace" placeholder="Tempat Lahir" class="input" />
          <input v-model="form.birthdate" type="date" class="input" />
          <input v-model="form.height" type="number" placeholder="Tinggi (cm)" class="input" />
          <input v-model="form.address" placeholder="Alamat" class="input" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-green btn-block">
          {{ loading ? 'Mendaftar...' : 'Daftar' }}
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;color:var(--text-secondary)">
        Sudah punya akun? <router-link to="/login">Masuk</router-link>
      </p>
    </div>
  </div>
</template>
