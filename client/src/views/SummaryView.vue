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
  <div style="max-width:700px;margin:0 auto;padding:20px">
    <h2 style="margin-bottom:16px">Ringkasan</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      <div style="padding:20px;background:#fff;border-radius:8px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <div style="font-size:32px;font-weight:bold;color:#4caf50">{{ summary.totalPatients }}</div>
        <div>Total Pasien</div>
      </div>
      <div style="padding:20px;background:#fff;border-radius:8px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <div style="font-size:32px;font-weight:bold;color:#2196f3">{{ summary.normalBmi }}</div>
        <div>BMI Normal</div>
      </div>
      <div style="padding:20px;background:#fff;border-radius:8px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        <div style="font-size:32px;font-weight:bold;color:#f44336">{{ summary.highSugar }}</div>
        <div>Gula Darah Tinggi</div>
      </div>
    </div>
    <button @click="$router.push('/')" style="margin-top:16px;padding:8px 16px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Kembali</button>
  </div>
</template>
