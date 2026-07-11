import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const tempToken = ref(localStorage.getItem('tempToken') || null)
  const channels = ref(JSON.parse(localStorage.getItem('channels') || '[]'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t, u) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function setTemp2FA(t, ch) {
    tempToken.value = t
    channels.value = ch
    localStorage.setItem('tempToken', t)
    localStorage.setItem('channels', JSON.stringify(ch))
  }

  function clearTemp2FA() {
    tempToken.value = null
    channels.value = []
    localStorage.removeItem('tempToken')
    localStorage.removeItem('channels')
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearTemp2FA()
  }

  return { token, user, tempToken, channels, isLoggedIn, setAuth, setTemp2FA, clearTemp2FA, logout }
})
