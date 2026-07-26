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
  if (!r) return 'var(--text-muted)'
  if (r === 'Normal') return 'var(--accent-green)'
  if (r === 'Rendah') return 'var(--accent-blue)'
  if (r === 'Tinggi') return 'var(--accent-red)'
  return 'var(--accent-orange)'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Data Pasien</h2>
    </div>

    <div class="tab-bar">
      <button @click="activeTab='bmi'" :class="['tab-btn', activeTab==='bmi' && 'active']">BMI</button>
      <button @click="activeTab='vitals'" :class="['tab-btn', activeTab==='vitals' && 'active']">Tanda Vital</button>
    </div>

    <input v-model="search" placeholder="Cari nama atau NIK..." class="input" style="margin-bottom:16px" />

    <div v-if="activeTab==='bmi'" class="table-wrap">
      <table>
        <thead><tr style="background:var(--accent-green)"><th>Nama</th><th>NIK</th><th>Umur</th><th>BMI</th><th>Hasil</th><th>Gula</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>{{ p.name }}</td>
            <td>{{ p.nik || '-' }}</td>
            <td>{{ p.age ?? '-' }}</td>
            <td>{{ p.bmi ?? '-' }}</td>
            <td :style="{ color: resultColor(p.result), fontWeight:'bold' }">{{ p.result || '-' }}</td>
            <td :style="{ color: resultColor(p.sugarCriteria?.label), fontWeight:'bold' }">{{ p.sugarCriteria?.label || '-' }}</td>
            <td><button @click="viewHistory(p.id)" class="btn btn-blue btn-sm">Riwayat</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filtered.length" class="empty-state">Tidak ada data</p>
    </div>

    <div v-if="activeTab==='vitals'" class="card">
      <p style="color:var(--text-secondary)">Tab tanda vital memerlukan endpoint terpisah. Silakan gunakan Dashboard untuk input tanda vital.</p>
    </div>

    <button @click="router.push('/')" class="btn btn-gray" style="margin-top:16px">Kembali</button>
  </div>
</template>
