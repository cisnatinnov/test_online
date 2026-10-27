const { readSseEvents } = require('../utils/sse');

const activeUsers = new Set();
const DEFAULT_MODEL = 'gpt-4.1-mini';
const instructions = `You are PEAS, the Personal Everyday Assistant System. Help with everyday planning, learning, writing, brainstorming, and understanding the app. The app includes health tracking, finances, estates, a library, games, and conversations. Reply in the user's language. Be clear, practical, and concise. You only see the conversation the user sends here. You cannot read their app records, browse the web, or perform actions. Do not claim to have accessed records or completed actions. Do not invent current facts. Use plain text with readable paragraphs and simple lists. For health and finance questions, distinguish general educational information from personalised professional advice.`;

exports.getStatus = (req, res) => res.json({ success: true, data: { available: !!process.env.OPENAI_API_KEY?.trim() } });

exports.streamReply = async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
      messages.some(message => !message || !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' || !message.content.trim() || message.content.length > (message.role === 'assistant' ? 16000 : 4000)) ||
      messages[messages.length - 1].role !== 'user' ||
      messages.reduce((total, message) => total + message.content.length, 0) > 80000) {
    return res.status(400).json({ success: false, error: 'AI_INVALID_MESSAGES' });
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return res.status(503).json({ success: false, error: 'AI_NOT_CONFIGURED' });
  const userId = req.user.id;
  if (activeUsers.has(userId)) return res.status(429).json({ success: false, error: 'AI_BUSY' });
  activeUsers.add(userId);
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 120000);
  const disconnect = () => controller.abort();
  res.on('close', disconnect);
  const emit = event => {
    if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(event) + '\n');
  };
  const fail = (code, status = 502) => {
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) { emit({ type: 'error', code }); res.end(); }
    else res.status(status).json({ success: false, error: code });
  };
  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions,
        input: messages.map(({ role, content }) => ({ role, content })),
        stream: true, store: false, max_output_tokens: 2048,
      }),
    });
    if (!upstream.ok) {
      await upstream.body?.cancel();
      return fail(upstream.status === 429 ? 'AI_RATE_LIMITED' : upstream.status === 401 || upstream.status === 403 ? 'AI_CONNECTION_ERROR' : 'AI_UNAVAILABLE', upstream.status === 429 ? 429 : 502);
    }
    if (!upstream.body) return fail('AI_UNAVAILABLE');
    res.status(200).set({ 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    let hasText = false;
    for await (const event of readSseEvents(upstream.body)) {
      if (event.type === 'response.output_text.delta' || event.type === 'response.refusal.delta') {
        if (typeof event.delta === 'string') {
          if (event.delta.trim()) hasText = true;
          emit({ type: 'delta', text: event.delta });
        }
      } else if (event.type === 'response.completed') {
        if (!hasText) return fail('AI_RESPONSE_INTERRUPTED');
        emit({ type: 'done' });
        return res.end();
      } else if (['error', 'response.failed', 'response.incomplete'].includes(event.type)) {
        return fail('AI_RESPONSE_INTERRUPTED');
      }
    }
    fail('AI_RESPONSE_INTERRUPTED');
  } catch {
    fail(timedOut ? 'AI_TIMEOUT' : 'AI_UNAVAILABLE', timedOut ? 504 : 502);
  } finally {
    clearTimeout(timeout);
    controller.abort();
    res.off('close', disconnect);
    activeUsers.delete(userId);
  }
};
