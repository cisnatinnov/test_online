<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { SentimentIntensityAnalyzer } from 'vader-sentiment'
import Sidebar from '../components/Sidebar.vue'

const { t } = useI18n()
const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
function onCollapsedChange(v) { sidebarCollapsed.value = v }

const inputMsg = ref('')
const showNewRoom = ref(false)
const newRoomType = ref('group')
const newRoomName = ref('')
const selectedUsers = ref([])
const availableUsers = ref([])
const searchQuery = ref('')
const messagesEl = ref(null)
const typingTimeout = ref(null)
const blockedMsg = ref('')

function getSentimentIcon(text) {
  if (!text) return ''
  const scores = SentimentIntensityAnalyzer.polarity_scores(text)
  if (scores.compound >= 0.5) return '😊'
  if (scores.compound <= -0.5) return '😠'
  if (scores.compound <= -0.05) return '😟'
  if (scores.compound >= 0.05) return '🙂'
  return '😐'
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return availableUsers.value
  const q = searchQuery.value.toLowerCase()
  return availableUsers.value.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

const typingInRoom = computed(() => {
  if (!chat.currentRoom) return ''
  const entries = Object.entries(chat.typingUsers).filter(([key]) => {
    const [, uid] = key.split(':')
    return key.startsWith(`${chat.currentRoom.id}:`) && String(uid) !== String(auth.user?.id)
  })
  if (!entries.length) return ''
  return entries.map(([, v]) => v.username).join(', ') + ' ' + t('chat.typing')
})

onMounted(async () => {
  chat.connect()
  await chat.loadRooms()
  availableUsers.value = await chat.loadUsers()
  chat.socket.value?.on('chat:error', ({ message }) => {
    blockedMsg.value = message || 'Message was blocked'
    setTimeout(() => { blockedMsg.value = '' }, 3000)
  })
})

onUnmounted(() => {
  chat.disconnect()
})

watch(() => chat.messages.length, () => {
  scrollToBottom()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

function selectRoom(room) {
  chat.selectRoom(room)
}

function send() {
  if (!inputMsg.value.trim()) return
  chat.sendMessage(inputMsg.value)
  inputMsg.value = ''
}

function onKeydown() {
  chat.sendTyping()
}

function openNewRoom(type) {
  newRoomType.value = type
  newRoomName.value = ''
  selectedUsers.value = []
  searchQuery.value = ''
  showNewRoom.value = true
}

function toggleUser(userId) {
  const idx = selectedUsers.value.indexOf(userId)
  if (idx >= 0) selectedUsers.value.splice(idx, 1)
  else selectedUsers.value.push(userId)
}

async function createRoom() {
  if (newRoomType.value === 'group' && !newRoomName.value.trim()) return
  if (!selectedUsers.value.length) return

  if (newRoomType.value === 'direct') {
    const room = await chat.createRoom('direct', null, [selectedUsers.value[0]])
    if (room) {
      await chat.loadRooms()
      const joined = chat.rooms.find(r => r.id === room.id)
      if (joined) chat.selectRoom(joined)
    }
  } else {
    const room = await chat.createRoom('group', newRoomName.value, selectedUsers.value)
    if (room) {
      await chat.loadRooms()
      const joined = chat.rooms.find(r => r.id === room.id)
      if (joined) chat.selectRoom(joined)
    }
  }
  showNewRoom.value = false
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatMsgTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return formatTime(d)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + formatTime(d)
}

function getRoomTitle(room) {
  if (!room) return ''
  if (room.type === 'direct') return room.name
  return room.name || t('chat.group')
}

function getOtherUser(room) {
  if (!room || room.type !== 'direct') return null
  return room.participants.find(p => p.id !== auth.user?.id)
}
</script>

<template>
  <div class="chat-page" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="onCollapsedChange" />
    <nav class="top-nav">
      <button class="hamburger" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <h1 class="logo" @click="router.push('/')" style="cursor:pointer">{{ t('chat.title') }}</h1>
      <span class="user-badge">{{ auth.user?.username }}</span>
    </nav>

    <div class="chat-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>{{ t('chat.conversations') }}</h3>
          <div class="new-room-btns">
            <button class="icon-btn" @click="openNewRoom('direct')" :title="t('chat.newDirectMessage')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="icon-btn" @click="openNewRoom('group')" :title="t('chat.newGroup')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
          </div>
        </div>
        <div class="room-list">
          <div v-for="room in chat.rooms" :key="room.id"
            :class="['room-item', { active: chat.currentRoom?.id === room.id }]"
            @click="selectRoom(room)">
            <div class="room-avatar" :class="{ online: room.isOnline }">
              {{ room.type === 'direct' ? (room.name || '?')[0].toUpperCase() : (room.name || 'G')[0].toUpperCase() }}
            </div>
            <div class="room-info">
              <div class="room-name">{{ getRoomTitle(room) }}</div>
              <div class="room-last" v-if="room.lastMessage">
                <strong>{{ room.lastMessage.username }}:</strong> {{ room.lastMessage.content }}
              </div>
              <div class="room-last" v-else style="opacity:0.4">{{ t('chat.noMessages') }}</div>
            </div>
          </div>
          <div v-if="!chat.rooms.length" class="empty-sidebar">
            {{ t('chat.noConversations') }}
          </div>
        </div>
      </aside>

      <main class="chat-main">
        <template v-if="chat.currentRoom">
          <div class="chat-header">
            <div class="chat-header-info">
              <h3>{{ getRoomTitle(chat.currentRoom) }}</h3>
              <span class="participant-count" v-if="chat.currentRoom.type === 'group'">
                {{ chat.currentRoom.participants.length }} {{ t('chat.members') }}
              </span>
              <span class="online-dot" v-if="chat.currentRoom.type === 'direct' && chat.currentRoom.isOnline"></span>
              <span class="online-label" v-if="chat.currentRoom.type === 'direct' && chat.currentRoom.isOnline">{{ t('chat.online') }}</span>
            </div>
          </div>

          <div class="messages-container" ref="messagesEl">
            <div v-for="(msg, i) in chat.messages" :key="msg.id || i"
              :class="['msg', { own: msg.userId === auth.user?.id || msg.user_id === auth.user?.id }]">
              <div class="msg-sender" v-if="msg.userId !== auth.user?.id && msg.user_id !== auth.user?.id">
                {{ msg.username || msg.User?.username }}
              </div>
              <div class="msg-bubble">
                <div class="msg-content">{{ msg.content }} <span class="sentiment-icon">{{ getSentimentIcon(msg.content || msg.content) }}</span></div>
                <div class="msg-time">{{ formatMsgTime(msg.createdAt) }}</div>
              </div>
            </div>
            <div v-if="chat.messages.length === 0" class="empty-chat">
              {{ t('chat.sendMessagePrompt') }}
            </div>
          </div>

          <div class="typing-bar" v-if="typingInRoom">{{ typingInRoom }}</div>

          <div v-if="blockedMsg" class="blocked-msg">
            ⚠️ {{ blockedMsg }}
          </div>

          <div class="chat-input">
            <input v-model="inputMsg" @keydown.enter="send" @keydown="onKeydown"
              :placeholder="t('chat.typeMessage')" class="msg-input" />
            <button class="send-btn" @click="send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </template>

        <div v-else class="empty-main">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2>{{ t('chat.welcomeTitle') }}</h2>
          <p>{{ t('chat.welcomeDesc') }}</p>
        </div>
      </main>
    </div>

    <div v-if="showNewRoom" class="modal-overlay" @click.self="showNewRoom = false">
      <div class="modal">
        <h3>{{ newRoomType === 'group' ? t('chat.newGroup') : t('chat.newDirectMessage') }}</h3>
        <div v-if="newRoomType === 'group'" class="form-group">
          <label>{{ t('chat.groupName') }}</label>
          <input v-model="newRoomName" :placeholder="t('chat.groupNamePlaceholder')" class="modal-input" />
        </div>
        <div class="form-group">
          <label>{{ newRoomType === 'group' ? t('chat.addMembers') : t('chat.selectUser') }}</label>
          <input v-model="searchQuery" :placeholder="t('chat.searchUsers')" class="modal-input" />
          <div class="user-list">
            <div v-for="user in filteredUsers" :key="user.id"
              :class="['user-item', { selected: selectedUsers.includes(user.id) }]"
              @click="toggleUser(user.id)">
              <div class="user-avatar">{{ user.username[0].toUpperCase() }}</div>
              <div>
                <div class="user-name">{{ user.username }}</div>
                <div class="user-email">{{ user.email }}</div>
              </div>
            </div>
            <div v-if="!filteredUsers.length" style="padding:12px;text-align:center;color:#666">{{ t('chat.noUsersFound') }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showNewRoom = false">{{ t('chat.cancel') }}</button>
          <button class="btn-create" @click="createRoom"
            :disabled="newRoomType === 'group' ? !newRoomName.trim() || !selectedUsers.length : !selectedUsers.length">
            {{ newRoomType === 'group' ? t('chat.createGroup') : t('chat.startChat') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #0d1b2a, #1b2838, #172a3a);
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
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
  background: linear-gradient(90deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.user-badge {
  padding: 4px 10px;
  background: rgba(76,175,80,0.2);
  border: 1px solid rgba(76,175,80,0.4);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #81c784;
  margin-left: auto;
}

.chat-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  flex: 1;
  min-height: 0;
}

.sidebar {
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.15);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sidebar-header h3 { font-size: 0.9rem; color: #81c784; margin: 0; }

.new-room-btns { display: flex; gap: 6px; }
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(76,175,80,0.15);
  color: #81c784;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover { background: rgba(76,175,80,0.3); }

.room-list { flex: 1; overflow-y: auto; }

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.15s;
}
.room-item:hover { background: rgba(255,255,255,0.04); }
.room-item.active { background: rgba(76,175,80,0.1); border-left: 3px solid #4caf50; }

.room-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #81c784;
  flex-shrink: 0;
  position: relative;
}
.room-avatar.online::after {
  content: '';
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid #1b2838;
}

.room-info { flex: 1; min-width: 0; }
.room-name { font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-last { font-size: 0.76rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

.empty-sidebar { padding: 24px; text-align: center; color: #555; font-size: 0.82rem; }

.chat-main { display: flex; flex-direction: column; height: calc(100vh - 54px); }

.chat-header {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
}
.chat-header-info { display: flex; align-items: center; gap: 10px; }
.chat-header-info h3 { margin: 0; font-size: 1rem; }
.participant-count { font-size: 0.76rem; color: #888; }
.online-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
}
.online-label { font-size: 0.76rem; color: #4caf50; }

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.msg { max-width: 70%; display: flex; flex-direction: column; }
.msg.own { align-self: flex-end; }
.msg.own .msg-bubble { background: linear-gradient(135deg, #2e7d32, #1b5e20); color: #e8f5e9; }

.msg-sender { font-size: 0.7rem; color: #81c784; margin-bottom: 2px; padding-left: 12px; }

.msg-bubble {
  background: rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 10px 14px;
  border-bottom-left-radius: 4px;
}
.msg.own .msg-bubble { border-bottom-left-radius: 16px; border-bottom-right-radius: 4px; }

.msg-content { font-size: 0.88rem; line-height: 1.4; word-break: break-word; }
.sentiment-icon { font-size: 0.75rem; margin-left: 4px; vertical-align: middle; }

.blocked-msg {
  padding: 8px 20px;
  background: rgba(231,76,60,0.15);
  border: 1px solid rgba(231,76,60,0.3);
  border-radius: 8px;
  margin: 0 20px 8px;
  font-size: 0.8rem;
  color: #e74c3c;
  text-align: center;
  animation: fadeOut 3s forwards;
}
@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
.msg-time { font-size: 0.65rem; opacity: 0.5; margin-top: 4px; text-align: right; }

.empty-chat { text-align: center; color: #555; margin-top: 40px; }

.typing-bar {
  padding: 4px 20px;
  font-size: 0.74rem;
  color: #81c784;
  font-style: italic;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
}

.msg-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
}
.msg-input:focus { border-color: #4caf50; }

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}
.send-btn:hover { transform: scale(1.08); }

.empty-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #555;
}
.empty-icon { margin-bottom: 16px; opacity: 0.3; }
.empty-main h2 { margin: 0 0 6px; }
.empty-main p { font-size: 0.88rem; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1e2d3d;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
  width: 420px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal h3 { margin: 0 0 16px; color: #81c784; }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 0.78rem; color: #888; margin-bottom: 6px; font-weight: 600; }

.modal-input {
  width: 100%;
  padding: 9px 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  box-sizing: border-box;
}
.modal-input:focus { border-color: #4caf50; }

.user-list {
  max-height: 240px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.user-item:hover { background: rgba(255,255,255,0.04); }
.user-item.selected { background: rgba(76,175,80,0.12); }

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(76,175,80,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  color: #81c784;
  flex-shrink: 0;
}
.user-name { font-size: 0.85rem; font-weight: 600; }
.user-email { font-size: 0.72rem; color: #888; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.btn-cancel {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: #ccc;
  cursor: pointer;
  font-size: 0.82rem;
}
.btn-create {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
  color: #fff;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
}
.btn-create:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .chat-page { margin-left: 0 !important; }
  .hamburger { display: flex; }
  .chat-layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .sidebar.show { display: flex; position: fixed; inset: 0; z-index: 50; }
}
</style>
