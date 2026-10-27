import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
const { handlers, socket } = vi.hoisted(() => {
  const handlers = {}
  const socket = { on: vi.fn((name, callback) => { handlers[name] = callback }), emit: vi.fn(), disconnect: vi.fn(), timeout: vi.fn() }
  socket.timeout.mockImplementation(() => socket)
  return { handlers, socket }
})
vi.mock('socket.io-client', () => ({ io: vi.fn(() => socket) }))
import { useChatStore } from './chat'

beforeEach(() => {
  localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks(); Object.keys(handlers).forEach(key => delete handlers[key])
  socket.emit.mockImplementation((name, payload, acknowledge) => { if (name === 'chat:send') acknowledge(null, { success: true }) })
})

describe('chat delivery', () => {
  it('shows one confirmed copy of a sent message and ignores duplicate events', async () => {
    const chat = useChatStore()
    chat.connect(); handlers.connect()
    chat.currentRoom = { id: 1 }
    expect(await chat.sendMessage('Hello')).toBe(true)
    expect(chat.messages).toHaveLength(0)
    const message = { id: 10, roomId: 1, content: 'Hello' }
    handlers['chat:message'](message); handlers['chat:message'](message)
    expect(chat.messages).toEqual([message])
  })
  it('keeps unsent input when disconnected and rejoins the selected room on reconnect', async () => {
    const chat = useChatStore()
    chat.connect(); chat.currentRoom = { id: 7 }
    expect(await chat.sendMessage('Hello')).toBe(false)
    handlers.connect()
    expect(socket.emit).toHaveBeenCalledWith('chat:join', { roomId: 7 })
    chat.disconnect()
    expect(chat.messages).toEqual([]); expect(chat.currentRoom).toBeNull()
  })
  it('reports blocked messages and never adds them to the conversation', async () => {
    const chat = useChatStore(); chat.connect(); handlers.connect(); chat.currentRoom = { id: 1 }
    socket.emit.mockImplementation((name, payload, acknowledge) => { if (name === 'chat:send') acknowledge(null, { success: false, code: 'CHAT_PROFANITY' }) })
    expect(await chat.sendMessage('blocked content')).toBe(false)
    expect(chat.sendError).toBe('CHAT_PROFANITY'); expect(chat.messages).toEqual([]); expect(chat.sending).toBe(false)
  })
  it('handles timeout and acknowledgement without duplicate delivery', async () => {
    const chat = useChatStore(); chat.connect(); handlers.connect(); chat.currentRoom = { id: 1 }
    socket.emit.mockImplementation((name, payload, acknowledge) => { if (name === 'chat:send') acknowledge(new Error('timeout')) })
    expect(await chat.sendMessage('hello')).toBe(false); expect(chat.sendError).toBe('CHAT_SEND_TIMEOUT')
    const message = { id: 33, roomId: 1, content: 'hello' }
    socket.emit.mockImplementation((name, payload, acknowledge) => {
      if (name === 'chat:send') { handlers['chat:message'](message); acknowledge(null, { success: true, message }) }
    })
    expect(await chat.sendMessage('hello')).toBe(true); expect(chat.messages).toHaveLength(1); expect(chat.sendError).toBe('')
  })
  it('does not replace a new room with a delayed previous-room response', async () => {
    let finish
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { finish = resolve })))
    const chat = useChatStore(); chat.currentRoom = { id: 1 }
    const pending = chat.loadMessages(1)
    chat.currentRoom = { id: 2 }; chat.messages.push({ id: 20, content: 'New room' })
    finish({ ok: true, status: 200, json: async () => ({ data: [{ id: 10, content: 'Old room' }] }) })
    await pending
    expect(chat.messages[0].id).toBe(20)
    vi.unstubAllGlobals()
  })
})
