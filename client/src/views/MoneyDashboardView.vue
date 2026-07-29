<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import api from '../api'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const summary = ref({ totalExpense: 0, totalSaving: 0, balance: 0, expenseCount: 0, savingCount: 0 })
const expenseCategories = ref([])
const savingCategories = ref([])
const spendingCategoryOptions = ref([])
const savingCategoryOptions = ref([])
const chartData = ref([])
const chartPeriod = ref('monthly')
const chartMax = computed(() => Math.max(...chartData.value.map(x => Math.max(x.expense, x.saving)), 1))
const activeTab = ref('overview')
const msg = ref('')
const msgType = ref('')

const showAddExpense = ref(false)
const showAddSaving = ref(false)
const newExpense = ref({ amount: '', category: '', description: '', date: '' })
const newSaving = ref({ amount: '', category: '', description: '', date: '' })

const expenseColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#ff5722', '#795548', '#607d8b']
const savingColors = ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#009688', '#00bcd4', '#03a9f4', '#3f51b5']

const maxExpense = computed(() => Math.max(...expenseCategories.value.map(c => c.total), 1))
const maxSaving = computed(() => Math.max(...savingCategories.value.map(c => c.total), 1))

function flash(m, t) { msg.value = m; msgType.value = t; setTimeout(() => msg.value = '', 4000) }

onMounted(loadAll)

async function loadAll() {
  await Promise.all([loadSummary(), loadExpenseCategories(), loadSavingCategories(), loadChart(), loadCategoryOptions()])
}

async function loadSummary() {
  try {
    const { data: res } = await api.get('/money/summary')
    summary.value = res.data
  } catch (e) { console.error(e) }
}

async function loadExpenseCategories() {
  try {
    const { data: res } = await api.get('/money/expense/categories')
    expenseCategories.value = res.data || []
  } catch (e) { expenseCategories.value = [] }
}

async function loadSavingCategories() {
  try {
    const { data: res } = await api.get('/money/saving/categories')
    savingCategories.value = res.data || []
  } catch (e) { savingCategories.value = [] }
}

async function loadChart() {
  try {
    const { data: res } = await api.get(`/money/chart?period=${chartPeriod.value}`)
    chartData.value = res.data || []
  } catch (e) { chartData.value = [] }
}

function changePeriod(p) { chartPeriod.value = p; loadChart() }

async function loadCategoryOptions() {
  try {
    const [spRes, svRes] = await Promise.all([
      api.get('/categories?type=spending'),
      api.get('/categories?type=saving')
    ])
    spendingCategoryOptions.value = spRes.data.data || []
    savingCategoryOptions.value = svRes.data.data || []
  } catch (e) { console.error(e) }
}

async function addExpense() {
  if (!newExpense.value.amount || !newExpense.value.category) { flash(t('flash.amountCategoryRequired'), 'error'); return }
  try {
    await api.post('/money/expense', newExpense.value)
    newExpense.value = { amount: '', category: '', description: '', date: '' }
    showAddExpense.value = false
    flash(t('flash.expenseAdded'), 'success')
    await loadAll()
  } catch (e) { flash(e.response?.data?.error || t('flash.expenseAddFailed'), 'error') }
}

async function addSaving() {
  if (!newSaving.value.amount || !newSaving.value.category) { flash(t('flash.amountCategoryRequired'), 'error'); return }
  try {
    await api.post('/money/saving', newSaving.value)
    newSaving.value = { amount: '', category: '', description: '', date: '' }
    showAddSaving.value = false
    flash(t('flash.savingAdded'), 'success')
    await loadAll()
  } catch (e) { flash(e.response?.data?.error || t('flash.savingAddFailed'), 'error') }
}

async function deleteExpense(id) {
  try {
    await api.delete(`/money/expense/${id}`)
    flash(t('flash.expenseDeleted'), 'success')
    await loadAll()
  } catch (e) { flash(t('flash.deleteFailed'), 'error') }
}

async function deleteSaving(id) {
  try {
    await api.delete(`/money/saving/${id}`)
    flash(t('flash.savingDeleted'), 'success')
    await loadAll()
  } catch (e) { flash(t('flash.deleteFailed'), 'error') }
}

function fmt(n) { return Number(n || 0).toLocaleString('id-ID') }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' }
</script>

<template>
  <div class="money-page" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />
    <nav class="top-nav">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h1 class="logo" @click="router.push('/')" style="cursor:pointer">{{ t('money.title') }}</h1>
      <span class="user-badge">{{ auth.user?.username }}</span>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="main-content">
      <div class="summary-row">
        <div class="summary-card expense-card">
          <div class="summary-icon">-</div>
          <div class="summary-body">
            <div class="summary-amount">Rp {{ fmt(summary.totalExpense) }}</div>
            <div class="summary-label">{{ t('money.totalSpending') }}</div>
            <div class="summary-sub">{{ summary.expenseCount }} {{ t('money.transactions') }}</div>
          </div>
        </div>
        <div class="summary-card saving-card">
          <div class="summary-icon">+</div>
          <div class="summary-body">
            <div class="summary-amount">Rp {{ fmt(summary.totalSaving) }}</div>
            <div class="summary-label">{{ t('money.totalSavings') }}</div>
            <div class="summary-sub">{{ summary.savingCount }} {{ t('money.transactions') }}</div>
          </div>
        </div>
        <div class="summary-card balance-card" :class="summary.balance >= 0 ? 'positive' : 'negative'">
          <div class="summary-icon">=</div>
          <div class="summary-body">
            <div class="summary-amount">Rp {{ fmt(summary.balance) }}</div>
            <div class="summary-label">{{ t('money.balance') }}</div>
            <div class="summary-sub">{{ summary.balance >= 0 ? t('money.surplus') : t('money.deficit') }}</div>
          </div>
        </div>
      </div>

      <div class="tab-bar">
        <button :class="['tab', activeTab === 'overview' && 'active']" @click="activeTab = 'overview'">{{ t('money.overview') }}</button>
        <button :class="['tab', activeTab === 'spending' && 'active']" @click="activeTab = 'spending'">{{ t('money.spending') }}</button>
        <button :class="['tab', activeTab === 'savings' && 'active']" @click="activeTab = 'savings'">{{ t('money.savings') }}</button>
      </div>

      <template v-if="activeTab === 'overview'">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ t('money.monthlyTrend') }}</h3>
            <div class="period-btns">
              <button v-for="p in ['weekly','monthly','yearly']" :key="p" :class="['period-btn', chartPeriod === p && 'active']" @click="changePeriod(p)">{{ t(`money.${p}`) }}</button>
            </div>
          </div>
          <div class="chart-area">
            <div class="chart-bar-group" v-for="(d, i) in chartData" :key="i">
              <div class="chart-bars">
                <div class="chart-bar expense-bar" :style="{ height: (d.expense / chartMax) * 160 + 'px' }"></div>
                <div class="chart-bar saving-bar" :style="{ height: (d.saving / chartMax) * 160 + 'px' }"></div>
              </div>
              <div class="chart-label">{{ d.label?.substring(0, 3) }}</div>
            </div>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-dot expense-dot"></span> {{ t('money.spending') }}</span>
            <span class="legend-item"><span class="legend-dot saving-dot"></span> {{ t('money.savings') }}</span>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">{{ t('money.spendingByCategory') }}</h3>
              <button class="btn-sm btn-add" @click="showAddExpense = !showAddExpense">{{ t('money.add') }}</button>
            </div>
            <div v-if="expenseCategories.length === 0" class="empty-state">{{ t('money.noSpending') }}</div>
            <div v-for="(cat, i) in expenseCategories" :key="cat.name" class="cat-row">
              <div class="cat-info">
                <span class="cat-dot" :style="{ background: expenseColors[i % expenseColors.length] }"></span>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }}x</span>
              </div>
              <div class="cat-bar-wrap">
                <div class="cat-bar expense-bar-bg" :style="{ width: (cat.total / maxExpense) * 100 + '%', background: expenseColors[i % expenseColors.length] }"></div>
              </div>
              <div class="cat-amount">Rp {{ fmt(cat.total) }}</div>
            </div>
            <div v-if="showAddExpense" class="add-form">
              <input v-model="newExpense.amount" type="number" :placeholder="t('money.amount')" class="form-input" />
              <select v-model="newExpense.category" class="form-input">
                <option value="" disabled>{{ t('money.selectCategory') }}</option>
                <option v-for="cat in spendingCategoryOptions" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
              </select>
              <input v-model="newExpense.description" :placeholder="t('money.description')" class="form-input" />
              <input v-model="newExpense.date" type="date" class="form-input" />
              <button class="btn-sm btn-save" @click="addExpense">{{ t('money.save') }}</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">{{ t('money.savingsBySource') }}</h3>
              <button class="btn-sm btn-add" @click="showAddSaving = !showAddSaving">{{ t('money.add') }}</button>
            </div>
            <div v-if="savingCategories.length === 0" class="empty-state">{{ t('money.noSavings') }}</div>
            <div v-for="(cat, i) in savingCategories" :key="cat.name" class="cat-row">
              <div class="cat-info">
                <span class="cat-dot" :style="{ background: savingColors[i % savingColors.length] }"></span>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }}x</span>
              </div>
              <div class="cat-bar-wrap">
                <div class="cat-bar saving-bar-bg" :style="{ width: (cat.total / maxSaving) * 100 + '%', background: savingColors[i % savingColors.length] }"></div>
              </div>
              <div class="cat-amount">Rp {{ fmt(cat.total) }}</div>
            </div>
            <div v-if="showAddSaving" class="add-form">
              <input v-model="newSaving.amount" type="number" :placeholder="t('money.amount')" class="form-input" />
              <select v-model="newSaving.category" class="form-input">
                <option value="" disabled>{{ t('money.selectCategory') }}</option>
                <option v-for="cat in savingCategoryOptions" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
              </select>
              <input v-model="newSaving.description" :placeholder="t('money.description')" class="form-input" />
              <input v-model="newSaving.date" type="date" class="form-input" />
              <button class="btn-sm btn-save" @click="addSaving">{{ t('money.save') }}</button>
            </div>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'spending'">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ t('money.allSpendingCategories') }}</h3>
            <button class="btn-sm btn-add" @click="showAddExpense = !showAddExpense">{{ t('money.addExpense') }}</button>
          </div>
          <div v-if="expenseCategories.length === 0" class="empty-state">{{ t('money.noSpending') }}</div>
          <div v-for="(cat, i) in expenseCategories" :key="cat.name" class="detail-card" :style="{ borderLeftColor: expenseColors[i % expenseColors.length] }">
            <div class="detail-header">
              <div class="detail-cat">
                <span class="cat-dot" :style="{ background: expenseColors[i % expenseColors.length] }"></span>
                <span class="detail-name">{{ cat.name }}</span>
              </div>
              <div class="detail-total">Rp {{ fmt(cat.total) }}</div>
            </div>
            <div class="detail-items">
              <div v-for="item in cat.items" :key="item.id" class="detail-item">
                <span class="item-desc">{{ item.description || t('money.noDescription') }}</span>
                <span class="item-date">{{ fmtDate(item.date) }}</span>
                <span class="item-amount">Rp {{ fmt(item.amount) }}</span>
                <button class="btn-del" @click="deleteExpense(item.id)">x</button>
              </div>
            </div>
          </div>
          <div v-if="showAddExpense" class="add-form full">
            <input v-model="newExpense.amount" type="number" :placeholder="t('money.amount')" class="form-input" />
            <select v-model="newExpense.category" class="form-input">
              <option value="" disabled>{{ t('money.selectCategory') }}</option>
              <option v-for="cat in spendingCategoryOptions" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
            <input v-model="newExpense.description" :placeholder="t('money.description')" class="form-input" />
            <input v-model="newExpense.date" type="date" class="form-input" />
            <button class="btn-sm btn-save" @click="addExpense">{{ t('money.saveExpense') }}</button>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'savings'">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ t('money.allSavingsSources') }}</h3>
            <button class="btn-sm btn-add" @click="showAddSaving = !showAddSaving">{{ t('money.addSaving') }}</button>
          </div>
          <div v-if="savingCategories.length === 0" class="empty-state">{{ t('money.noSavings') }}</div>
          <div v-for="(cat, i) in savingCategories" :key="cat.name" class="detail-card" :style="{ borderLeftColor: savingColors[i % savingColors.length] }">
            <div class="detail-header">
              <div class="detail-cat">
                <span class="cat-dot" :style="{ background: savingColors[i % savingColors.length] }"></span>
                <span class="detail-name">{{ cat.name }}</span>
              </div>
              <div class="detail-total">Rp {{ fmt(cat.total) }}</div>
            </div>
            <div class="detail-items">
              <div v-for="item in cat.items" :key="item.id" class="detail-item">
                <span class="item-desc">{{ item.description || t('money.noDescription') }}</span>
                <span class="item-date">{{ fmtDate(item.date) }}</span>
                <span class="item-amount">Rp {{ fmt(item.amount) }}</span>
                <button class="btn-del" @click="deleteSaving(item.id)">x</button>
              </div>
            </div>
          </div>
          <div v-if="showAddSaving" class="add-form full">
            <input v-model="newSaving.amount" type="number" :placeholder="t('money.amount')" class="form-input" />
            <select v-model="newSaving.category" class="form-input">
              <option value="" disabled>{{ t('money.selectCategory') }}</option>
              <option v-for="cat in savingCategoryOptions" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
            <input v-model="newSaving.description" :placeholder="t('money.description')" class="form-input" />
            <input v-model="newSaving.date" type="date" class="form-input" />
            <button class="btn-sm btn-save" @click="addSaving">{{ t('money.saveSaving') }}</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.money-page {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary, #ccc);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.hamburger:hover { background: rgba(255,255,255,0.08); color: #fff; }

.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.logo {
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(90deg, #ffc107, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-badge {
  padding: 4px 10px;
  background: rgba(255,193,7,0.2);
  border: 1px solid rgba(255,193,7,0.4);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #ffc107;
  margin-left: auto;
}

.toast {
  position: fixed; top: 16px; right: 16px;
  padding: 12px 20px; border-radius: 8px;
  font-weight: 600; font-size: 0.88rem; z-index: 1000;
  animation: slideIn 0.3s ease;
}
.toast.success { background: #2e7d32; color: #c8e6c9; }
.toast.error { background: #c62828; color: #ffcdd2; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.main-content { padding: 24px; max-width: 1100px; margin: 0 auto; }

.summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

.summary-card {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.2s;
}
.summary-card:hover { transform: translateY(-2px); }
.expense-card { background: linear-gradient(135deg, rgba(244,67,54,0.15), rgba(244,67,54,0.03)); }
.saving-card { background: linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.03)); }
.balance-card { background: linear-gradient(135deg, rgba(33,150,243,0.15), rgba(33,150,243,0.03)); }
.balance-card.positive { background: linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.03)); }
.balance-card.negative { background: linear-gradient(135deg, rgba(244,67,54,0.15), rgba(244,67,54,0.03)); }

.summary-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 800;
}
.expense-card .summary-icon { background: rgba(244,67,54,0.2); color: #ef5350; }
.saving-card .summary-icon { background: rgba(76,175,80,0.2); color: #66bb6a; }
.balance-card .summary-icon { background: rgba(33,150,243,0.2); color: #64b5f6; }
.balance-card.positive .summary-icon { background: rgba(76,175,80,0.2); color: #66bb6a; }
.balance-card.negative .summary-icon { background: rgba(244,67,54,0.2); color: #ef5350; }

.summary-amount { font-size: 1.3rem; font-weight: 800; }
.summary-label { font-size: 0.78rem; color: #999; font-weight: 600; text-transform: uppercase; }
.summary-sub { font-size: 0.72rem; color: #666; }

.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 10px; }
.tab {
  padding: 8px 20px; border: none; border-radius: 8px;
  cursor: pointer; font-size: 0.82rem; font-weight: 600;
  background: transparent; color: #888; transition: all 0.2s;
}
.tab.active { background: rgba(255,193,7,0.2); color: #ffc107; }
.tab:hover:not(.active) { color: #bbb; }

.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-title { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 1px; color: #ffc107; margin: 0; }

.period-btns { display: flex; gap: 4px; }
.period-btn {
  padding: 4px 12px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 0.75rem; font-weight: 600;
  background: rgba(255,255,255,0.06); color: #888; transition: all 0.2s;
}
.period-btn.active { background: rgba(255,193,7,0.2); color: #ffc107; }

.chart-area {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 200px;
  padding: 0 8px;
}
.chart-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; }
.chart-bars { display: flex; gap: 3px; align-items: flex-end; height: 160px; }
.chart-bar {
  width: 16px;
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.5s ease;
}
.expense-bar { background: linear-gradient(180deg, #f44336, #c62828); }
.saving-bar { background: linear-gradient(180deg, #4caf50, #2e7d32); }
.chart-label { font-size: 0.68rem; color: #666; margin-top: 6px; }

.chart-legend { display: flex; gap: 16px; justify-content: center; margin-top: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #999; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; }
.expense-dot { background: #f44336; }
.saving-dot { background: #4caf50; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.cat-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.cat-info { display: flex; align-items: center; gap: 8px; min-width: 140px; }
.cat-dot { width: 10px; height: 10px; border-radius: 3px; }
.cat-name { font-size: 0.85rem; font-weight: 600; }
.cat-count { font-size: 0.72rem; color: #666; }
.cat-bar-wrap { flex: 1; height: 8px; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden; }
.cat-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.cat-amount { font-size: 0.82rem; font-weight: 700; min-width: 100px; text-align: right; }

.empty-state { text-align: center; padding: 30px; color: #555; font-size: 0.88rem; }

.detail-card { border-left: 4px solid; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: rgba(255,255,255,0.02); }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.detail-cat { display: flex; align-items: center; gap: 8px; }
.detail-name { font-weight: 700; font-size: 0.95rem; }
.detail-total { font-weight: 800; font-size: 1rem; }

.detail-items { display: flex; flex-direction: column; gap: 6px; }
.detail-item {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 10px; background: rgba(0,0,0,0.15);
  border-radius: 6px; font-size: 0.82rem;
}
.item-desc { flex: 1; color: #bbb; }
.item-date { color: #777; font-size: 0.75rem; }
.item-amount { font-weight: 700; min-width: 90px; text-align: right; }
.btn-del {
  width: 22px; height: 22px; border: none; border-radius: 4px;
  background: rgba(244,67,54,0.2); color: #ef5350;
  cursor: pointer; font-size: 0.7rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.btn-del:hover { background: rgba(244,67,54,0.4); }

.add-form { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.add-form.full { flex-direction: column; }
.form-input {
  padding: 8px 12px; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
  color: #fff; font-size: 0.85rem; outline: none; flex: 1; min-width: 120px;
}
.form-input:focus { border-color: #ffc107; }

.btn-sm {
  padding: 6px 14px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 0.78rem; font-weight: 700;
  transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.3px;
}
.btn-add { background: rgba(76,175,80,0.2); color: #66bb6a; }
.btn-add:hover { background: rgba(76,175,80,0.35); }
.btn-save { background: linear-gradient(135deg, #ffc107, #ff9800); color: #1a1a2e; }
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,152,0,0.3); }

@media (max-width: 768px) {
  .money-page { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .summary-row { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .chart-bar { width: 10px; }
}
</style>
