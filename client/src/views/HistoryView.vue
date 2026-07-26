<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { formatDate } from '../utils/helpers'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const bmiHistory = ref([])
const sugarHistory = ref([])

onMounted(async () => {
  try {
    const [bmiRes, sugarRes] = await Promise.all([
      api.get(`/history/${id}/bmi`),
      api.get(`/history/${id}/bloodsugar`)
    ])
    bmiHistory.value = bmiRes.data.data
    sugarHistory.value = sugarRes.data.data
  } catch (e) { console.error(e) }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Riwayat Pasien #{{ id }}</h2>
    </div>

    <h3 style="margin-bottom:10px;color:#fff">Riwayat BMI</h3>
    <div class="table-wrap" style="margin-bottom:24px">
      <table>
        <thead><tr style="background:var(--accent-green)"><th>Tanggal</th><th>Berat</th><th>Umur</th><th>Hasil</th></tr></thead>
        <tbody>
          <tr v-for="b in bmiHistory" :key="b.id">
            <td>{{ formatDate(b.createdAt) }}</td>
            <td>{{ b.weight }} kg</td>
            <td>{{ b.age ?? '-' }}</td>
            <td :style="{ color: b.result==='Normal'?'var(--accent-green)':'var(--accent-red)', fontWeight:'bold' }">{{ b.result }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!bmiHistory.length" class="empty-state">Belum ada riwayat BMI</p>
    </div>

    <h3 style="margin-bottom:10px;color:#fff">Riwayat Gula Darah</h3>
    <div class="table-wrap" style="margin-bottom:24px">
      <table>
        <thead><tr style="background:var(--accent-orange)"><th>Tanggal</th><th>Hasil</th><th>Kesimpulan</th></tr></thead>
        <tbody>
          <tr v-for="s in sugarHistory" :key="s.id">
            <td>{{ formatDate(s.createdAt) }}</td>
            <td>{{ s.result }}</td>
            <td>{{ s.conclusion }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!sugarHistory.length" class="empty-state">Belum ada riwayat gula darah</p>
    </div>

    <button @click="router.push('/list')" class="btn btn-gray">Kembali</button>
  </div>
</template>
