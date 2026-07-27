<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'
import { formatDate } from '../utils/helpers'

const { t } = useI18n()
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
      <h2>{{ t('history.title') }}{{ id }}</h2>
      <div class="nav-bar">
        <LanguageSwitcher />
      </div>
    </div>

    <h3 style="margin-bottom:10px;color:#fff">{{ t('history.bmiHistory') }}</h3>
    <div class="table-wrap" style="margin-bottom:24px">
      <table>
        <thead><tr style="background:var(--accent-green)"><th>{{ t('history.date') }}</th><th>{{ t('history.weight') }}</th><th>{{ t('history.age') }}</th><th>{{ t('history.result') }}</th></tr></thead>
        <tbody>
          <tr v-for="b in bmiHistory" :key="b.id">
            <td>{{ formatDate(b.createdAt) }}</td>
            <td>{{ b.weight }} kg</td>
            <td>{{ b.age ?? '-' }}</td>
            <td :style="{ color: b.result==='Normal'?'var(--accent-green)':'var(--accent-red)', fontWeight:'bold' }">{{ b.result }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!bmiHistory.length" class="empty-state">{{ t('history.noBmiHistory') }}</p>
    </div>

    <h3 style="margin-bottom:10px;color:#fff">{{ t('history.sugarHistory') }}</h3>
    <div class="table-wrap" style="margin-bottom:24px">
      <table>
        <thead><tr style="background:var(--accent-orange)"><th>{{ t('history.date') }}</th><th>{{ t('history.result') }}</th><th>{{ t('history.conclusion') }}</th></tr></thead>
        <tbody>
          <tr v-for="s in sugarHistory" :key="s.id">
            <td>{{ formatDate(s.createdAt) }}</td>
            <td>{{ s.result }}</td>
            <td>{{ s.conclusion }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!sugarHistory.length" class="empty-state">{{ t('history.noSugarHistory') }}</p>
    </div>

    <button @click="router.push('/list')" class="btn btn-gray">{{ t('history.back') }}</button>
  </div>
</template>
