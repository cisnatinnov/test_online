<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template>
  <div class="auth-shell">
    <router-link to="/" class="auth-brand"><span>P</span>{{ t('app.title') }}</router-link>
    <main class="auth-main">
      <section class="auth-intro"><div class="auth-eyebrow">{{ t('workspace.eyebrow') }}</div><h1>{{ t('workspace.title') }}<br /><span>{{ t('workspace.titleAccent') }}</span></h1><p>{{ t('workspace.description') }}</p><div class="auth-orbit" aria-hidden="true"><div></div><span>P</span></div><small>{{ t('workspace.caption') }}</small></section>
      <div class="auth-form"><slot /></div>
    </main>
  </div>
</template>
<style scoped>
.auth-shell { min-height: 100vh; padding: 30px 6vw; background: radial-gradient(ellipse at 25% 60%, #65e4ca06, transparent 50%); }
.auth-brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text-primary); font-size: 20px; font-weight: 650; letter-spacing: -.7px; }.auth-brand > span { display: grid; place-items: center; width: 34px; height: 36px; background: #65e4ca; color: #09231f; border-radius: 9px; font-weight: 900; }
.auth-main { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; align-items: center; max-width: 1100px; margin: 44px auto; min-height: calc(100vh - 186px); }.auth-eyebrow { color: #65e4ca; font: 10px Consolas, monospace; letter-spacing: 2px; }.auth-intro h1 { font-size: clamp(38px, 4vw, 58px); font-weight: 550; line-height: 1.1; letter-spacing: -2px; margin: 24px 0; }.auth-intro h1 span { color: #65e4ca; }.auth-intro p { max-width: 350px; color: var(--text-secondary); font-size: 13px; line-height: 1.9; }.auth-intro small { color: var(--text-muted); text-transform: uppercase; font: 9px Consolas, monospace; letter-spacing: 2px; }
.auth-orbit { width: 190px; height: 190px; position: relative; margin: 28px 0; border: 1px dashed #65e4ca35; border-radius: 50%; display: grid; place-items: center; }.auth-orbit div { position: absolute; inset: 24px; border-radius: 50%; border: 1px solid #65e4ca30; }.auth-orbit span { width: 80px; height: 80px; display: grid; place-items: center; color: #65e4ca; border: 1px solid #65e4ca70; border-radius: 20px; font-size: 40px; background: #142d2d; transform: rotate(-8deg); box-shadow: 0 0 60px #65e4ca15; }.auth-form { display: flex; justify-content: center; min-width: 0; }.auth-form :deep(.card) { padding: 30px; border-color: #a4c9df26; }.auth-form :deep(.btn-block) { min-height: 44px; margin-top: 8px; }
@media(max-width: 768px) { .auth-shell { padding: 24px 20px; }.auth-main { grid-template-columns: 1fr; gap: 30px; margin: 36px auto; min-height: auto; }.auth-intro { display: none; }.auth-form :deep(.card) { padding: 24px; } }
</style>
