<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const auth = useAuthStore()
const router = useRouter()

const activeTab = ref('books')
const books = ref([])
const borrowings = ref([])
const stats = ref(null)
const categories = ref([])
const search = ref('')
const filterCategory = ref('')
const page = ref(1)
const totalPages = ref(1)

const showAddBook = ref(false)
const showEditBook = ref(false)
const editingBook = ref(null)
const bookForm = ref({ title: '', author: '', isbn: '', publisher: '', year: '', category: '', description: '', quantity: 1, shelf: '' })

const showBorrowModal = ref(false)
const borrowTarget = ref(null)
const borrowForm = ref({ due_date: '', notes: '' })

const settings = ref({ borrow_duration_days: 7, fine_per_day: 500, overdue_tolerance_days: 1 })
const settingsForm = ref({ borrow_duration_days: 7, fine_per_day: 500, overdue_tolerance_days: 1 })
const msg = ref('')
const msgType = ref('')
const loading = ref(false)

function flash(m, t) { msg.value = m; msgType.value = t; setTimeout(() => msg.value = '', 4000) }
function nav(path) { router.push(path) }

const isAdmin = computed(() => auth.user?.role === 'admin')

const statusLabels = { borrowed: 'Dipinjam', returned: 'Dikembalikan', overdue: 'Terlambat' }
const statusColors = { borrowed: '#ff9800', returned: '#4caf50', overdue: '#f44336' }

async function loadBooks() {
  try {
    loading.value = true
    const params = { page: page.value, limit: 20 }
    if (search.value) params.search = search.value
    if (filterCategory.value) params.category = filterCategory.value
    const { data: res } = await api.get('/library', { params })
    books.value = res.data.books
    totalPages.value = Math.ceil(res.data.total / 20) || 1
  } catch { books.value = [] }
  finally { loading.value = false }
}

async function loadBorrowings() {
  try {
    loading.value = true
    const { data: res } = await api.get('/library/borrowings', { params: { page: page.value, limit: 20 } })
    borrowings.value = res.data.borrowings
    totalPages.value = Math.ceil(res.data.total / 20) || 1
  } catch { borrowings.value = [] }
  finally { loading.value = false }
}

async function loadStats() {
  try {
    const { data: res } = await api.get('/library/stats')
    stats.value = res.data
  } catch { stats.value = null }
}

async function loadSettings() {
  try {
    const { data: res } = await api.get('/library/settings')
    settings.value = res.data
    settingsForm.value = {
      borrow_duration_days: res.data.borrow_duration_days,
      fine_per_day: res.data.fine_per_day,
      overdue_tolerance_days: res.data.overdue_tolerance_days,
    }
  } catch { /* use defaults */ }
}

async function saveSettings() {
  try {
    await api.put('/library/settings', settingsForm.value)
    flash('Pengaturan berhasil disimpan', 'success')
    await loadSettings()
  } catch (e) { flash(e.response?.data?.error || 'Gagal menyimpan pengaturan', 'error') }
}

async function loadCategories() {
  try {
    const { data: res } = await api.get('/library/categories')
    categories.value = res.data
  } catch { categories.value = [] }
}

function switchTab(tab) {
  activeTab.value = tab
  page.value = 1
  if (tab === 'books') loadBooks()
  else if (tab === 'borrowings') loadBorrowings()
  else if (tab === 'stats') loadStats()
  else if (tab === 'settings') loadSettings()
}

function openAddBook() {
  bookForm.value = { title: '', author: '', isbn: '', publisher: '', year: '', category: '', description: '', quantity: 1, shelf: '' }
  showAddBook.value = true
  showEditBook.value = false
}

function openEditBook(book) {
  editingBook.value = book
  bookForm.value = {
    title: book.title, author: book.author, isbn: book.isbn || '',
    publisher: book.publisher || '', year: book.year || '',
    category: book.category || '', description: book.description || '',
    quantity: book.quantity, shelf: book.shelf || '',
  }
  showEditBook.value = true
  showAddBook.value = false
}

async function saveBook() {
  try {
    const payload = { ...bookForm.value }
    if (payload.year) payload.year = parseInt(payload.year)
    if (payload.quantity) payload.quantity = parseInt(payload.quantity)
    if (showEditBook.value) {
      await api.put(`/library/${editingBook.value.id}`, payload)
      flash('Buku berhasil diperbarui', 'success')
    } else {
      await api.post('/library', payload)
      flash('Buku berhasil ditambahkan', 'success')
    }
    showAddBook.value = false
    showEditBook.value = false
    await loadBooks()
    await loadCategories()
  } catch (e) { flash(e.response?.data?.error || 'Gagal menyimpan buku', 'error') }
}

async function deleteBook(book) {
  if (!confirm(`Hapus buku "${book.title}"?`)) return
  try {
    await api.delete(`/library/${book.id}`)
    flash('Buku berhasil dihapus', 'success')
    await loadBooks()
  } catch (e) { flash(e.response?.data?.error || 'Gagal menghapus buku', 'error') }
}

function openBorrow(book) {
  borrowTarget.value = book
  const d = new Date()
  d.setDate(d.getDate() + (settings.value.borrow_duration_days || 7))
  borrowForm.value = { due_date: d.toISOString().split('T')[0], notes: '' }
  showBorrowModal.value = true
}

async function submitBorrow() {
  try {
    await api.post(`/library/${borrowTarget.value.id}/borrow`, borrowForm.value)
    flash('Peminjaman berhasil', 'success')
    showBorrowModal.value = false
    await loadBooks()
  } catch (e) { flash(e.response?.data?.error || 'Gagal meminjam buku', 'error') }
}

async function returnBook(borrowing) {
  if (!confirm('Kembalikan buku ini?')) return
  try {
    await api.post(`/library/${borrowing.book_id}/return/${borrowing.id}`)
    flash('Pengembalian berhasil', 'success')
    await loadBorrowings()
  } catch (e) { flash(e.response?.data?.error || 'Gagal mengembalikan buku', 'error') }
}

function onSearch() {
  page.value = 1
  loadBooks()
}

function prevPage() { if (page.value > 1) { page.value--; activeTab.value === 'books' ? loadBooks() : loadBorrowings() } }
function nextPage() { if (page.value < totalPages.value) { page.value++; activeTab.value === 'books' ? loadBooks() : loadBorrowings() } }

function dueDateStatus(dueDate) {
  const today = new Date().toISOString().split('T')[0]
  if (dueDate < today) return 'overdue'
  const diff = Math.ceil((new Date(dueDate) - new Date(today)) / 86400000)
  if (diff <= 3) return 'warning'
  return 'ok'
}

onMounted(() => { loadBooks(); loadCategories(); loadSettings() })
</script>

<template>
  <div class="lib-page">
    <nav class="top-nav">
      <h1 class="logo">Perpustakaan</h1>
      <div class="nav-links">
        <button @click="nav('/')" class="nav-btn back">Dashboard</button>
        <span class="user-badge">{{ auth.user?.username }}</span>
      </div>
    </nav>

    <div v-if="msg" :class="['toast', msgType]">{{ msg }}</div>

    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'books' }]" @click="switchTab('books')">Buku</button>
      <button :class="['tab', { active: activeTab === 'borrowings' }]" @click="switchTab('borrowings')">Peminjaman</button>
      <button :class="['tab', { active: activeTab === 'stats' }]" @click="switchTab('stats')">Statistik</button>
      <button v-if="isAdmin" :class="['tab', { active: activeTab === 'settings' }]" @click="switchTab('settings')">Pengaturan</button>
    </div>

    <div class="content">
      <template v-if="activeTab === 'books'">
        <div class="toolbar">
          <div class="search-bar">
            <input v-model="search" @keyup.enter="onSearch" placeholder="Cari judul, penulis, ISBN..." class="search-input" />
            <select v-model="filterCategory" @change="onSearch" class="filter-select">
              <option value="">Semua Kategori</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
            <button class="btn btn-blue" @click="onSearch">Cari</button>
          </div>
          <button class="btn btn-green" @click="openAddBook">+ Tambah Buku</button>
        </div>

        <div v-if="loading" class="loading">Memuat...</div>

        <div v-else-if="books.length === 0" class="empty-state">
          <div class="empty-icon">Buku</div>
          <p>Belum ada buku di perpustakaan</p>
        </div>

        <div v-else class="book-grid">
          <div v-for="book in books" :key="book.id" class="book-card">
            <div class="book-header">
              <div class="book-category">{{ book.category || 'Umum' }}</div>
              <div class="book-shelf" v-if="book.shelf">Rak: {{ book.shelf }}</div>
            </div>
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            <div class="book-meta">
              <span v-if="book.isbn">ISBN: {{ book.isbn }}</span>
              <span v-if="book.publisher">{{ book.publisher }}</span>
              <span v-if="book.year">{{ book.year }}</span>
            </div>
            <p v-if="book.description" class="book-desc">{{ book.description }}</p>
            <div class="book-availability">
              <span :class="['avail-badge', book.available > 0 ? 'available' : 'unavailable']">
                {{ book.available }}/{{ book.quantity }} tersedia
              </span>
            </div>
            <div class="book-actions">
              <button class="btn btn-sm btn-green" :disabled="book.available <= 0" @click="openBorrow(book)">Pinjam</button>
              <button class="btn btn-sm btn-blue" @click="openEditBook(book)">Edit</button>
              <button v-if="isAdmin" class="btn btn-sm btn-red" @click="deleteBook(book)">Hapus</button>
            </div>
          </div>
        </div>

        <div class="pagination" v-if="totalPages > 1">
          <button class="btn btn-sm" @click="prevPage" :disabled="page <= 1">Sebelumnya</button>
          <span class="page-info">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-sm" @click="nextPage" :disabled="page >= totalPages">Berikutnya</button>
        </div>
      </template>

      <template v-if="activeTab === 'borrowings'">
        <div v-if="loading" class="loading">Memuat...</div>

        <div v-else-if="borrowings.length === 0" class="empty-state">
          <div class="empty-icon">Peminjaman</div>
          <p>Belum ada data peminjaman</p>
        </div>

        <div v-else class="borrow-table-wrap">
          <table class="borrow-table">
            <thead>
              <tr>
                <th>Buku</th>
                <th>Peminjam</th>
                <th>Tgl Pinjam</th>
                <th>Tgl Kembali</th>
                <th>Denda</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in borrowings" :key="b.id" :class="['borrow-row', dueDateStatus(b.due_date)]">
                <td class="td-book">
                  <strong>{{ b.Book?.title }}</strong>
                  <small>{{ b.Book?.author }}</small>
                </td>
                <td>{{ b.User?.username }}</td>
                <td>{{ b.borrow_date }}</td>
                <td :class="'due-' + dueDateStatus(b.due_date)">{{ b.due_date }}</td>
                <td>
                  <span v-if="b.fine > 0 || b.liveFine > 0" class="fine-badge">Rp {{ (b.liveFine || b.fine).toLocaleString('id-ID') }}</span>
                  <span v-else class="fine-zero">-</span>
                </td>
                <td>
                  <span class="status-badge" :style="{ background: statusColors[b.status] }">{{ statusLabels[b.status] }}</span>
                </td>
                <td>
                  <button v-if="b.status === 'borrowed' || b.status === 'overdue'" class="btn btn-sm btn-green" @click="returnBook(b)">Kembalikan</button>
                  <span v-else class="returned-date">{{ b.return_date }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="totalPages > 1">
          <button class="btn btn-sm" @click="prevPage" :disabled="page <= 1">Sebelumnya</button>
          <span class="page-info">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-sm" @click="nextPage" :disabled="page >= totalPages">Berikutnya</button>
        </div>
      </template>

      <template v-if="activeTab === 'stats'">
        <div v-if="!stats" class="loading">Memuat statistik...</div>
        <template v-else>
          <div class="stats-grid">
            <div class="stat-card stat-blue">
              <div class="stat-value">{{ stats.totalTitles }}</div>
              <div class="stat-label">Judul Buku</div>
            </div>
            <div class="stat-card stat-green">
              <div class="stat-value">{{ stats.totalBooks }}</div>
              <div class="stat-label">Total Eksemplar</div>
            </div>
            <div class="stat-card stat-teal">
              <div class="stat-value">{{ stats.totalAvailable }}</div>
              <div class="stat-label">Tersedia</div>
            </div>
            <div class="stat-card stat-orange">
              <div class="stat-value">{{ stats.totalBorrowed }}</div>
              <div class="stat-label">Dipinjam</div>
            </div>
            <div class="stat-card stat-purple">
              <div class="stat-value">{{ stats.activeBorrowings }}</div>
              <div class="stat-label">Peminjaman Aktif</div>
            </div>
            <div class="stat-card stat-red">
              <div class="stat-value">{{ stats.overdueBorrowings }}</div>
              <div class="stat-label">Terlambat</div>
            </div>
            <div class="stat-card stat-yellow">
              <div class="stat-value">Rp {{ stats.totalFines?.toLocaleString('id-ID') || 0 }}</div>
              <div class="stat-label">Total Denda</div>
            </div>
            <div class="stat-card stat-orange">
              <div class="stat-value">Rp {{ stats.finePerDay?.toLocaleString('id-ID') || 500 }}</div>
              <div class="stat-label">Denda/Hari</div>
            </div>
            <div class="stat-card stat-teal">
              <div class="stat-value">{{ stats.borrowDurationDays || 7 }} hari</div>
              <div class="stat-label">Durasi Pinjam</div>
            </div>
            <div class="stat-card stat-purple">
              <div class="stat-value">{{ stats.overdueToleranceDays || 1 }} hari</div>
              <div class="stat-label">Toleransi</div>
            </div>
          </div>

          <div class="card" v-if="stats.categoryStats?.length">
            <h3 class="card-title">Buku per Kategori</h3>
            <div class="cat-chart">
              <div v-for="cs in stats.categoryStats" :key="cs.category" class="cat-bar-row">
                <span class="cat-label">{{ cs.category || 'Umum' }}</span>
                <div class="cat-bar-wrap">
                  <div class="cat-bar" :style="{ width: Math.max(10, (cs.total / stats.totalBooks) * 100) + '%' }">{{ cs.total }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <template v-if="activeTab === 'settings' && isAdmin">
        <div class="card" style="max-width:600px">
          <h3 class="card-title">Pengaturan Perpustakaan</h3>
          <div class="form-stack">
            <div class="input-group">
              <label>Durasi Peminjaman (hari)</label>
              <input v-model.number="settingsForm.borrow_duration_days" type="number" min="1" max="90" />
              <small class="input-hint">Berapa lama buku boleh dipinjam (default: 7 hari)</small>
            </div>
            <div class="input-group">
              <label>Denda Per Hari (Rp)</label>
              <input v-model.number="settingsForm.fine_per_day" type="number" min="0" step="100" />
              <small class="input-hint">Denda keterlambatan per hari setelah masa toleransi (default: Rp 500)</small>
            </div>
            <div class="input-group">
              <label>Hari Toleransi</label>
              <input v-model.number="settingsForm.overdue_tolerance_days" type="number" min="0" max="30" />
              <small class="input-hint">Hari pertama keterlambatan yang tidak dikenakan denda (default: 1 hari)</small>
            </div>
            <div class="settings-preview">
              <h4>Contoh Perhitungan Denda</h4>
              <div class="preview-table">
                <div class="preview-row">
                  <span>Jatuh tempo</span><span>Kembali</span><span>Terlambat</span><span>Denda</span>
                </div>
                <div class="preview-row">
                  <span>15 Jul</span><span>15 Jul</span><span>0 hari</span><span>Rp 0</span>
                </div>
                <div class="preview-row">
                  <span>15 Jul</span><span>16 Jul</span><span>1 hari</span><span>Rp 0 (toleransi)</span>
                </div>
                <div class="preview-row">
                  <span>15 Jul</span><span>17 Jul</span><span>2 hari</span><span>Rp {{ settingsForm.fine_per_day?.toLocaleString('id-ID') }}</span>
                </div>
                <div class="preview-row">
                  <span>15 Jul</span><span>25 Jul</span><span>10 hari</span><span>Rp {{ ((10 - settingsForm.overdue_tolerance_days) * (settingsForm.fine_per_day || 500)).toLocaleString('id-ID') }}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-green" @click="saveSettings">Simpan Pengaturan</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="showAddBook || showEditBook" class="modal-overlay" @click.self="showAddBook = false; showEditBook = false">
      <div class="modal">
        <h2 class="modal-title">{{ showEditBook ? 'Edit Buku' : 'Tambah Buku Baru' }}</h2>
        <div class="modal-body">
          <div class="form-row">
            <div class="input-group">
              <label>Judul *</label>
              <input v-model="bookForm.title" placeholder="Judul buku" />
            </div>
            <div class="input-group">
              <label>Penulis *</label>
              <input v-model="bookForm.author" placeholder="Nama penulis" />
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label>ISBN</label>
              <input v-model="bookForm.isbn" placeholder="978-..." />
            </div>
            <div class="input-group">
              <label>Penerbit</label>
              <input v-model="bookForm.publisher" placeholder="Nama penerbit" />
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label>Tahun</label>
              <input v-model="bookForm.year" type="number" min="1000" max="9999" placeholder="2024" />
            </div>
            <div class="input-group">
              <label>Kategori</label>
              <input v-model="bookForm.category" placeholder="Fiksi, Sains, dll" />
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label>Jumlah</label>
              <input v-model="bookForm.quantity" type="number" min="1" />
            </div>
            <div class="input-group">
              <label>Rak</label>
              <input v-model="bookForm.shelf" placeholder="A1, B2, dll" />
            </div>
          </div>
          <div class="input-group">
            <label>Deskripsi</label>
            <textarea v-model="bookForm.description" rows="3" placeholder="Deskripsi singkat buku..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showAddBook = false; showEditBook = false">Batal</button>
          <button class="btn btn-green" @click="saveBook">{{ showEditBook ? 'Simpan' : 'Tambah' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showBorrowModal" class="modal-overlay" @click.self="showBorrowModal = false">
      <div class="modal">
        <h2 class="modal-title">Pinjam Buku</h2>
        <div class="modal-body">
          <div class="borrow-info">
            <strong>{{ borrowTarget?.title }}</strong>
            <span>{{ borrowTarget?.author }}</span>
          </div>
          <div class="input-group">
            <label>Tanggal Pengembalian *</label>
            <input v-model="borrowForm.due_date" type="date" />
          </div>
          <div class="input-group" style="margin-top:10px">
            <label>Catatan</label>
            <textarea v-model="borrowForm.notes" rows="2" placeholder="Catatan opsional..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showBorrowModal = false">Batal</button>
          <button class="btn btn-green" @click="submitBorrow">Pinjam</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lib-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(90deg, #795548, #a1887f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links { display: flex; align-items: center; gap: 12px; }
.nav-btn { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; }
.nav-btn.back { background: rgba(255,255,255,0.12); color: #ccc; }
.nav-btn.back:hover { background: rgba(255,255,255,0.2); color: #fff; }
.user-badge { padding: 4px 10px; background: rgba(121,85,72,0.2); border: 1px solid rgba(121,85,72,0.4); border-radius: 20px; font-size: 0.8rem; color: #a1887f; }

.toast { position: fixed; top: 16px; right: 16px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; z-index: 1000; animation: slideIn 0.3s ease; }
.toast.success { background: #2e7d32; color: #c8e6c9; }
.toast.error { background: #c62828; color: #ffcdd2; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.tab {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(255,255,255,0.06);
  color: #999;
  transition: all 0.2s;
}
.tab:hover { background: rgba(255,255,255,0.1); color: #fff; }
.tab.active { background: rgba(121,85,72,0.3); color: #a1887f; }

.content { padding: 24px; max-width: 1200px; margin: 0 auto; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
.search-bar { display: flex; gap: 8px; flex: 1; }
.search-input { flex: 1; padding: 10px 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; }
.search-input:focus { border-color: #795548; }
.filter-select { padding: 10px 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; min-width: 140px; }
.filter-select option { background: #1a1a2e; color: #fff; }

.btn { padding: 10px 16px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-sm { padding: 6px 12px; font-size: 0.75rem; }
.btn-green { background: linear-gradient(135deg, #2e7d32, #66bb6a); color: #fff; }
.btn-green:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(46,125,50,0.4); }
.btn-blue { background: linear-gradient(135deg, #1565c0, #42a5f5); color: #fff; }
.btn-blue:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(21,101,192,0.4); }
.btn-red { background: linear-gradient(135deg, #c62828, #ef5350); color: #fff; }
.btn-red:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(198,40,40,0.4); }
.btn:not(.btn-green):not(.btn-blue):not(.btn-red) { background: rgba(255,255,255,0.1); color: #ccc; }
.btn:not(.btn-green):not(.btn-blue):not(.btn-red):hover { background: rgba(255,255,255,0.2); color: #fff; }

.loading { text-align: center; padding: 40px; color: #999; }

.empty-state { text-align: center; padding: 60px 20px; color: #666; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; width: 80px; height: 80px; display: inline-flex; align-items: center; justify-content: center; background: rgba(121,85,72,0.1); border-radius: 20px; font-weight: 800; color: #795548; }
.empty-state p { font-size: 0.95rem; margin-top: 8px; }

.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

.book-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}
.book-card:hover { border-color: rgba(121,85,72,0.3); transform: translateY(-2px); }

.book-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.book-category { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #795548; background: rgba(121,85,72,0.15); padding: 3px 8px; border-radius: 4px; font-weight: 600; }
.book-shelf { font-size: 0.7rem; color: #888; }

.book-title { font-size: 1.1rem; font-weight: 700; color: #e0e0e0; margin-bottom: 4px; line-height: 1.3; }
.book-author { font-size: 0.85rem; color: #aaa; margin-bottom: 10px; }
.book-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.book-meta span { font-size: 0.75rem; color: #777; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
.book-desc { font-size: 0.8rem; color: #888; margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.book-availability { margin-bottom: 12px; }
.avail-badge { font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.avail-badge.available { background: rgba(76,175,80,0.2); color: #66bb6a; }
.avail-badge.unavailable { background: rgba(244,67,54,0.2); color: #ef5350; }

.book-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.borrow-table-wrap { overflow-x: auto; }
.borrow-table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.04); border-radius: 12px; overflow: hidden; }
.borrow-table th { padding: 12px 16px; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #999; background: rgba(0,0,0,0.2); font-weight: 600; }
.borrow-table td { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
.borrow-row:hover { background: rgba(255,255,255,0.04); }
.borrow-row.overdue { background: rgba(244,67,54,0.05); }

.td-book { display: flex; flex-direction: column; gap: 2px; }
.td-book small { color: #888; font-size: 0.8rem; }

.due-overdue { color: #ef5350; font-weight: 700; }
.due-warning { color: #ffa726; font-weight: 600; }
.due-ok { color: #e0e0e0; }

.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #fff; }
.returned-date { font-size: 0.8rem; color: #888; }
.fine-badge { font-size: 0.8rem; font-weight: 700; color: #ef5350; background: rgba(244,67,54,0.15); padding: 3px 8px; border-radius: 6px; }
.fine-zero { color: #666; font-size: 0.85rem; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
.page-info { font-size: 0.9rem; color: #999; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat-card { padding: 20px 16px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-value { font-size: 2rem; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 600; }

.stat-blue { background: linear-gradient(135deg, rgba(33,150,243,0.2), rgba(33,150,243,0.05)); }
.stat-blue .stat-value { color: #64b5f6; }
.stat-green { background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.05)); }
.stat-green .stat-value { color: #66bb6a; }
.stat-teal { background: linear-gradient(135deg, rgba(0,150,136,0.2), rgba(0,150,136,0.05)); }
.stat-teal .stat-value { color: #4db6ac; }
.stat-orange { background: linear-gradient(135deg, rgba(255,152,0,0.2), rgba(255,152,0,0.05)); }
.stat-orange .stat-value { color: #ffb74d; }
.stat-purple { background: linear-gradient(135deg, rgba(156,39,176,0.2), rgba(156,39,176,0.05)); }
.stat-purple .stat-value { color: #ba68c8; }
.stat-red { background: linear-gradient(135deg, rgba(244,67,54,0.2), rgba(244,67,54,0.05)); }
.stat-red .stat-value { color: #ef5350; }
.stat-yellow { background: linear-gradient(135deg, rgba(255,193,7,0.2), rgba(255,193,7,0.05)); }
.stat-yellow .stat-value { color: #ffd54f; }

.card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }
.card-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: #a1887f; margin-bottom: 16px; }

.cat-chart { display: flex; flex-direction: column; gap: 10px; }
.cat-bar-row { display: flex; align-items: center; gap: 12px; }
.cat-label { min-width: 100px; font-size: 0.85rem; color: #ccc; text-align: right; }
.cat-bar-wrap { flex: 1; background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; height: 28px; }
.cat-bar { background: linear-gradient(90deg, #795548, #a1887f); height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; font-size: 0.8rem; font-weight: 700; color: #fff; border-radius: 6px; transition: width 0.5s ease; min-width: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { background: #1e2a3a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; color: #e0e0e0; }
.modal-body { display: flex; flex-direction: column; gap: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.input-group { display: flex; flex-direction: column; gap: 4px; }
.input-group label { font-size: 0.75rem; color: #999; font-weight: 600; }
.input-group input, .input-group textarea {
  padding: 10px 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; transition: border-color 0.2s;
  font-family: inherit; resize: vertical;
}
.input-group input:focus, .input-group textarea:focus { border-color: #795548; }

.borrow-info { background: rgba(121,85,72,0.1); padding: 14px; border-radius: 10px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; }
.borrow-info strong { color: #e0e0e0; }
.borrow-info span { color: #aaa; font-size: 0.85rem; }

.form-stack { display: flex; flex-direction: column; gap: 12px; }
.input-hint { font-size: 0.72rem; color: #777; margin-top: 2px; }

.settings-preview {
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 16px;
  margin-top: 8px;
}
.settings-preview h4 {
  font-size: 0.8rem;
  color: #a1887f;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.preview-table { display: flex; flex-direction: column; gap: 4px; }
.preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.preview-row:first-child {
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}
.preview-row span { color: #ccc; }

@media (max-width: 768px) {
  .toolbar { flex-direction: column; }
  .search-bar { flex-direction: column; width: 100%; }
  .book-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .form-row { grid-template-columns: 1fr; }
  .tabs { overflow-x: auto; }
}
</style>
