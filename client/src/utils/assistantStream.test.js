import { afterEach, expect, it, vi } from 'vitest'
import { streamAssistant } from './assistantStream'
afterEach(() => vi.unstubAllGlobals())
function response(events) {
  const bytes = new TextEncoder().encode(events.map(event => JSON.stringify(event) + '\n').join(''))
  return { ok: true, body: new ReadableStream({ start(stream) { for (const byte of bytes) stream.enqueue(Uint8Array.of(byte)); stream.close() } }) }
}
const options = () => ({ token: 'test-token', messages: [{ role: 'user', content: 'Hello' }], signal: new AbortController().signal, onDelta: vi.fn() })
it('renders deltas in order across byte boundaries and preserves Unicode', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([{ type: 'delta', text: 'Hi ' }, { type: 'delta', text: '🌱' }, { type: 'done' }])))
  const args = options(); await streamAssistant(args)
  expect(args.onDelta.mock.calls.map(([text]) => text).join('')).toBe('Hi 🌱')
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token')
})
it('reports incomplete streams and streamed service errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([{ type: 'delta', text: 'Partial' }])))
  await expect(streamAssistant(options())).rejects.toThrow('AI_RESPONSE_INTERRUPTED')
  fetch.mockResolvedValue(response([{ type: 'error', code: 'AI_TIMEOUT' }]))
  await expect(streamAssistant(options())).rejects.toThrow('AI_TIMEOUT')
})
it('preserves backend failure codes and authentication status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: 'AI_NOT_CONFIGURED' }) }))
  await expect(streamAssistant(options())).rejects.toMatchObject({ message: 'AI_NOT_CONFIGURED', status: 503 })
})
