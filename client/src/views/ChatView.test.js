import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import enGB from '../locales/en-GB.json'
import { useChatStore } from '../stores/chat'
import ChatView from './ChatView.vue'
vi.mock('../stores/chat', () => ({ useChatStore: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
let wrapper, chat
beforeEach(() => {
  localStorage.clear()
  chat = reactive({
    connected: true, sending: false, sendError: '', rooms: [], messages: [], typingUsers: {},
    currentRoom: { id: 1, name: 'Test group', type: 'group', participants: [] },
    connect: vi.fn(), disconnect: vi.fn(), loadRooms: vi.fn(), loadUsers: vi.fn().mockResolvedValue([{ id: 2, username: 'Other user', email: 'other@example.test' }]),
    sendMessage: vi.fn(), sendTyping: vi.fn(), selectRoom: vi.fn(), createRoom: vi.fn(),
  })
  useChatStore.mockReturnValue(chat)
})
afterEach(() => wrapper?.unmount())
async function setup() {
  wrapper = mount(ChatView, { global: {
    plugins: [createPinia(), createI18n({ legacy: false, locale: 'en-GB', messages: { 'en-GB': enGB } })],
    stubs: { Sidebar: true },
  } })
  await flushPromises()
}
it('retains a rejected draft, explains the restriction, and clears only an accepted draft', async () => {
  await setup()
  chat.sendMessage.mockImplementation(async () => { chat.sendError = 'CHAT_PROFANITY'; return false })
  await wrapper.get('.msg-input').setValue('Rejected draft')
  await wrapper.get('.send-btn').trigger('click'); await flushPromises()
  expect(wrapper.get('.msg-input').element.value).toBe('Rejected draft')
  expect(wrapper.get('[role="alert"]').text()).toContain('remove inappropriate language')
  chat.sendMessage.mockImplementation(async () => { chat.sendError = ''; return true })
  await wrapper.get('.msg-input').setValue('Hello everyone')
  await wrapper.get('.send-btn').trigger('click'); await flushPromises()
  expect(wrapper.get('.msg-input').element.value).toBe('')
})
it('keeps the new-group dialog open when its name is rejected', async () => {
  await setup()
  await wrapper.get('button[title="New Group"]').trigger('click')
  await wrapper.get('.modal input').setValue('Rejected group')
  await wrapper.get('.user-item').trigger('click')
  chat.createRoom.mockImplementation(async () => { chat.sendError = 'CHAT_PROFANITY'; return null })
  await wrapper.get('.btn-create').trigger('click'); await flushPromises()
  expect(wrapper.find('.modal').exists()).toBe(true)
  expect(wrapper.get('.modal .blocked-msg').text()).toContain('remove inappropriate language')
})
