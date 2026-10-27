import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useAssistant } from './useAssistant'
import { streamAssistant } from '../utils/assistantStream'
vi.mock('../utils/assistantStream', () => ({ streamAssistant: vi.fn() }))
let scope
beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); streamAssistant.mockReset(); scope = effectScope() })
afterEach(() => scope.stop())
const setup = () => scope.run(useAssistant)
it('streams a reply and sends prior conversation context on the next turn', async () => {
  streamAssistant.mockImplementation(async ({ onDelta }) => { onDelta('Hello '); onDelta('there') })
  const chat = setup(); await chat.send('Hi')
  expect(chat.messages.value[1]).toMatchObject({ content: 'Hello there', state: 'complete' })
  await chat.send('Continue')
  expect(streamAssistant.mock.calls[1][0].messages).toEqual([{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello there' }, { role: 'user', content: 'Continue' }])
})
it('Stop aborts generation and preserves the partial reply', async () => {
  streamAssistant.mockImplementation(({ onDelta, signal }) => new Promise((resolve, reject) => {
    onDelta('Partial'); signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
  }))
  const chat = setup(); const pending = chat.send('Hi'); chat.stop(); await pending
  expect(chat.messages.value[1]).toMatchObject({ content: 'Partial', state: 'stopped' })
  expect(chat.busy.value).toBe(false); expect(chat.error.value).toBe('')
})
it('New chat clears context and ignores late replies from the old conversation', async () => {
  let finish, delta
  streamAssistant.mockImplementation(({ onDelta }) => { delta = onDelta; return new Promise(resolve => { finish = resolve }) })
  const chat = setup(); const pending = chat.send('Hi'); chat.clear(); delta('Late response'); finish(); await pending
  expect(chat.messages.value).toEqual([]); expect(chat.busy.value).toBe(false)
})
it('shows a real setup error instead of a simulated reply', async () => {
  streamAssistant.mockRejectedValue(new Error('AI_NOT_CONFIGURED'))
  const chat = setup(); await chat.send('Hi')
  expect(chat.error.value).toBe('AI_NOT_CONFIGURED')
  expect(chat.messages.value[1]).toMatchObject({ content: '', state: 'error' })
})
it('clears an expired session without treating provider failures as a logout', async () => {
  const auth = useAuthStore(); const logout = vi.spyOn(auth, 'logout')
  streamAssistant.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 }))
  const chat = setup(); await chat.send('Hi'); expect(logout).toHaveBeenCalledOnce()
  expect(chat.error.value).toBe('AI_SESSION_EXPIRED')
})
