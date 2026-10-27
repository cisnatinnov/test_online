<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from '../components/Sidebar.vue'
import ModuleIcon from '../components/ModuleIcon.vue'
import { useAssistant } from '../composables/useAssistant'
import api from '../api'

const { t } = useI18n()
const { messages, busy, error, send, stop, clear } = useAssistant()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
const available = ref(false)
const checking = ref(true)
const statusError = ref(false)
const draft = ref('')
const conversation = ref(null)
const input = ref(null)
const statusController = new AbortController()
const errors = {
  AI_NOT_CONFIGURED: 'notConfigured', AI_BUSY: 'busyError', AI_RATE_LIMITED: 'rateLimit',
  AI_CONNECTION_ERROR: 'connectionError', AI_RESPONSE_INTERRUPTED: 'interrupted',
  AI_TIMEOUT: 'timeout', AI_SESSION_EXPIRED: 'sessionExpired', AI_INVALID_MESSAGES: 'invalidMessages',
}
const errorMessage = computed(() => error.value ? t('assistant.' + (errors[error.value] || 'unavailable')) : '')
async function checkStatus() {
  checking.value = true
  statusError.value = false
  try {
    const { data } = await api.get('/assistant/status', { signal: statusController.signal })
    available.value = data.data.available
  } catch { statusError.value = true; available.value = false }
  finally { checking.value = false }
}
onMounted(checkStatus)
onUnmounted(() => statusController.abort())
watch(() => messages.value.map(message => message.content).join('').length, async () => {
  await nextTick()
  if (conversation.value) conversation.value.scrollTop = conversation.value.scrollHeight
})
function submit() {
  if (!available.value || busy.value || !draft.value.trim()) return
  const content = draft.value
  draft.value = ''
  send(content)
}
function newChat() { clear(); draft.value = ''; input.value?.focus() }
function suggest(key) { draft.value = t('assistant.' + key); input.value?.focus() }
</script>

<template>
  <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="sidebarCollapsed = $event" />
  <div class="assistant-layout" :style="{ marginLeft: sidebarCollapsed ? '60px' : '240px' }">
    <header class="assistant-header">
      <button class="menu-toggle" :aria-label="t('workspace.openMenu')" @click="sidebarOpen = true">☰</button>
      <div class="assistant-heading"><div class="assistant-mark"><ModuleIcon name="assistant" /></div><div><h1>{{ t('assistant.title') }}</h1><p>{{ t('app.fullName') }}</p></div></div>
      <button class="btn new-chat" @click="newChat">＋ {{ t('assistant.newChat') }}</button>
    </header>
    <main class="assistant-main">
      <div class="connection-line"><span class="connection-dot" :class="{ ready: available }"></span>{{ t(checking ? 'assistant.checking' : available ? 'assistant.ready' : 'assistant.offline') }}<span class="session-note">{{ t('assistant.sessionOnly') }}</span></div>
      <div v-if="!checking && !available" class="connection-notice" role="status"><p>{{ t(statusError ? 'assistant.unavailable' : 'assistant.notConfigured') }}</p><button class="btn btn-gray btn-sm" @click="checkStatus">{{ t('assistant.checkAgain') }}</button></div>
      <section ref="conversation" class="conversation" role="log" :aria-label="t('assistant.conversation')" aria-live="polite">
        <div v-if="!messages.length" class="assistant-welcome">
          <div class="welcome-symbol"><ModuleIcon name="assistant" /></div>
          <div class="assistant-eyebrow">PEAS · {{ t('assistant.eyebrow') }}</div>
          <h2>{{ t('assistant.welcome') }}</h2><p>{{ t('assistant.intro') }}</p>
          <div class="suggestions"><button v-for="key in ['planPrompt', 'budgetPrompt', 'learnPrompt']" :key="key" @click="suggest(key)">{{ t('assistant.' + key) }} <span aria-hidden="true">↗</span></button></div>
        </div>
        <article v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <div class="message-avatar">{{ message.role === 'assistant' ? 'P' : '↗' }}</div>
          <div class="message-body"><div class="message-label">{{ message.role === 'assistant' ? 'PEAS' : t('assistant.you') }}</div><p v-if="message.content">{{ message.content }}</p><span v-else-if="message.state === 'pending'" class="thinking">{{ t('assistant.thinking') }}<span aria-hidden="true"> …</span></span><small v-if="message.state === 'stopped'">{{ t('assistant.stopped') }}</small><small v-if="message.state === 'error'">{{ t('assistant.incomplete') }}</small></div>
        </article>
      </section>
      <div v-if="errorMessage" class="flash flash-error" role="alert">{{ errorMessage }} <router-link v-if="error === 'AI_SESSION_EXPIRED'" to="/login">{{ t('auth.signin') }}</router-link></div>
      <form class="composer" @submit.prevent="submit">
        <label class="sr-only" for="assistant-message">{{ t('assistant.inputLabel') }}</label>
        <textarea id="assistant-message" ref="input" v-model="draft" :disabled="!available || checking" :placeholder="t('assistant.placeholder')" maxlength="4000" rows="3" @keydown.enter.exact.prevent="!$event.isComposing && submit()"></textarea>
        <div class="composer-footer"><span>{{ draft.length }} / 4000 <span class="keyboard-hint">· {{ t('assistant.enterHint') }}</span></span><button v-if="busy" type="button" class="btn stop-button" @click="stop">■ {{ t('assistant.stop') }}</button><button v-else type="submit" class="btn btn-green" :disabled="!available || checking || !draft.trim()">{{ t('assistant.send') }} <span aria-hidden="true">↗</span></button></div>
      </form>
      <p class="assistant-privacy">{{ t('assistant.privacy') }}</p>
    </main>
  </div>
</template>

<style scoped>
.assistant-layout { min-height: 100vh; transition: margin-left .25s; }.assistant-header { min-height: 86px; display: flex; align-items: center; gap: 15px; padding: 18px 32px; border-bottom: 1px solid var(--border-color); background: #0c151ecc; }.assistant-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }.assistant-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #65e4ca40; background: #65e4ca0d; border-radius: 12px; color: var(--accent-green); flex-shrink: 0; }.assistant-mark svg { width: 22px; height: 22px; }.assistant-heading h1 { font-size: 17px; font-weight: 600; }.assistant-heading p { font-size: 10px; color: var(--text-muted); margin-top: 4px; }.new-chat { margin-left: auto; border: 1px solid var(--border-color); background: #ffffff05; white-space: nowrap; }.assistant-main { max-width: 880px; margin: auto; padding: 24px 30px; }.connection-line { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font: 10px Consolas, monospace; }.connection-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }.connection-dot.ready { background: var(--accent-green); box-shadow: 0 0 10px #65e4ca44; }.session-note { margin-left: auto; color: var(--text-muted); }.connection-notice { display: flex; align-items: center; gap: 18px; padding: 16px; border: 1px solid #edbb8e33; background: #edbb8e08; border-radius: 10px; margin-top: 20px; font-size: 12px; line-height: 1.7; }.connection-notice button { flex-shrink: 0; }
.conversation { height: clamp(300px, 52vh, 640px); overflow-y: auto; overscroll-behavior: contain; padding: 26px 4px; scrollbar-gutter: stable; }.assistant-welcome { max-width: 560px; margin: 15px auto 25px; text-align: center; }.welcome-symbol { width: 64px; height: 64px; display: grid; place-items: center; color: #65e4ca; border: 1px solid #65e4ca44; background: linear-gradient(140deg, #1d3c38, #0e1c24); border-radius: 20px; margin: 0 auto 22px; box-shadow: 0 0 60px #65e4ca10; }.welcome-symbol svg { width: 34px; height: 34px; }.assistant-eyebrow { color: #65e4ca; font: 9px Consolas, monospace; letter-spacing: 2px; text-transform: uppercase; }.assistant-welcome h2 { font-size: clamp(24px, 3vw, 34px); font-weight: 500; letter-spacing: -1px; margin-block: 15px 10px; }.assistant-welcome > p { color: var(--text-secondary); font-size: 13px; line-height: 1.8; }.suggestions { display: grid; gap: 8px; margin-top: 22px; }.suggestions button { display: flex; justify-content: space-between; gap: 14px; padding: 12px 16px; font-size: 12px; text-align: left; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-secondary); background: #14212c88; cursor: pointer; }.suggestions button:hover { border-color: #65e4ca70; color: var(--text-primary); }.suggestions span { color: #65e4ca; }
.message { display: flex; gap: 14px; padding: 20px 8px; border-bottom: 1px solid #a4c9df10; }.message-avatar { flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 13px; font-weight: 600; color: #65e4ca; background: #65e4ca12; border: 1px solid #65e4ca30; }.user .message-avatar { color: #a7b8ff; background: #a7b8ff12; border-color: #a7b8ff30; }.message-body { min-width: 0; flex: 1; }.message-label { font-size: 11px; color: var(--text-muted); margin: 2px 0 10px; }.message-body p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.85; }.message-body small { display: block; margin-top: 8px; color: var(--text-muted); font-size: 11px; }.thinking { color: var(--text-secondary); font-size: 13px; }
.composer { border: 1px solid #a4c9df30; border-radius: 12px; padding: 16px; background: linear-gradient(130deg, #14212cbb, #0c141c); }.composer:focus-within { border-color: #65e4ca80; box-shadow: 0 0 20px #65e4ca05; }.composer textarea { width: 100%; background: transparent; border: 0; resize: vertical; min-height: 65px; max-height: 220px; color: var(--text-primary); font-size: 14px; line-height: 1.6; }.composer textarea:focus-visible { outline: none; }.composer textarea::placeholder { color: var(--text-muted); }.composer-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }.composer-footer > span { font-size: 9px; color: var(--text-muted); }.composer-footer .btn { gap: 16px; min-height: 36px; }.stop-button { background: #edbb8e15; border: 1px solid #edbb8e55; color: #edbb8e; }.assistant-privacy { font-size: 10px; line-height: 1.7; text-align: center; color: var(--text-muted); margin: 12px 16px 0; }.menu-toggle { display: none; color: var(--text-primary); background: transparent; border: 0; padding: 6px; font-size: 18px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media(max-width: 768px) { .assistant-layout { margin-left: 0 !important; }.menu-toggle { display: block; }.assistant-header { padding: 16px; gap: 8px; }.assistant-heading p { display: none; }.assistant-mark { display: none; }.assistant-heading h1 { font-size: 15px; }.new-chat { font-size: 11px; padding: 8px 10px; }.assistant-main { padding: 18px 16px; }.session-note, .keyboard-hint { display: none; }.connection-notice { flex-wrap: wrap; gap: 10px; }.conversation { height: 50vh; min-height: 300px; }.message { gap: 10px; padding-inline: 0; }.message-body p { font-size: 13px; } }
</style>
