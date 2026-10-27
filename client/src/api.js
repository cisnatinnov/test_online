import axios from 'axios'
import { useAuthStore } from './stores/auth'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '/api' })

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const invalidToken = status === 403 && err.response?.data?.error === 'Token tidak valid'
    const expiredToken = status === 401 && err.response?.data?.error === 'Token kedaluwarsa'
    const authEndpoint = /\/auth\//.test(err.config?.url || '')
    if (invalidToken || expiredToken || (!authEndpoint && status === 401)) {
      const auth = useAuthStore()
      auth.logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
