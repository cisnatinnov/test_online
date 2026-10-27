import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function decodeToken(t) {
  try {
    const encoded = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
  } catch {
    return null
  }
}

function isTokenExpired(t) {
  const payload = decodeToken(t)
  if (typeof payload?.exp !== 'number' || !Number.isFinite(payload.exp)) return true
  return Date.now() >= payload.exp * 1000
}

function readStoredJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { localStorage.removeItem(key); return fallback }
}

export const useAuthStore = defineStore('auth', () => {
  const storedToken = localStorage.getItem('token') || null
  const token = ref(storedToken && !isTokenExpired(storedToken) ? storedToken : null)
  const user = ref(readStoredJson('user', null))
  const tempToken = ref(localStorage.getItem('tempToken') || null)
  const channels = ref(readStoredJson('channels', []))

  if (storedToken && isTokenExpired(storedToken)) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    user.value = null
  }

  const isLoggedIn = computed(() => !!token.value && !isTokenExpired(token.value))

  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      if (!e.newValue || isTokenExpired(e.newValue)) {
        token.value = null
        user.value = null
        tempToken.value = null
        channels.value = []
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('tempToken')
        localStorage.removeItem('channels')
      }
    }
    if (e.key === null) {
      token.value = null
      user.value = null
      tempToken.value = null
      channels.value = []
    }
  })

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
