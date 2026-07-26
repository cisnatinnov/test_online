<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const languages = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'pt', label: 'Portugu\u00eas' },
]

function switchLang(code) {
  locale.value = code
  localStorage.setItem('locale', code)
}
</script>

<template>
  <div class="lang-switcher">
    <button
      v-for="lang in languages"
      :key="lang.code"
      :class="['lang-btn', { active: locale === lang.code }]"
      @click="switchLang(lang.code)"
      :title="lang.label"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.lang-switcher {
  display: flex;
  gap: 4px;
  align-items: center;
}
.lang-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.lang-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
.lang-btn.active {
  background: var(--accent-green);
  color: #fff;
  border-color: var(--accent-green);
}
</style>
