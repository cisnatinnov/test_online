import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const useChatStore = defineStore('chat', () => {
  const auth = useAuthStore()
  const socket = ref(null)
  const rooms = ref([])
  const currentRoom = ref(null)
  const messages = ref([])
  const onlineUserIds = ref(new Set())
  const typingUsers = ref({})
  const connected = ref(false)
  const sending = ref(false)
  const sendError = ref('')
  let sendAttempt = 0

  const currentRoomMessages = computed(() => messages.value)

  function connect() {
    if (socket.value) return
    const s = io(window.location.origin, {
      auth: { token: auth.token },
      path: '/socket.io',
    })

    s.on('connect', () => {
      connected.value = true
      if (currentRoom.value) s.emit('chat:join', { roomId: currentRoom.value.id })
    })
    s.on('disconnect', () => { connected.value = false })

    s.on('chat:message', receiveMessage)
    s.on('chat:error', ({ code }) => { sendError.value = code || 'CHAT_SEND_FAILED' })

    function receiveMessage(msg) {
      if (msg.roomId === currentRoom.value?.id) {
        if (!messages.value.some(m => m.id === msg.id)) messages.value.push(msg)
      }
      const room = rooms.value.find(r => r.id === msg.roomId)
      if (room) {
        room.lastMessage = { content: msg.content, username: msg.username, createdAt: msg.createdAt }
      }
    }

    s.on('user:online', ({ userId }) => {
      onlineUserIds.value.add(userId)
      updateRoomOnlineStatus()
    })

    s.on('user:offline', ({ userId }) => {
      onlineUserIds.value.delete(userId)
      updateRoomOnlineStatus()
    })

    s.on('chat:users', ({ users }) => {
      users.forEach(id => onlineUserIds.value.add(id))
      updateRoomOnlineStatus()
    })

    s.on('chat:typing', ({ roomId, userId, username }) => {
      typingUsers.value[`${roomId}:${userId}`] = { username, at: Date.now() }
      setTimeout(() => {
        if (Date.now() - (typingUsers.value[`${roomId}:${userId}`]?.at || 0) > 3000) {
          delete typingUsers.value[`${roomId}:${userId}`]
        }
      }, 3500)
    })

    s.on('chat:room:updated', () => {
      loadRooms()
    })

    socket.value = markRaw(s)
  }

  function disconnect() {
    sendAttempt++
    sending.value = false
    sendError.value = ''
    socket.value?.disconnect()
    socket.value = null
    connected.value = false
    currentRoom.value = null
    messages.value = []
    rooms.value = []
    onlineUserIds.value = new Set()
    typingUsers.value = {}
  }

  function updateRoomOnlineStatus() {
    rooms.value.forEach(r => {
      if (r.type === 'direct' && r.participants.length === 2) {
        const other = r.participants.find(p => p.id !== auth.user?.id)
        if (other) r.isOnline = onlineUserIds.value.has(other.id)
      }
    })
  }

  function handleFetchAuth(res) {
    if (res.status === 401) {
      auth.logout()
      window.location.href = '/login'
      return null
    }
    return res
  }

  async function loadRooms() {
    try {
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!handleFetchAuth(res)) return
      const json = await res.json()
      rooms.value = json.data?.rooms || []
      updateRoomOnlineStatus()
    } catch (e) { console.error(e) }
  }

  async function loadMessages(roomId) {
    try {
      const res = await fetch(`${API_BASE}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!handleFetchAuth(res)) return
      const json = await res.json()
      if (currentRoom.value?.id !== roomId || !res.ok) return
      const history = json.data || []
      const ids = new Set(history.map(m => m.id))
      messages.value = [...history, ...messages.value.filter(m => !ids.has(m.id))]
    } catch (e) { console.error(e) }
  }

  async function createRoom(type, name, participantIds) {
    sendError.value = ''
    try {
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ type, name, participantIds }),
      })
      if (!handleFetchAuth(res)) return
      const json = await res.json()
      if (!res.ok) { sendError.value = json.error === 'CHAT_PROFANITY' ? json.error : 'CHAT_SEND_FAILED'; return null }
      await loadRooms()
      return json.data
    } catch (e) { console.error(e) }
  }

  async function selectRoom(room) {
    if (currentRoom.value?.id === room.id) return
    sendAttempt++
    sending.value = false
    sendError.value = ''
    if (currentRoom.value) socket.value?.emit('chat:leave', { roomId: currentRoom.value.id })
    currentRoom.value = room
    messages.value = []
    socket.value?.emit('chat:join', { roomId: room.id })
    await loadMessages(room.id)
  }

  async function sendMessage(content) {
    if (sending.value || !currentRoom.value || !content.trim()) return false
    if (!connected.value) { sendError.value = 'CHAT_OFFLINE'; return false }
    if (content.length > 5000) { sendError.value = 'CHAT_MESSAGE_TOO_LONG'; return false }
    const attempt = ++sendAttempt
    const roomId = currentRoom.value.id
    sending.value = true
    sendError.value = ''
    try {
      const result = await new Promise(resolve => {
        socket.value.timeout(10000).emit('chat:send', { roomId, content }, (error, response) => {
          resolve(error ? { success: false, code: 'CHAT_SEND_TIMEOUT' } : response)
        })
      })
      if (attempt !== sendAttempt) return false
      if (!result?.success) { sendError.value = result?.code || 'CHAT_SEND_FAILED'; return false }
      const message = result.message
      if (message && currentRoom.value?.id === message.roomId && !messages.value.some(item => item.id === message.id)) messages.value.push(message)
      return true
    } catch {
      if (attempt === sendAttempt) sendError.value = 'CHAT_SEND_FAILED'
      return false
    } finally {
      if (attempt === sendAttempt) sending.value = false
    }
  }

  function sendTyping() {
    if (!currentRoom.value) return
    socket.value?.emit('chat:typing', { roomId: currentRoom.value.id })
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API_BASE}/chat/users`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!handleFetchAuth(res)) return []
      const json = await res.json()
      return json.data?.users || []
    } catch (e) { console.error(e); return [] }
  }

  return {
    socket, rooms, currentRoom, messages: currentRoomMessages,
    onlineUserIds, typingUsers, connected, sending, sendError,
    connect, disconnect, loadRooms, loadMessages, createRoom,
    selectRoom, sendMessage, sendTyping, loadUsers,
  }
})
