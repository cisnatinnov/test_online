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

const categories = ref([])
const activeTab = ref('spending')
const showForm = ref(false)
const editingId = ref(null)
const newName = ref('')
const msg = ref('')
const msgType = ref('')

const filteredCategories = computed(() => categories.value.filter(c => c.type === activeTab.value))

function flash(m, type) { msg.value = m; msgType.value = type; setTimeout(() => msg.value = '', 4000) }

onMounted(loadCategories)

async function loadCategories() {
  try {
    const { data: res } = await api.get('/categories')
    categories.value = res.data || []
  } catch (e) { console.error(e) }
}

function openAdd() {
  editingId.value = null
  newName.value = ''
  showForm.value = true
}

function openEdit(cat) {
  editingId.value = cat.id
  newName.value = cat.name
  showForm.value = true
}

async function saveCategory() {
  if (!newName.value.trim()) return
  try {
    if (editingId.value) {
      await api.put(`/categories/${editingId.value}`, { name: newName.value.trim() })
      flash(t('money.categorySaved'), 'success')
    } else {
      await api.post('/categories', { name: newName.value.trim(), type: activeTab.value })
      flash(t('money.categorySaved'), 'success')
    }
    showForm.value = false
    newName.value = ''
    editingId.value = null
    await loadCategories()
  } catch (e) {
    flash(e.response?.data?.error || t('money.categorySaveFailed'), 'error')
  }
}

async function deleteCategory(id) {
  if (!confirm(t('money.confirmDeleteCategory'))) return
  try {
    await api.delete(`/categories/${id}`)
    flash(t('money.categoryDeleted'), 'success')
    await loadCategories()
  } catch (e) {
    flash(e.response?.data?.error || t('money.categoryDeleteFailed'), 'error')
  }
}
</script>

<template>
  <div class="categories-page" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />
    <nav class="top-nav">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h1 class="logo" @click="router.push('/')" style="cursor:pointer">{{ t('money.manageCategories') }}</h1>
      <span class="user-badge">{{ auth.user?.username }}</span>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="main-content">
      <div class="tab-bar">
        <button :class="['tab', activeTab === 'spending' && 'active']" @click="activeTab = 'spending'">{{ t('money.spendingCategory') }}</button>
        <button :class="['tab', activeTab === 'saving' && 'active']" @click="activeTab = 'saving'">{{ t('money.savingCategory') }}</button>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ activeTab === 'spending' ? t('money.spendingCategory') : t('money.savingCategory') }}</h3>
          <button class="btn-sm btn-add" @click="openAdd">{{ t('money.addCategory') }}</button>
        </div>

        <div v-if="showForm" class="add-form">
          <input v-model="newName" :placeholder="t('money.categoryName')" class="form-input" @keyup.enter="saveCategory" />
          <button class="btn-sm btn-save" @click="saveCategory">{{ editingId ? t('money.editCategory') : t('money.addCategory') }}</button>
          <button class="btn-sm btn-cancel" @click="showForm = false; editingId = null; newName = ''">{{ t('chat.cancel') }}</button>
        </div>

        <div v-if="filteredCategories.length === 0" class="empty-state">{{ t('money.noCategories') }}</div>

        <div v-for="cat in filteredCategories" :key="cat.id" class="cat-item">
          <span class="cat-name">{{ cat.name }}</span>
          <div class="cat-actions">
            <button class="btn-icon btn-edit" @click="openEdit(cat)" :title="t('money.editCategory')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon btn-delete" @click="deleteCategory(cat.id)" :title="t('money.deleteCategory')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
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

.main-content { padding: 24px; max-width: 800px; margin: 0 auto; }

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
}

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-title { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 1px; color: #ffc107; margin: 0; }

.empty-state { text-align: center; padding: 30px; color: #555; font-size: 0.88rem; }

.add-form { display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.form-input {
  padding: 8px 12px; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
  color: #fff; font-size: 0.85rem; outline: none; flex: 1; min-width: 120px;
}
.form-input:focus { border-color: #ffc107; }
select.form-input { cursor: pointer; }
select.form-input option { background: #1a1a2e; color: #e0e0e0; }

.cat-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-radius: 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  margin-bottom: 8px;
  transition: background 0.2s;
}
.cat-item:hover { background: rgba(255,255,255,0.05); }
.cat-name { font-size: 0.9rem; font-weight: 600; }
.cat-actions { display: flex; gap: 6px; }

.btn-sm {
  padding: 6px 14px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 0.78rem; font-weight: 700;
  transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.3px;
}
.btn-add { background: rgba(76,175,80,0.2); color: #66bb6a; }
.btn-add:hover { background: rgba(76,175,80,0.35); }
.btn-save { background: linear-gradient(135deg, #ffc107, #ff9800); color: #1a1a2e; }
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,152,0,0.3); }
.btn-cancel { background: rgba(255,255,255,0.08); color: #999; }
.btn-cancel:hover { background: rgba(255,255,255,0.15); color: #ccc; }

.btn-icon {
  width: 30px; height: 30px; border: none; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-edit { background: rgba(33,150,243,0.15); color: #64b5f6; }
.btn-edit:hover { background: rgba(33,150,243,0.3); }
.btn-delete { background: rgba(244,67,54,0.15); color: #ef5350; }
.btn-delete:hover { background: rgba(244,67,54,0.3); }

@media (max-width: 768px) {
  .categories-page { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .add-form { flex-direction: column; }
}
</style>
