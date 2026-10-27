import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import api from './api'
beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
it.each([
  ['/library/1/return/1', 403, 'Tidak memiliki akses'],
  ['/auth/login', 401, 'Wrong password'],
  ['/auth/change-password', 401, 'Current password is incorrect'],
  ['/auth/verify-2fa', 401, 'Invalid code'],
])('preserves the session and error feedback for %s', async (url, status, message) => {
  const auth = useAuthStore(); const logout = vi.spyOn(auth, 'logout')
  await expect(api.get(url, { adapter: async config => { throw { config, response: { status, data: { error: message } } } } })).rejects.toMatchObject({ response: { status } })
  expect(logout).not.toHaveBeenCalled()
})
