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
  <div style="max-width:900px;margin:0 auto;padding:20px">
    <h2 style="margin-bottom:16px">Riwayat Pasien #{{ id }}</h2>

    <h3 style="margin-bottom:8px">Riwayat BMI</h3>
    <div style="background:#fff;border-radius:8px;overflow:hidden;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#4caf50;color:#fff"><th style="padding:10px">Tanggal</th><th>Berat</th><th>Umur</th><th>Hasil</th></tr></thead>
        <tbody>
          <tr v-for="b in bmiHistory" :key="b.id" style="border-bottom:1px solid #eee">
            <td style="padding:8px">{{ formatDate(b.createdAt) }}</td>
            <td>{{ b.weight }} kg</td>
            <td>{{ b.age ?? '-' }}</td>
            <td :style="{ color: b.result==='Normal'?'#4caf50':'#f44336', fontWeight:'bold' }">{{ b.result }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!bmiHistory.length" style="padding:16px;text-align:center;color:#999">Belum ada riwayat BMI</p>
    </div>

    <h3 style="margin-bottom:8px">Riwayat Gula Darah</h3>
    <div style="background:#fff;border-radius:8px;overflow:hidden;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#ff9800;color:#fff"><th style="padding:10px">Tanggal</th><th>Hasil</th><th>Kesimpulan</th></tr></thead>
        <tbody>
          <tr v-for="s in sugarHistory" :key="s.id" style="border-bottom:1px solid #eee">
            <td style="padding:8px">{{ formatDate(s.createdAt) }}</td>
            <td>{{ s.result }}</td>
            <td>{{ s.conclusion }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!sugarHistory.length" style="padding:16px;text-align:center;color:#999">Belum ada riwayat gula darah</p>
    </div>

    <button @click="router.push('/list')" style="padding:8px 16px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Kembali</button>
  </div>
</template>
