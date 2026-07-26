<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import api from '../api'

const auth = useAuthStore()
const router = useRouter()

const identities = ref([])
const users = ref([])
const selectedIdentity = ref(null)
const showNewIdentity = ref(false)
const newIdentity = ref({ nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '', id_user: '' })

const bmiWeight = ref('')
const sugarValue = ref('')
const vitals = ref({ systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' })

const msg = ref('')
const msgType = ref('')

function nav(path) { router.push(path) }
function logout() { auth.logout(); router.push('/login') }

onMounted(async () => {
  await loadIdentities()
  if (auth.user?.role === 'admin') await loadUsers()
})

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities')
    identities.value = res.data
    if (auth.user?.role !== 'admin' && res.data.length > 0) {
      selectedIdentity.value = res.data[0].id
    }
  } catch (e) { console.error(e) }
}

async function loadUsers() {
  try {
    const { data: res } = await api.get('/admin/users')
    users.value = res.data
  } catch (e) { console.error(e) }
}

async function createIdentity() {
  try {
    const payload = { ...newIdentity.value }
    if (auth.user?.role === 'admin' && payload.id_user) {
      payload.id_user = Number(payload.id_user)
    } else {
      delete payload.id_user
    }
    const { data: res } = await api.post('/identities', payload)
    showNewIdentity.value = false
    newIdentity.value = { nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '', id_user: '' }
    await loadIdentities()
    selectedIdentity.value = res.data.id
    flash('Data pasien berhasil dibuat', 'success')
  } catch (e) { flash(e.response?.data?.error || 'Gagal membuat data', 'error') }
}

function selectIdentity(id) { selectedIdentity.value = id }

async function submitBMI() {
  if (!selectedIdentity.value) { flash('Pilih pasien terlebih dahulu', 'error'); return }
  try {
    await api.post('/bmi', { identity_id: selectedIdentity.value, weight: bmiWeight.value })
    bmiWeight.value = ''
    flash('BMI berhasil disimpan', 'success')
  } catch (e) { flash(e.response?.data?.error || 'Gagal menyimpan BMI', 'error') }
}

async function submitSugar() {
  if (!selectedIdentity.value) { flash('Pilih pasien terlebih dahulu', 'error'); return }
  try {
    await api.post('/bloodsugar', { identity_id: selectedIdentity.value, sugar: sugarValue.value })
    sugarValue.value = ''
    flash('Gula darah berhasil disimpan', 'success')
  } catch (e) { flash(e.response?.data?.error || 'Gagal menyimpan gula darah', 'error') }
}

async function submitVitals() {
  if (!selectedIdentity.value) { flash('Pilih pasien terlebih dahulu', 'error'); return }
  try {
    await api.post('/vital-signs', { identity_id: selectedIdentity.value, ...vitals.value })
    vitals.value = { systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' }
    flash('Tanda vital berhasil disimpan', 'success')
  } catch (e) { flash(e.response?.data?.error || 'Gagal menyimpan tanda vital', 'error') }
}

function flash(m, t) { msg.value = m; msgType.value = t; setTimeout(() => msg.value = '', 3000) }
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Dashboard</h2>
      <div class="nav-bar">
        <span class="greeting">Halo, {{ auth.user?.username }}</span>
        <button v-if="auth.user?.role==='admin'" @click="nav('/health')" class="btn btn-blue btn-sm">Health</button>
        <button @click="nav('/money')" class="btn btn-yellow btn-sm">Money</button>
        <button v-if="auth.user?.role==='admin'" @click="nav('/list')" class="btn btn-orange btn-sm">List</button>
        <button @click="nav('/summary')" class="btn btn-purple btn-sm">Ringkasan</button>
        <button @click="nav('/tools')" class="btn btn-cyan btn-sm">Tools</button>
        <button @click="nav('/estate')" class="btn btn-green btn-sm">Estate</button>
        <button @click="nav('/chat')" class="btn btn-teal btn-sm">Chat</button>
        <button @click="nav('/library')" class="btn btn-brown btn-sm">Perpustakaan</button>
        <button @click="logout" class="btn btn-red btn-sm">Logout</button>
      </div>
    </div>

    <div v-if="msg" :class="['flash', msgType === 'success' ? 'flash-success' : 'flash-error']">{{ msg }}</div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <h3 v-if="auth.user?.role==='admin'" style="margin-bottom:8px;color:#fff">Pilih / Buat Pasien</h3>
        <select v-model="selectedIdentity" :disabled="auth.user?.role !== 'admin'" class="select">
          <option :value="null" disabled>Pilih pasien...</option>
          <option v-for="i in identities" :key="i.id" :value="i.id">{{ i.name }} ({{ i.nik || '-' }})</option>
        </select>
        <button v-if="auth.user?.role==='admin'" @click="showNewIdentity = !showNewIdentity" class="btn btn-green btn-block" style="margin-top:8px">
          {{ showNewIdentity ? 'Batal' : '+ Pasien Baru' }}
        </button>
        <div v-if="showNewIdentity" style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          <select v-if="auth.user?.role==='admin'" v-model="newIdentity.id_user" class="select">
            <option value="" disabled>Pilih user...</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }} ({{ u.email }})</option>
          </select>
          <input v-model="newIdentity.name" placeholder="Nama *" required class="input" />
          <input v-model="newIdentity.nik" placeholder="NIK" class="input" />
          <input v-model="newIdentity.height" type="number" placeholder="Tinggi (cm) *" required class="input" />
          <input v-model="newIdentity.birthplace" placeholder="Tempat Lahir" class="input" />
          <input v-model="newIdentity.birthdate" type="date" class="input" />
          <input v-model="newIdentity.address" placeholder="Alamat" class="input" />
          <button @click="createIdentity" class="btn btn-green btn-block">Simpan</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;color:#fff">BMI</h3>
        <input v-model="bmiWeight" type="number" placeholder="Berat badan (kg)" class="input" style="margin-bottom:8px" />
        <button @click="submitBMI" class="btn btn-green btn-block">Simpan BMI</button>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;color:#fff">Gula Darah</h3>
        <input v-model="sugarValue" type="number" placeholder="Gula darah (mg/dL)" class="input" style="margin-bottom:8px" />
        <button @click="submitSugar" class="btn btn-green btn-block">Simpan Gula Darah</button>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;color:#fff">Tanda Vital</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input v-model="vitals.systolic" type="number" placeholder="Sistole" class="input" />
          <input v-model="vitals.diastolic" type="number" placeholder="Diastole" class="input" />
          <input v-model="vitals.heart_rate" type="number" placeholder="Denyut Jantung" class="input" />
          <input v-model="vitals.temperature" type="number" step="0.1" placeholder="Suhu (C)" class="input" />
          <input v-model="vitals.spo2" type="number" placeholder="SpO2 (%)" class="input" />
          <input v-model="vitals.respiratory_rate" type="number" placeholder="Respirasi/mnt" class="input" />
        </div>
        <button @click="submitVitals" class="btn btn-green btn-block" style="margin-top:8px">Simpan Tanda Vital</button>
      </div>
    </div>
  </div>
</template>
