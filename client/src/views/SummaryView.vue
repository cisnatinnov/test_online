<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const summary = ref({ totalPatients: 0, totalBmi: 0, normalBmi: 0, totalSugar: 0, highSugar: 0 })

onMounted(async () => {
  try {
    const { data: res } = await api.get('/dashboard/summary')
    summary.value = res.data
  } catch (e) { console.error(e) }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Ringkasan</h2>
    </div>
    <div class="grid-3" style="margin-bottom:20px">
      <div class="card" style="text-align:center">
        <div style="font-size:36px;font-weight:bold;color:var(--accent-green)">{{ summary.totalPatients }}</div>
        <div style="color:var(--text-secondary);margin-top:4px">Total Pasien</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:36px;font-weight:bold;color:var(--accent-blue)">{{ summary.normalBmi }}</div>
        <div style="color:var(--text-secondary);margin-top:4px">BMI Normal</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:36px;font-weight:bold;color:var(--accent-red)">{{ summary.highSugar }}</div>
        <div style="color:var(--text-secondary);margin-top:4px">Gula Darah Tinggi</div>
      </div>
    </div>
    <button @click="$router.push('/')" class="btn btn-gray">Kembali</button>
  </div>
</template>
