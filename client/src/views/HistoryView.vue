<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'
import { formatDate, translateBmiStatus, translateSugarConclusion, translateSugarDescription } from '../utils/helpers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const id = route.params.id
const bmiHistory = ref([])
const sugarHistory = ref([])
const bmiPage = ref(1); const bmiTotalPages = ref(1)
const sugarPage = ref(1); const sugarTotalPages = ref(1)

async function loadBmiHistory(page) {
  try {
    const { data: res } = await api.get(`/history/${id}/bmi`, { params: { page, limit: 20 } })
    bmiHistory.value = res.data?.history || []
    bmiTotalPages.value = Math.ceil((res.data?.total || 0) / 20) || 1
    bmiPage.value = page
  } catch { bmiHistory.value = []; bmiTotalPages.value = 1 }
}

async function loadSugarHistory(page) {
  try {
    const { data: res } = await api.get(`/history/${id}/bloodsugar`, { params: { page, limit: 20 } })
    sugarHistory.value = res.data?.history || []
    sugarTotalPages.value = Math.ceil((res.data?.total || 0) / 20) || 1
    sugarPage.value = page
  } catch { sugarHistory.value = []; sugarTotalPages.value = 1 }
}

onMounted(() => { loadBmiHistory(1); loadSugarHistory(1) })
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
            <td :style="{ color: b.result==='Normal'?'var(--accent-green)':'var(--accent-red)', fontWeight:'bold' }">{{ translateBmiStatus(b.result, t) || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="bmiTotalPages > 1" class="pagination">
        <button class="btn-page" :disabled="bmiPage <= 1" @click="loadBmiHistory(bmiPage - 1)">{{ t('library.previous') }}</button>
        <span class="page-info">{{ bmiPage }} / {{ bmiTotalPages }}</span>
        <button class="btn-page" :disabled="bmiPage >= bmiTotalPages" @click="loadBmiHistory(bmiPage + 1)">{{ t('library.next') }}</button>
      </div>
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
            <td>
              {{ translateSugarConclusion(s.conclusion, t) || '-' }}
              <div v-if="s.description" style="font-size:11px;color:#888">{{ translateSugarDescription(s.description, t) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="sugarTotalPages > 1" class="pagination">
        <button class="btn-page" :disabled="sugarPage <= 1" @click="loadSugarHistory(sugarPage - 1)">{{ t('library.previous') }}</button>
        <span class="page-info">{{ sugarPage }} / {{ sugarTotalPages }}</span>
        <button class="btn-page" :disabled="sugarPage >= sugarTotalPages" @click="loadSugarHistory(sugarPage + 1)">{{ t('library.next') }}</button>
      </div>
      <p v-if="!sugarHistory.length" class="empty-state">{{ t('history.noSugarHistory') }}</p>
    </div>

    <button @click="router.push('/list')" class="btn btn-gray">{{ t('history.back') }}</button>
  </div>
</template>

<style scoped>
.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 12px; }
.page-info { font-size: 0.82rem; color: #999; }
.btn-page { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 700; background: rgba(76,175,80,0.2); color: #66bb6a; transition: all 0.2s; }
.btn-page:hover:not(:disabled) { background: rgba(76,175,80,0.35); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
