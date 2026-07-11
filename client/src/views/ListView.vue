<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const data = ref([])
const search = ref('')
const activeTab = ref('bmi')

onMounted(async () => {
  try {
    const { data: res } = await api.get('/bmi/list')
    data.value = res.data
  } catch (e) { console.error(e) }
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return data.value.filter(p => p.name?.toLowerCase().includes(q) || p.nik?.includes(q))
})

function viewHistory(id) { router.push(`/history/${id}`) }

function resultColor(r) {
  if (!r) return '#999'
  if (r === 'Normal') return '#4caf50'
  if (r === 'Rendah') return '#2196f3'
  if (r === 'Tinggi') return '#f44336'
  return '#ff9800'
}
</script>

<template>
  <div style="max-width:900px;margin:0 auto;padding:20px">
    <h2 style="margin-bottom:16px">Data Pasien</h2>
    <div style="margin-bottom:12px">
      <button @click="activeTab='bmi'" :style="{ padding:'8px 16px',marginRight:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background: activeTab==='bmi'?'#4caf50':'#ccc',color:'#fff' }">BMI</button>
      <button @click="activeTab='vitals'" :style="{ padding:'8px 16px',marginRight:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background: activeTab==='vitals'?'#4caf50':'#ccc',color:'#fff' }">Tanda Vital</button>
    </div>
    <input v-model="search" placeholder="Cari nama atau NIK..." style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #ccc;border-radius:4px" />
    <div v-if="activeTab==='bmi'" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#4caf50;color:#fff"><th style="padding:10px;text-align:left">Nama</th><th>NIK</th><th>Umur</th><th>BMI</th><th>Hasil</th><th>Gula</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id" style="border-bottom:1px solid #eee">
            <td style="padding:8px">{{ p.name }}</td>
            <td>{{ p.nik || '-' }}</td>
            <td>{{ p.age ?? '-' }}</td>
            <td>{{ p.bmi ?? '-' }}</td>
            <td :style="{ color: resultColor(p.result), fontWeight:'bold' }">{{ p.result || '-' }}</td>
            <td :style="{ color: resultColor(p.sugarCriteria?.label), fontWeight:'bold' }">{{ p.sugarCriteria?.label || '-' }}</td>
            <td><button @click="viewHistory(p.id)" style="padding:4px 8px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">Riwayat</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filtered.length" style="padding:16px;text-align:center;color:#999">Tidak ada data</p>
    </div>
    <div v-if="activeTab==='vitals'" style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
      <p style="color:#666">Tab tanda vital memerlukan endpoint terpisah. Silakan gunakan Dashboard untuk input tanda vital.</p>
    </div>
    <button @click="router.push('/')" style="margin-top:12px;padding:8px 16px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Kembali</button>
  </div>
</template>
