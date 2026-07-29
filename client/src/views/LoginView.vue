<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword, passwordStrength } from '../utils/helpers'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const fieldErrors = ref({ username: '', password: [] })
const loading = ref(false)
const touched = ref({ username: false, password: false })
const showPassword = ref(false)

const isEmail = computed(() => form.value.username.includes('@'))
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
    if (!form.value.username) {
      fieldErrors.value.username = t('validation.usernameRequired')
    } else if (isEmail.value) {
      fieldErrors.value.username = validateEmail(form.value.username, t)
    } else {
      fieldErrors.value.username = ''
    }
  }
  if (field === 'password') {
    if (!form.value.password) {
      fieldErrors.value.password = [t('validation.passwordRequired')]
    } else {
      fieldErrors.value.password = validatePassword(form.value.password, t)
    }
  }
}

watch(locale, () => {
  if (touched.value.username) validateField('username')
  if (touched.value.password) validateField('password')
})

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
    } else if (d.token) {
      auth.setAuth(d.token, d.user)
      router.push('/')
    }
  } catch (e) {
    error.value = e.response?.data?.error || t('flash.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:400px">
      <div style="display:flex;justify-content:center;margin-bottom:12px"><LanguageSwitcher /></div>
      <h2 style="text-align:center;margin-bottom:20px;color:#fff;font-size:1.4rem">{{ t('auth.loginTitle') }}</h2>
      <div v-if="error" class="flash flash-error">{{ error }}</div>
      <form @submit.prevent="login">
        <div style="margin-bottom:16px">
          <input
            v-model="form.username"
            :placeholder="t('auth.usernameOrEmail')"
            required
            :class="['input', touched.username && fieldErrors.username ? 'input-error' : '']"
            @focus="touched.username = true"
            @input="validateField('username')"
            @blur="validateField('username')"
          />
          <div v-if="touched.username && fieldErrors.username" style="color:var(--accent-red);font-size:12px;margin-top:4px">{{ fieldErrors.username }}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="position:relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.password')"
              required
              class="input password-input"
              :class="touched.password && fieldErrors.password.length ? 'input-error' : ''"
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
          <div v-if="form.password" style="margin-top:8px">
            <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden">
              <div :style="{height:'100%',width:pwProgress+'%',background:pwStrength.color,borderRadius:'3px',transition:'width .3s,background .3s'}"></div>
            </div>
            <div :style="{fontSize:'11px',color:pwStrength.color,marginTop:'4px'}">{{ pwStrength.label }}</div>
          </div>
          <div v-if="form.password" style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
            <div v-for="rule in pwRules" :key="rule.label" :style="{fontSize:'11px',color:rule.met ? '#2ecc71' : 'var(--text-muted)',display:'flex',alignItems:'center',gap:'4px'}">
              <span>{{ rule.met ? '\u2713' : '\u25CB' }}</span> {{ rule.label }}
            </div>
          </div>
          <div v-if="touched.password && fieldErrors.password.length" style="color:var(--accent-red);font-size:11px;margin-top:4px">{{ fieldErrors.password.join('. ') }}</div>
        </div>
        <button type="submit" :disabled="loading" class="btn btn-green btn-block">
          {{ loading ? t('auth.loggingIn') : t('auth.loginBtn') }}
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;color:var(--text-secondary)">
        {{ t('auth.noAccount') }} <router-link to="/register">{{ t('auth.signup') }}</router-link>
      </p>
    </div>
  </div>
</template>
