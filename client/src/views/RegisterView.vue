<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword, passwordStrength } from '../utils/helpers'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', email: '', password: '', phone: '', name: '', nik: '', gender: '', birthplace: '', birthdate: '', height: '', address: '' })
const error = ref('')
const success = ref('')
const loading = ref(false)
const touched = ref({ username: false, email: false, password: false })
const fieldErrors = ref({ username: '', email: '', password: [] })
const showPassword = ref(false)
const usernameInput = ref(null)

onMounted(() => { usernameInput.value?.focus() })

const pwStrength = computed(() => passwordStrength(form.value.password, t))
const pwProgress = computed(() => (pwStrength.value.score / 5) * 100)

const pwRules = computed(() => {
  const pw = form.value.password
  return [
    { label: t('validation.minChars'), met: pw.length >= 8 },
    { label: t('validation.uppercase'), met: /[A-Z]/.test(pw) },
    { label: t('validation.lowercase'), met: /[a-z]/.test(pw) },
    { label: t('validation.digit'), met: /[0-9]/.test(pw) },
    { label: t('validation.symbol'), met: /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ]
})

function validateField(field) {
  touched.value[field] = true
  if (field === 'username') {
    fieldErrors.value.username = form.value.username ? '' : t('validation.usernameRequired')
  }
  if (field === 'email') {
    fieldErrors.value.email = validateEmail(form.value.email, t)
  }
  if (field === 'password') {
    fieldErrors.value.password = form.value.password ? validatePassword(form.value.password, t) : []
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

watch(locale, () => {
  if (touched.value.username) validateField('username')
  if (touched.value.email) validateField('email')
  if (touched.value.password) validateField('password')
})

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
    success.value = t('flash.registrationSuccess')
    setTimeout(() => router.push('/'), 1000)
  } catch (e) {
    error.value = e.response?.data?.error || t('flash.registrationFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:520px">
      <div style="display:flex;justify-content:center;margin-bottom:12px"><LanguageSwitcher /></div>
      <h2 style="text-align:center;margin-bottom:20px;color:#fff;font-size:1.4rem">{{ t('auth.registerTitle') }}</h2>
      <div v-if="error" class="flash flash-error">{{ error }}</div>
      <div v-if="success" class="flash flash-success">{{ success }}</div>
      <form @submit.prevent="register">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <div>
            <input ref="usernameInput" v-model="form.username" :placeholder="t('auth.username') + ' *'" required :class="inputClass('username')" @focus="touched.username = true" @input="validateField('username')" @blur="validateField('username')" />
            <div v-if="touched.username && fieldErrors.username" style="color:var(--accent-red);font-size:11px;margin-top:2px">{{ fieldErrors.username }}</div>
          </div>
          <div>
            <input v-model="form.email" type="email" :placeholder="t('auth.email') + ' *'" required :class="inputClass('email')" @focus="touched.email = true" @input="validateField('email')" @blur="validateField('email')" />
            <div v-if="touched.email && fieldErrors.email" style="color:var(--accent-red);font-size:11px;margin-top:2px">{{ fieldErrors.email }}</div>
          </div>
          <div style="grid-column:span 2">
            <div style="position:relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.password') + ' *'"
                required
                class="input password-input"
                :class="inputClass('password')"
                @focus="touched.password = true"
                @input="validateField('password')"
                @blur="validateField('password')"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7" />
                  <path d="M3 3l18 18" />
                  <path d="M9.5 14.5A3 3 0 0 0 14.5 9.5" />
                </svg>
              </button>
            </div>
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
          <input v-model="form.phone" :placeholder="t('auth.phone')" class="input" />
          <input v-model="form.name" :placeholder="t('auth.fullName')" class="input" />
          <input v-model="form.nik" :placeholder="t('auth.nik')" class="input" />
          <select v-model="form.gender" class="input">
            <option value="">{{ t('auth.gender') }}</option>
            <option value="Male">{{ t('auth.male') }}</option>
            <option value="Female">{{ t('auth.female') }}</option>
          </select>
          <input v-model="form.birthplace" :placeholder="t('auth.birthplace')" class="input" />
          <input v-model="form.birthdate" type="date" class="input" />
          <input v-model="form.height" type="number" :placeholder="t('auth.height')" class="input" />
          <input v-model="form.address" :placeholder="t('auth.address')" class="input" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-green btn-block">
          {{ loading ? t('auth.registering') : t('auth.registerBtn') }}
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;color:var(--text-secondary)">
        {{ t('auth.hasAccount') }} <router-link to="/login">{{ t('auth.signin') }}</router-link>
      </p>
    </div>
  </div>
</template>
