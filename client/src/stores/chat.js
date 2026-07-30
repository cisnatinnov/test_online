import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  const currentRoomMessages = computed(() => messages.value)

  function connect() {
    if (socket.value?.connected) return
    const s = io(window.location.origin, {
      auth: { token: auth.token },
      path: '/socket.io',
    })

    s.on('connect', () => { connected.value = true })
    s.on('disconnect', () => { connected.value = false })

    s.on('chat:message', (msg) => {
      if (msg.roomId === currentRoom.value?.id) {
        messages.value.push(msg)
      }
      const room = rooms.value.find(r => r.id === msg.roomId)
      if (room) {
        room.lastMessage = { content: msg.content, username: msg.username, createdAt: msg.createdAt }
      }
    })

    s.on('user:online', ({ userId }) => {
      onlineUserIds.value.add(userId)
      updateRoomOnlineStatus()
    })

    s.on('user:offline', ({ userId }) => {
      onlineUserIds.value.delete(userId)
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

    socket.value = s
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    connected.value = false
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
    if (res.status === 401 || res.status === 403) {
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
      messages.value = json.data || []
    } catch (e) { console.error(e) }
  }

  async function createRoom(type, name, participantIds) {
    try {
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ type, name, participantIds }),
      })
      if (!handleFetchAuth(res)) return
      const json = await res.json()
      await loadRooms()
      return json.data
    } catch (e) { console.error(e) }
  }

  async function selectRoom(room) {
    if (currentRoom.value?.id === room.id) return
    if (currentRoom.value) socket.value?.emit('chat:leave', { roomId: currentRoom.value.id })
    currentRoom.value = room
    messages.value = []
    await loadMessages(room.id)
    socket.value?.emit('chat:join', { roomId: room.id })
  }

  function sendMessage(content) {
    if (!currentRoom.value || !content.trim()) return
    const optimistic = { id: Date.now(), roomId: currentRoom.value.id, userId: auth.user?.id, username: auth.user?.username, content, createdAt: new Date().toISOString() }
    messages.value.push(optimistic)
    socket.value?.emit('chat:send', { roomId: currentRoom.value.id, content })
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
    onlineUserIds, typingUsers, connected,
    connect, disconnect, loadRooms, loadMessages, createRoom,
    selectRoom, sendMessage, sendTyping, loadUsers,
  }
})
