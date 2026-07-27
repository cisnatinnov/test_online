<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../api'

const { t } = useI18n()
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
      <h2>{{ t('list.title') }}</h2>
      <div class="nav-bar">
        <LanguageSwitcher />
      </div>
    </div>

    <div class="tab-bar">
      <button @click="activeTab='bmi'" :class="['tab-btn', activeTab==='bmi' && 'active']">{{ t('list.bmiTab') }}</button>
      <button @click="activeTab='vitals'" :class="['tab-btn', activeTab==='vitals' && 'active']">{{ t('list.vitalsTab') }}</button>
    </div>

    <input v-model="search" :placeholder="t('list.searchPlaceholder')" class="input" style="margin-bottom:16px" />

    <div v-if="activeTab==='bmi'" class="table-wrap">
      <table>
        <thead><tr style="background:var(--accent-green)"><th>{{ t('list.name') }}</th><th>{{ t('list.nik') }}</th><th>{{ t('list.age') }}</th><th>{{ t('list.bmi') }}</th><th>{{ t('list.result') }}</th><th>{{ t('list.sugar') }}</th><th>{{ t('list.actions') }}</th></tr></thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>{{ p.name }}</td>
            <td>{{ p.nik || '-' }}</td>
            <td>{{ p.age ?? '-' }}</td>
            <td>{{ p.bmi ?? '-' }}</td>
            <td :style="{ color: resultColor(p.result), fontWeight:'bold' }">{{ p.result || '-' }}</td>
            <td :style="{ color: resultColor(p.sugarCriteria?.label), fontWeight:'bold' }">{{ p.sugarCriteria?.label || '-' }}</td>
            <td><button @click="viewHistory(p.id)" class="btn btn-blue btn-sm">{{ t('list.history') }}</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filtered.length" class="empty-state">{{ t('list.noData') }}</p>
    </div>

    <div v-if="activeTab==='vitals'" class="card">
      <p style="color:var(--text-secondary)">{{ t('list.vitalsNote') }}</p>
    </div>

    <button @click="router.push('/')" class="btn btn-gray" style="margin-top:16px">{{ t('list.back') }}</button>
  </div>
</template>
