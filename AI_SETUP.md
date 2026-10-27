# PEAS AI assistant

PEAS stands for **Personal Everyday Assistant System**.

The AI Assistant is available at `/assistant` after sign-in, from the sidebar,
and from the home page. It streams replies as they arrive, remembers the current
conversation, and provides Stop and New chat controls. Shift+Enter inserts a
newline; Enter sends a message.

## Connect the AI service

Add the following to the server's local `.env` file:

```dotenv
OPENAI_API_KEY=your-own-api-key
OPENAI_MODEL=gpt-4.1-mini
```

Use an API key from your OpenAI project with access to the configured model.
Restart the backend with `npm start` after saving the settings. API credentials
stay on the server; never prefix the key with `VITE_` or commit it to Git.
Until a key is configured, the assistant displays a not-connected state.
Configuring a key does not verify its validity; connection/provider errors are
shown when a message is sent.

## Behavior and boundaries

- Authenticated users send messages through `POST /api/assistant/chat`.
- `GET /api/assistant/status` reports whether the server has a key configured.
- Only conversation text is sent to the provider. App health, financial, and
  other records are not automatically included. No app actions are performed.
- Conversations are kept in page memory and cleared on leaving the page.
- The OpenAI request uses `store: false`; this is not a claim of zero provider
  retention. Provider account data policies still apply.
- Requests are limited to 15 per minute per user, one active stream per user,
  20 messages (4,000 characters per user message, 16,000 per assistant message,
  80,000 total), and 2,048 output tokens. Older context is trimmed automatically.
- Stop, navigation, and client disconnection abort the server's provider request.
  Requests time out after two minutes. Consumed API tokens may still be billed.
- Missing keys and upstream failures do not produce simulated replies.

This implements live text chat. Voice, file attachments, web browsing, and actions
on app records are not included.

Implementation reference: [OpenAI streaming responses](https://developers.openai.com/api/docs/guides/streaming-responses).
