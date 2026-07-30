<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { validateName, validateNik, validateHeight, validateBirthdate, validatePassword, passwordStrength } from '../utils/helpers'
import Sidebar from '../components/Sidebar.vue'
import api from '../api'

const { t, locale } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const identities = ref([])
const loading = ref(true)
const msg = ref('')
const msgType = ref('')
const editingId = ref(null)
const editForm = ref({ name: '', nik: '', height: '', gender: '', birthplace: '', birthdate: '', address: '' })

const identityFields = ['name', 'nik', 'height', 'birthdate']
const validators = { name: validateName, nik: validateNik, height: validateHeight, birthdate: validateBirthdate }
const touched = ref({ name: false, nik: false, height: false, birthdate: false })
const fieldErrors = ref({ name: '', nik: '', height: '', birthdate: '' })

function validateField(field) {
  touched.value[field] = true
  fieldErrors.value[field] = validators[field](editForm.value[field], t)
}

function inputClass(field) {
  return ['input', touched.value[field] && fieldErrors.value[field] ? 'input-error' : '']
}

function resetValidation() {
  identityFields.forEach(f => { touched.value[f] = false; fieldErrors.value[f] = '' })
}

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwMsg = ref('')
const pwMsgType = ref('')
const pwLoading = ref(false)

const pwFields = ['current', 'new', 'confirm']
const pwTouched = ref({ current: false, new: false, confirm: false })
const pwErrors = ref({ current: '', new: [], confirm: '' })

const pwStrength = computed(() => passwordStrength(newPassword.value, t))
const pwProgress = computed(() => (pwStrength.value.score / 5) * 100)
const pwRules = computed(() => {
  const pw = newPassword.value
  return [
    { label: t('validation.minChars'), met: pw.length >= 8 },
    { label: t('validation.uppercase'), met: /[A-Z]/.test(pw) },
    { label: t('validation.lowercase'), met: /[a-z]/.test(pw) },
    { label: t('validation.digit'), met: /[0-9]/.test(pw) },
    { label: t('validation.symbol'), met: /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ]
})

function validatePwField(field) {
  pwTouched.value[field] = true
  if (field === 'current') {
    pwErrors.value.current = currentPassword.value ? '' : t('validation.passwordRequired')
    if (pwTouched.value.new) validatePwField('new')
  }
  if (field === 'new') {
    if (!newPassword.value) {
      pwErrors.value.new = [t('validation.passwordRequired')]
    } else {
      const errors = validatePassword(newPassword.value, t)
      if (!errors.length && currentPassword.value && newPassword.value === currentPassword.value) {
        errors.push(t('validation.passwordUnchanged'))
      }
      pwErrors.value.new = errors
    }
    if (pwTouched.value.confirm) validatePwField('confirm')
  }
  if (field === 'confirm') {
    if (!confirmPassword.value) {
      pwErrors.value.confirm = t('validation.passwordRequired')
    } else {
      pwErrors.value.confirm = confirmPassword.value === newPassword.value ? '' : t('validation.passwordMismatch')
    }
  }
}

function pwInputClass(field) {
  const hasError = pwTouched.value[field] && (
    (field === 'new' && pwErrors.value.new.length) ||
    (field !== 'new' && pwErrors.value[field])
  )
  return ['input', hasError ? 'input-error' : '']
}

watch(locale, () => {
  identityFields.forEach(f => { if (touched.value[f]) validateField(f) })
  pwFields.forEach(f => { if (pwTouched.value[f]) validatePwField(f) })
})

onMounted(async () => {
  await loadIdentities()
  loading.value = false
})

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities?limit=100')
    const list = res?.data?.identities || []
    identities.value = list.filter(i => i.id_user === auth.user?.id)
  } catch (e) { console.error(e) }
}

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 3000) }

function startEdit(id) {
  const idata = identities.value.find(i => i.id === id)
  if (!idata) return
  resetValidation()
  editingId.value = id
  editForm.value = {
    name: idata.name || '',
    nik: idata.nik || '',
    height: idata.height || '',
    gender: idata.gender || '',
    birthplace: idata.birthplace || '',
    birthdate: idata.birthdate || '',
    address: idata.address || '',
  }
}

function cancelEdit() {
  resetValidation()
  editingId.value = null
}

async function saveEdit(id) {
  identityFields.forEach(validateField)
  if (identityFields.some(f => fieldErrors.value[f])) return
  try {
    await api.put(`/identities/${id}`, editForm.value)
    flash('Identity updated', 'success')
    editingId.value = null
    await loadIdentities()
  } catch (e) {
    flash(e.response?.data?.error || 'Failed to update', 'error')
  }
}

async function changePassword() {
  pwMsg.value = ''
  pwFields.forEach(validatePwField)
  if (pwErrors.value.current || pwErrors.value.new.length || pwErrors.value.confirm) return
  pwLoading.value = true
  try {
    await api.post('/auth/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    auth.logout()
    router.push('/login')
  } catch (e) {
    pwMsg.value = e.response?.data?.error || 'Failed to change password'; pwMsgType.value = 'error'
  }
  pwLoading.value = false
}
</script>

<template>
  <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />

  <div class="app-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <header class="top-bar">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h2 class="top-bar-title">{{ t('nav.profile') }}</h2>
      <span class="top-bar-user">{{ auth.user?.username }}</span>
    </header>

    <main class="app-content">
      <div v-if="msg" :class="['flash', msgType === 'success' ? 'flash-success' : 'flash-error']">{{ msg }}</div>

      <div v-if="loading" class="loading-state">{{ t('healthMonitor.loading') }}</div>

      <template v-else>
        <div class="card user-card">
          <div class="user-avatar">{{ auth.user?.username?.charAt(0).toUpperCase() }}</div>
          <div class="user-info">
            <h3>{{ auth.user?.username }}</h3>
            <span class="user-email">{{ auth.user?.email }}</span>
            <span class="user-role">{{ auth.user?.role }}</span>
          </div>
        </div>

        <div class="card" v-for="id in identities" :key="id.id" style="margin-top:16px">
          <div class="card-title-row">
            <h3 class="card-title">{{ id.name }}</h3>
            <button v-if="editingId !== id.id" @click="startEdit(id.id)" class="btn btn-sm btn-edit">Edit</button>
          </div>

          <template v-if="editingId === id.id">
            <div class="edit-form">
              <div class="form-field">
                <label class="field-label">{{ t('auth.fullName') }} *</label>
                <input v-model="editForm.name" :class="inputClass('name')" @focus="touched.name = true" @input="validateField('name')" @blur="validateField('name')" />
                <div v-if="touched.name && fieldErrors.name" class="field-error">{{ fieldErrors.name }}</div>
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.nik') }}</label>
                <input v-model="editForm.nik" :class="inputClass('nik')" @focus="touched.nik = true" @input="validateField('nik')" @blur="validateField('nik')" />
                <div v-if="touched.nik && fieldErrors.nik" class="field-error">{{ fieldErrors.nik }}</div>
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.height') }}</label>
                <input v-model="editForm.height" type="number" :class="inputClass('height')" @focus="touched.height = true" @input="validateField('height')" @blur="validateField('height')" />
                <div v-if="touched.height && fieldErrors.height" class="field-error">{{ fieldErrors.height }}</div>
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.gender') }}</label>
                <select v-model="editForm.gender" class="input">
                  <option value="">{{ t('auth.gender') }}</option>
                  <option value="Male">{{ t('auth.male') }}</option>
                  <option value="Female">{{ t('auth.female') }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.birthplace') }}</label>
                <input v-model="editForm.birthplace" class="input" />
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.birthdate') }}</label>
                <input v-model="editForm.birthdate" type="date" :class="inputClass('birthdate')" @focus="touched.birthdate = true" @input="validateField('birthdate')" @blur="validateField('birthdate')" />
                <div v-if="touched.birthdate && fieldErrors.birthdate" class="field-error">{{ fieldErrors.birthdate }}</div>
              </div>
              <div class="form-field">
                <label class="field-label">{{ t('auth.address') }}</label>
                <input v-model="editForm.address" class="input" />
              </div>
              <div class="form-actions">
                <button @click="saveEdit(id.id)" class="btn btn-primary">Save</button>
                <button @click="cancelEdit" class="btn btn-cancel">Cancel</button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="identity-grid">
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.nik') }}</span>
                <span class="identity-value">{{ id.nik || '-' }}</span>
              </div>
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.gender') }}</span>
                <span class="identity-value">{{ id.gender || '-' }}</span>
              </div>
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.height') }}</span>
                <span class="identity-value">{{ id.height ? id.height + ' cm' : '-' }}</span>
              </div>
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.birthplace') }}</span>
                <span class="identity-value">{{ id.birthplace || '-' }}</span>
              </div>
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.birthdate') }}</span>
                <span class="identity-value">{{ id.birthdate || '-' }}</span>
              </div>
              <div class="identity-item">
                <span class="identity-label">{{ t('auth.address') }}</span>
                <span class="identity-value">{{ id.address || '-' }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="card" style="margin-top:16px">
          <h3 class="card-title">{{ t('auth.password') }}</h3>
          <div v-if="pwMsg" :class="['pw-msg', pwMsgType]">{{ pwMsg }}</div>
          <div class="pw-form">
            <div class="form-field">
              <input v-model="currentPassword" type="password" placeholder="Current password" :class="pwInputClass('current')" @focus="pwTouched.current = true" @input="validatePwField('current')" @blur="validatePwField('current')" />
              <div v-if="pwTouched.current && pwErrors.current" class="field-error">{{ pwErrors.current }}</div>
            </div>
            <div class="form-field">
              <input v-model="newPassword" type="password" placeholder="New password" :class="pwInputClass('new')" @focus="pwTouched.new = true" @input="validatePwField('new')" @blur="validatePwField('new')" />
              <div v-if="newPassword" class="pw-strength">
                <div class="pw-strength-track">
                  <div class="pw-strength-bar" :style="{ width: pwProgress + '%', background: pwStrength.color }"></div>
                </div>
                <div class="pw-strength-label" :style="{ color: pwStrength.color }">{{ pwStrength.label }}</div>
              </div>
              <div v-if="newPassword" class="pw-rules">
                <div v-for="rule in pwRules" :key="rule.label" class="pw-rule" :style="{ color: rule.met ? '#81c784' : '#888' }">
                  <span>{{ rule.met ? '✓' : '○' }}</span> {{ rule.label }}
                </div>
              </div>
              <div v-if="pwTouched.new && pwErrors.new.length" class="field-error">{{ pwErrors.new.join('. ') }}</div>
            </div>
            <div class="form-field">
              <input v-model="confirmPassword" type="password" placeholder="Confirm new password" :class="pwInputClass('confirm')" @focus="pwTouched.confirm = true" @input="validatePwField('confirm')" @blur="validatePwField('confirm')" />
              <div v-if="pwTouched.confirm && pwErrors.confirm" class="field-error">{{ pwErrors.confirm }}</div>
            </div>
            <button @click="changePassword" class="btn btn-primary" :disabled="pwLoading">
              {{ pwLoading ? t('healthMonitor.saving') : 'Change Password' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.08); color: #fff; }

.top-bar-title { font-size: 1.1rem; font-weight: 700; color: #fff; }
.top-bar-user { margin-left: auto; font-size: 13px; color: #999; }

.app-content { padding: 24px; max-width: 700px; margin: 0 auto; }

.loading-state { text-align: center; padding: 40px; color: #888; }

.card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 20px;
}

.card-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #81c784;
  margin: 0;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(76,175,80,0.3);
}

.user-info h3 { font-size: 1.1rem; color: #fff; margin-bottom: 2px; }
.user-email { display: block; font-size: 0.82rem; color: #999; }
.user-role {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(76,175,80,0.15);
  color: #81c784;
}

.identity-grid { display: flex; flex-direction: column; gap: 2px; }
.identity-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.identity-item:last-child { border-bottom: none; }
.identity-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.identity-value { font-size: 0.92rem; color: #e0e0e0; font-weight: 500; }

.edit-form { display: flex; flex-direction: column; gap: 10px; }

.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.field-error { color: #ef5350; font-size: 11px; }

.form-actions { display: flex; gap: 8px; margin-top: 4px; }

.pw-form { display: flex; flex-direction: column; gap: 10px; }
.pw-msg { padding: 8px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; }
.pw-msg.success { background: rgba(76,175,80,0.15); color: #81c784; }
.pw-msg.error { background: rgba(244,67,54,0.15); color: #ef5350; }

.pw-strength { margin-top: 2px; }
.pw-strength-track { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.pw-strength-bar { height: 100%; border-radius: 3px; transition: width 0.3s, background 0.3s; }
.pw-strength-label { font-size: 11px; margin-top: 2px; }
.pw-rules { margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.pw-rule { font-size: 11px; display: flex; align-items: center; gap: 4px; }

.input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  box-sizing: border-box;
}
.input:focus { border-color: #4caf50; }

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}
.btn-sm { padding: 6px 12px; font-size: 0.72rem; }
.btn-primary { background: linear-gradient(135deg, #2e7d32, #66bb6a); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(46,125,50,0.4); }
.btn-edit { background: rgba(76,175,80,0.15); color: #81c784; }
.btn-edit:hover { background: rgba(76,175,80,0.25); }
.btn-cancel { background: rgba(255,255,255,0.08); color: #999; }
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.flash {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.flash-success { background: rgba(76,175,80,0.2); color: #81c784; border: 1px solid rgba(76,175,80,0.3); }
.flash-error { background: rgba(244,67,54,0.2); color: #ef5350; border: 1px solid rgba(244,67,54,0.3); }

@media (max-width: 768px) {
  .app-layout { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .app-content { padding: 16px; }
}
</style>
