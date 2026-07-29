<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const code = ref('')
const error = ref('')
const loading = ref(false)
const sentChannel = ref('')
const codeInput = ref(null)

onMounted(() => { codeInput.value?.focus() })

async function sendCode() {
  error.value = ''
  try {
    const { data: res } = await api.post('/auth/send-2fa', { tempToken: auth.tempToken, channel: 'email', lang: locale.value })
    sentChannel.value = res.data.channel
  } catch (e) {
    error.value = e.response?.data?.error || t('flash.codeSendFailed')
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
    error.value = e.response?.data?.error || t('flash.invalidCode')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:400px">
      <div style="display:flex;justify-content:center;margin-bottom:12px"><LanguageSwitcher /></div>
      <h2 style="text-align:center;margin-bottom:20px;color:#fff;font-size:1.4rem">{{ t('auth.verification') }}</h2>
      <p style="text-align:center;margin-bottom:16px;color:var(--text-secondary)" v-if="sentChannel">{{ t('auth.codeSentTo') }} {{ sentChannel }}</p>
      <div v-if="error" class="flash flash-error">{{ error }}</div>
      <form @submit.prevent="verify">
        <div style="margin-bottom:16px">
          <input ref="codeInput" v-model="code" :placeholder="t('auth.enterCode')" maxlength="6" required class="input" style="text-align:center;font-size:18px;letter-spacing:4px" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-green btn-block">
          {{ loading ? t('auth.verifying') : t('auth.verify') }}
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;color:var(--text-secondary)">
        <a href="#" @click.prevent="router.push('/login')">{{ t('auth.backToLogin') }}</a>
      </p>
    </div>
  </div>
</template>
