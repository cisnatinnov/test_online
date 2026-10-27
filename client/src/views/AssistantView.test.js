import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import enGB from '../locales/en-GB.json'
import AssistantView from './AssistantView.vue'
import api from '../api'
import { streamAssistant } from '../utils/assistantStream'
vi.mock('../api', () => ({ default: { get: vi.fn() } }))
vi.mock('../utils/assistantStream', () => ({ streamAssistant: vi.fn() }))
let wrapper
beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })
afterEach(() => wrapper?.unmount())
async function setup(available) {
  api.get.mockResolvedValue({ data: { data: { available } } })
  wrapper = mount(AssistantView, { global: {
    plugins: [createPinia(), createI18n({ legacy: false, locale: 'en-GB', messages: { 'en-GB': enGB } })],
    stubs: { Sidebar: true, RouterLink: { template: '<a><slot /></a>' } },
  } })
  await flushPromises()
}
it('disables sending when AI is not configured and explains the setup state', async () => {
  await setup(false)
  expect(wrapper.text()).toContain('AI is not connected yet.')
  expect(wrapper.get('textarea').element.disabled).toBe(true)
  expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
  expect(streamAssistant).not.toHaveBeenCalled()
})
it('shows streamed content, stops generation, and starts a clean conversation', async () => {
  let emit
  streamAssistant.mockImplementation(({ onDelta, signal }) => new Promise((resolve, reject) => {
    emit = onDelta
    signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
  }))
  await setup(true)
  await wrapper.get('textarea').setValue('Hello PEAS')
  await wrapper.get('form').trigger('submit')
  emit('Hello, how can I help?')
  await flushPromises()
  expect(wrapper.get('[role="log"]').text()).toContain('Hello, how can I help?')
  const stop = wrapper.findAll('button').find(button => button.text().includes('Stop'))
  await stop.trigger('click'); await flushPromises()
  expect(wrapper.text()).toContain('Response stopped.')
  const restart = wrapper.findAll('button').find(button => button.text().includes('New chat'))
  await restart.trigger('click')
  expect(wrapper.text()).not.toContain('Hello PEAS')
  expect(wrapper.text()).toContain('What can I help you with?')
})
