import { ref, onScopeDispose } from 'vue'
import { streamAssistant } from '../utils/assistantStream'
import { useAuthStore } from '../stores/auth'

export function useAssistant() {
  const auth = useAuthStore()
  const messages = ref([])
  const busy = ref(false)
  const error = ref('')
  let request = null
  async function send(content) {
    if (busy.value || !content.trim() || content.length > 4000) return
    const history = messages.value.filter(message => message.state === 'complete' && message.content.trim())
      .slice(-19).map(({ role, content }) => ({ role, content: content.slice(0, role === 'assistant' ? 16000 : 4000) }))
    while (history.reduce((total, message) => total + message.content.length, 0) > 76000) history.shift()
    messages.value.push({ role: 'user', content: content.trim(), state: 'complete' })
    history.push({ role: 'user', content: content.trim() })
    messages.value.push({ role: 'assistant', content: '', state: 'pending' })
    const reply = messages.value[messages.value.length - 1]
    const current = new AbortController()
    request = current
    busy.value = true
    error.value = ''
    try {
      await streamAssistant({ token: auth.token, messages: history, signal: current.signal, onDelta: text => {
        if (request === current) reply.content += text
      } })
      if (request === current) {
        if (!reply.content.trim()) throw new Error('AI_RESPONSE_INTERRUPTED')
        reply.state = 'complete'
      }
    } catch (failure) {
      if (request !== current) return
      if (current.signal.aborted) reply.state = 'stopped'
      else {
        reply.state = 'error'
        error.value = failure.status === 401 || (failure.status === 403 && failure.message === 'Token tidak valid') ? 'AI_SESSION_EXPIRED' : failure.message
        if (error.value === 'AI_SESSION_EXPIRED') auth.logout()
      }
    } finally {
      if (request === current) { busy.value = false; request = null }
    }
  }
  function stop() { request?.abort() }
  function clear() {
    request?.abort()
    request = null
    busy.value = false
    messages.value = []
    error.value = ''
  }
  onScopeDispose(clear)
  return { messages, busy, error, send, stop, clear }
}
