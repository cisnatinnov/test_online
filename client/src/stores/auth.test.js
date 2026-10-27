import { beforeEach, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
const token = exp => `header.${btoa(JSON.stringify({ exp })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`
beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
it('recovers from malformed persisted JSON without crashing the application', () => {
  localStorage.setItem('user', '{broken'); localStorage.setItem('channels', 'undefined')
  const auth = useAuthStore()
  expect(auth.user).toBeNull(); expect(auth.channels).toEqual([])
})
it('recognises valid base64url tokens and removes expired sessions', () => {
  localStorage.setItem('token', token(Date.now() / 1000 + 3600))
  expect(useAuthStore().isLoggedIn).toBe(true)
  setActivePinia(createPinia()); localStorage.setItem('token', token(1))
  expect(useAuthStore().isLoggedIn).toBe(false); expect(localStorage.getItem('token')).toBeNull()
})
it('clears temporary 2FA state when another tab logs out', () => {
  const auth = useAuthStore(); auth.setAuth(token(Date.now() / 1000 + 3600), { id: 1 }); auth.setTemp2FA('temporary', ['email'])
  window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: null }))
  expect(auth.isLoggedIn).toBe(false); expect(auth.tempToken).toBeNull(); expect(auth.channels).toEqual([])
})
