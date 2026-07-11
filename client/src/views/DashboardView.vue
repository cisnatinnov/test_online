<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import api from '../api'

const auth = useAuthStore()
const router = useRouter()

const identities = ref([])
const selectedIdentity = ref(null)
const showNewIdentity = ref(false)
const newIdentity = ref({ nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '' })

const bmiWeight = ref('')
const sugarValue = ref('')
const vitals = ref({ systolic: '', diastolic: '', heart_rate: '', temperature: '', spo2: '', respiratory_rate: '' })

const msg = ref('')
const msgType = ref('')

function nav(path) { router.push(path) }

function logout() { auth.logout(); router.push('/login') }

onMounted(loadIdentities)

async function loadIdentities() {
  try {
    const { data: res } = await api.get('/identities')
    identities.value = res.data
    if (auth.user?.role !== 'admin' && res.data.length > 0) {
      selectedIdentity.value = res.data[0].id
    }
  } catch (e) { console.error(e) }
}

async function createIdentity() {
  try {
    const { data: res } = await api.post('/identities', newIdentity.value)
    showNewIdentity.value = false
    newIdentity.value = { nik: '', name: '', height: '', birthplace: '', birthdate: '', address: '' }
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
  <div style="max-width:900px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2>Dashboard</h2>
      <div>
        <span style="margin-right:12px">Halo, {{ auth.user?.username }}</span>
        <button @click="nav('/list')" style="margin-right:8px;padding:6px 12px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer">List</button>
        <button @click="nav('/summary')" style="margin-right:8px;padding:6px 12px;background:#9c27b0;color:#fff;border:none;border-radius:4px;cursor:pointer">Ringkasan</button>
        <button @click="nav('/tools')" style="margin-right:8px;padding:6px 12px;background:#00bcd4;color:#fff;border:none;border-radius:4px;cursor:pointer">Tools</button>
        <button @click="logout" style="padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Logout</button>
      </div>
    </div>

    <div v-if="msg" :style="{ padding:'10px',marginBottom:'12px',borderRadius:'4px',color:'#fff',background: msgType==='success'?'#4caf50':'#f44336' }">{{ msg }}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div style="padding:16px;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <h3 v-if="auth.user?.role==='admin'">Pilih / Buat Pasien</h3>
        <select v-model="selectedIdentity" :disabled="auth.user?.role !== 'admin'" style="width:100%;padding:8px;margin:8px 0;border:1px solid #ccc;border-radius:4px">
          <option :value="null" disabled>Pilih pasien...</option>
          <option v-for="i in identities" :key="i.id" :value="i.id">{{ i.name }} ({{ i.nik || '-' }})</option>
        </select>
        <button v-if="auth.user?.role==='admin'" @click="showNewIdentity = !showNewIdentity" style="padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;width:100%">
          {{ showNewIdentity ? 'Batal' : '+ Pasien Baru' }}
        </button>
        <div v-if="showNewIdentity" style="margin-top:12px">
          <input v-model="newIdentity.name" placeholder="Nama *" required style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="newIdentity.nik" placeholder="NIK" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="newIdentity.height" type="number" placeholder="Tinggi (cm) *" required style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="newIdentity.birthplace" placeholder="Tempat Lahir" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="newIdentity.birthdate" type="date" placeholder="Tanggal Lahir" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="newIdentity.address" placeholder="Alamat" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px" />
          <button @click="createIdentity" style="width:100%;padding:8px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">Simpan</button>
        </div>
      </div>

      <div style="padding:16px;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <h3 style="margin-bottom:8px">BMI</h3>
        <input v-model="bmiWeight" type="number" placeholder="Berat badan (kg)" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px" />
        <button @click="submitBMI" style="width:100%;padding:8px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">Simpan BMI</button>
      </div>

      <div style="padding:16px;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <h3 style="margin-bottom:8px">Gula Darah</h3>
        <input v-model="sugarValue" type="number" placeholder="Gula darah (mg/dL)" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px" />
        <button @click="submitSugar" style="width:100%;padding:8px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">Simpan Gula Darah</button>
      </div>

      <div style="padding:16px;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <h3 style="margin-bottom:8px">Tanda Vital</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <input v-model="vitals.systolic" type="number" placeholder="Sistole" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="vitals.diastolic" type="number" placeholder="Diastole" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="vitals.heart_rate" type="number" placeholder="Denyut Jantung" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="vitals.temperature" type="number" step="0.1" placeholder="Suhu (C)" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="vitals.spo2" type="number" placeholder="SpO2 (%)" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
          <input v-model="vitals.respiratory_rate" type="number" placeholder="Respirasi/mnt" style="padding:8px;border:1px solid #ccc;border-radius:4px" />
        </div>
        <button @click="submitVitals" style="width:100%;padding:8px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:8px">Simpan Tanda Vital</button>
      </div>
    </div>
  </div>
</template>
