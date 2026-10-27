const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function streamAssistant({ token, messages, signal, onDelta }) {
  const response = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages }), signal,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.error || 'AI_UNAVAILABLE')
    error.status = response.status
    throw error
  }
  if (!response.body) throw new Error('AI_UNAVAILABLE')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  const handleLine = line => {
    if (!line.trim()) return false
    const event = JSON.parse(line)
    if (event.type === 'error') throw new Error(event.code || 'AI_UNAVAILABLE')
    if (event.type === 'delta' && typeof event.text === 'string') onDelta(event.text)
    return event.type === 'done'
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      pending += decoder.decode(value, { stream: true })
      let boundary
      while ((boundary = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, boundary)
        pending = pending.slice(boundary + 1)
        if (handleLine(line)) return
      }
    }
    pending += decoder.decode()
    if (pending && handleLine(pending)) return
    throw new Error('AI_RESPONSE_INTERRUPTED')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
