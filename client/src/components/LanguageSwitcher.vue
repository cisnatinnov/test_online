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

function switchLang(e) {
  locale.value = e.target.value
  localStorage.setItem('locale', e.target.value)
}
</script>

<template>
  <select class="lang-select" :value="locale" @change="switchLang">
    <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.label }}</option>
  </select>
</template>

<style scoped>
.lang-select {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}
.lang-select:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
.lang-select:focus {
  border-color: var(--accent-green);
}
.lang-select option {
  background: #1b2838;
  color: #fff;
}
</style>
