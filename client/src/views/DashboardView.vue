<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import ModuleIcon from '../components/ModuleIcon.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const { t } = useI18n()
const auth = useAuthStore()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
const features = computed(() => [
  { route: '/assistant', icon: 'assistant', label: 'assistant', desc: 'assistantDesc', colour: '#65e4ca' },
  { route: '/health', icon: 'health', label: 'healthMonitoring', desc: 'healthMonitoringDesc', colour: '#65e4ca' },
  ...(auth.user?.role !== 'admin' ? [{ route: '/money', icon: 'money', label: 'moneyManagement', desc: 'moneyManagementDesc', colour: '#a7b8ff' }] : []),
  { route: '/estate', icon: 'estate', label: 'estateManagement', desc: 'estateManagementDesc', colour: '#b9df91' },
  { route: '/chat', icon: 'chat', label: 'chat', desc: 'chatDesc', colour: '#78ceff' },
  { route: '/library', icon: 'library', label: 'library', desc: 'libraryDesc', colour: '#edbb8e' },
  { route: '/tools', icon: 'tools', label: 'tools', desc: 'toolsDesc', colour: '#d2adff' },
  ...(auth.user?.role === 'admin' ? [{ route: '/list', icon: 'list', label: 'patientData', desc: 'patientDataDesc', colour: '#ffabb9' }] : []),
])
</script>

<template>
  <Sidebar v-if="auth.isLoggedIn" :open="sidebarOpen" @close="sidebarOpen = false" @collapsed-change="sidebarCollapsed = $event" />
  <div class="command-centre" :class="{ 'is-public': !auth.isLoggedIn }" :style="auth.isLoggedIn ? { marginLeft: sidebarCollapsed ? '60px' : '240px' } : {}">
    <header class="command-header">
      <template v-if="auth.isLoggedIn">
        <button class="menu-toggle" :aria-label="t('workspace.openMenu')" @click="sidebarOpen = true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
        <span class="breadcrumb">{{ t('app.title') }} <span>/</span> <strong>{{ t('nav.dashboard') }}</strong></span>
        <router-link to="/profile" class="account-pill"><span class="account-dot">{{ auth.user?.username?.charAt(0).toUpperCase() }}</span>{{ auth.user?.username }}</router-link>
      </template>
      <template v-else>
        <router-link to="/" class="public-brand"><span class="brand-mark">P</span>{{ t('app.title') }}</router-link>
        <div class="public-navigation"><LanguageSwitcher /><router-link to="/login" class="header-login">{{ t('auth.signin') }} <span aria-hidden="true">&#8599;</span></router-link></div>
      </template>
    </header>
    <main class="workspace-content">
      <section class="workspace-hero">
        <div class="hero-copy">
          <div class="eyebrow"><span></span>{{ t('workspace.eyebrow') }}</div>
          <h1 v-if="auth.isLoggedIn">{{ t('dashboard.greeting') }}<br /><span>{{ auth.user?.username }}.</span></h1>
          <h1 v-else>{{ t('workspace.title') }}<br /><span>{{ t('workspace.titleAccent') }}</span></h1>
          <p>{{ t('workspace.description') }}</p>
          <div class="hero-actions">
            <router-link :to="auth.isLoggedIn ? '/assistant' : '/register'" class="primary-action">{{ t(auth.isLoggedIn ? 'assistant.open' : 'workspace.getStarted') }} <span aria-hidden="true">&#8599;</span></router-link>
            <a href="#modules" class="secondary-action">{{ t('workspace.explore') }} <span aria-hidden="true">&#8595;</span></a>
          </div>
          <div class="hero-caption"><span class="caption-line"></span>{{ t('workspace.caption') }}</div>
        </div>
        <div class="orbital" aria-hidden="true">
          <div class="orbit-grid"></div><div class="orbit orbit-outer"></div><div class="orbit orbit-middle"></div><div class="orbit orbit-inner"></div>
          <div class="orbit-axis axis-horizontal"></div><div class="orbit-axis axis-vertical"></div>
          <div class="orbit-core"><span>P</span><small>PEAS</small></div>
          <div class="orbit-node node-health"><ModuleIcon name="health" /></div>
          <div class="orbit-node node-estate"><ModuleIcon name="estate" /></div>
          <div class="orbit-node node-money"><ModuleIcon name="money" /></div>
          <span class="orbit-coordinate coordinate-top">01 / 07</span><span class="orbit-coordinate coordinate-bottom">{{ t('workspace.connected') }}</span>
        </div>
      </section>
      <section id="modules" class="modules-section">
        <div class="section-heading"><div><div class="eyebrow">{{ t('workspace.yourSpace') }}</div><h2>{{ t('workspace.modules') }}</h2></div><span class="module-count">{{ String(features.length).padStart(2, '0') }} <span>{{ t('workspace.modulesLabel') }}</span></span></div>
        <div class="module-grid">
          <router-link v-for="(feature, index) in features" :key="feature.route" :to="auth.isLoggedIn ? feature.route : { path: '/login', query: { redirect: feature.route } }" class="module-card" :style="{ '--module-accent': feature.colour }">
            <div class="module-top"><div class="module-icon"><ModuleIcon :name="feature.icon" /></div><span class="module-number">{{ String(index + 1).padStart(2, '0') }} <span aria-hidden="true">&#8599;</span></span></div>
            <h3>{{ t('landing.' + feature.label) }}</h3><p>{{ t('landing.' + feature.desc) }}</p>
            <div class="module-bottom"><span>{{ t('workspace.openModule') }}</span><span class="module-arrow" aria-hidden="true">&#8594;</span></div>
          </router-link>
        </div>
      </section>
      <footer class="workspace-footer"><span>PEAS <span class="footer-divider">/</span> {{ t('app.fullName') }}</span><span class="footer-mark">{{ t('workspace.caption') }} <span aria-hidden="true">&#10035;</span></span></footer>
    </main>
  </div>
</template>

<style scoped>
.command-centre { min-height: 100vh; transition: margin-left .25s ease; }
.command-header { height: 76px; padding: 0 40px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--border-color); background: #090f16d9; backdrop-filter: blur(20px); }
.breadcrumb { font-size: 12px; color: var(--text-secondary); }.breadcrumb span { margin: 0 16px; color: var(--text-muted); }.breadcrumb strong { font-weight: 500; color: var(--text-primary); }
.account-pill { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-primary); }.account-dot { width: 30px; height: 30px; display: grid; place-items: center; background: #65e4ca18; border: 1px solid #65e4ca40; border-radius: 50%; color: #65e4ca; }
.menu-toggle { display: none; background: none; border: 0; color: var(--text-primary); padding: 8px; cursor: pointer; }
.public-brand { display: flex; align-items: center; gap: 12px; color: #f1f6f9; font-size: 19px; font-weight: 650; letter-spacing: -.6px; }.brand-mark { display: grid; place-items: center; width: 32px; height: 34px; background: #65e4ca; color: #0a1919; border-radius: 9px; font-weight: 900; }.public-navigation { margin-left: auto; display: flex; align-items: center; gap: 28px; }.header-login { color: #e4edef; font-size: 12px; }.header-login span { margin-left: 14px; color: #65e4ca; }
.workspace-content { max-width: 1440px; margin: auto; padding: 0 40px; }.is-public .workspace-content { max-width: 1280px; }.is-public .command-header { padding-inline: max(40px, calc((100vw - 1200px) / 2)); }
.workspace-hero { min-height: 436px; display: grid; grid-template-columns: 1.15fr 1fr; align-items: center; gap: 30px; padding-block: 46px; border-bottom: 1px solid var(--border-color); }
.eyebrow { display: flex; align-items: center; gap: 8px; color: #8ba0ad; font: 10px 'Consolas', monospace; text-transform: uppercase; letter-spacing: 2px; }.hero-copy .eyebrow { color: #65e4ca; }.eyebrow > span { width: 5px; height: 5px; background: #65e4ca; box-shadow: 0 0 12px #65e4ca80; border-radius: 50%; }
h1 { font-size: clamp(38px, 4.3vw, 64px); letter-spacing: -2.8px; line-height: 1.08; font-weight: 550; margin-block: 22px 18px; overflow-wrap: anywhere; }h1 > span { color: #65e4ca; }.hero-copy > p { color: #96a8b4; font-size: 13px; line-height: 1.8; max-width: 390px; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 24px; margin-top: 25px; }.primary-action { background: #65e4ca; color: #09231f; border: 1px solid #84f2da; border-radius: 7px; display: inline-flex; gap: 25px; align-items: center; padding: 12px 18px; font-size: 12px; font-weight: 650; box-shadow: 0 0 24px #65e4ca0d; }.primary-action:hover { background: #93f5df; text-decoration: none; }.secondary-action { font-size: 12px; color: #b8c5cd; }.secondary-action span { margin-left: 12px; }.hero-caption { display: flex; align-items: center; gap: 8px; color: #718592; font: 9px 'Consolas', monospace; letter-spacing: .8px; margin-top: 26px; text-transform: uppercase; }.caption-line { width: 20px; height: 1px; background: #536975; }
.orbital { width: min(100%, 360px); aspect-ratio: 1; position: relative; justify-self: center; background: radial-gradient(circle, #65e4ca0c, transparent 65%); }.orbit-grid { position: absolute; inset: 0; background-image: linear-gradient(#65e4ca08 1px, transparent 1px), linear-gradient(90deg, #65e4ca08 1px, transparent 1px); background-size: 24px 24px; mask-image: radial-gradient(circle, black, transparent 72%); }.orbit { position: absolute; border: 1px solid #65e4ca25; border-radius: 50%; }.orbit-outer { inset: 6%; border-style: dashed; animation: orbit-spin 100s linear infinite; }.orbit-middle { inset: 17%; border-color: #65e4ca35; box-shadow: 0 0 30px #65e4ca05; }.orbit-inner { inset: 29%; border-color: #65e4ca18; }.orbit-axis { position: absolute; background: #65e4ca12; }.axis-horizontal { height: 1px; width: 100%; top: 50%; }.axis-vertical { width: 1px; height: 100%; left: 50%; }.orbit-core { position: absolute; inset: 34%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(140deg, #1b3936, #0e1c24); border: 1px solid #65e4ca60; border-radius: 24px; box-shadow: 0 0 65px #65e4ca12, inset 0 0 20px #65e4ca08; transform: rotate(-8deg); }.orbit-core > span { font-size: 55px; font-weight: 700; color: #8af2dc; line-height: 1; }.orbit-core small { font: 7px 'Consolas', monospace; letter-spacing: 2px; color: #78adab; margin-top: 9px; }.orbit-node { width: 42px; height: 42px; display: grid; place-items: center; position: absolute; border-radius: 12px; background: #10222a; border: 1px solid #65e4ca44; color: #65e4ca; box-shadow: 0 0 20px #0008; }.orbit-node svg { width: 21px; height: 21px; }.node-health { top: 13%; left: 21%; }.node-money { bottom: 14%; left: 20%; color: #a7b8ff; }.node-estate { right: 8%; top: 45%; color: #b9df91; }.orbit-coordinate { position: absolute; font: 8px 'Consolas', monospace; color: #607c83; letter-spacing: 2px; text-transform: uppercase; }.coordinate-top { right: 4%; top: 5%; }.coordinate-bottom { bottom: 4%; right: 4%; }@keyframes orbit-spin { to { transform: rotate(360deg); } }
.modules-section { scroll-margin-top: 20px; padding-block: 32px 36px; }.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 23px; }.section-heading h2 { font-size: 23px; font-weight: 500; letter-spacing: -.8px; margin-top: 8px; }.module-count { color: #b1c2cb; font: 11px 'Consolas', monospace; }.module-count span { color: #718592; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-left: 5px; }.module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.module-card { color: var(--text-primary); background: linear-gradient(130deg, #14212c88, #0c141cdd); padding: 23px; border: 1px solid #a4c9df17; border-radius: 10px; transition: border-color .2s, transform .2s, background .2s; display: flex; flex-direction: column; overflow: hidden; }.module-card:hover { transform: translateY(-3px); border-color: var(--module-accent); background: linear-gradient(130deg, #1a2a35, #0d171f); color: var(--text-primary); text-decoration: none; }.module-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 21px; }.module-icon { width: 38px; height: 38px; display: grid; place-items: center; background: color-mix(in srgb, var(--module-accent) 9%, transparent); border: 1px solid color-mix(in srgb, var(--module-accent) 18%, transparent); color: var(--module-accent); border-radius: 10px; }.module-icon svg { width: 20px; height: 20px; }.module-number { color: #647b88; font: 10px 'Consolas', monospace; }.module-number > span { font-size: 16px; margin-left: 18px; color: #a2b0bb; }.module-card h3 { font-size: 14px; font-weight: 550; letter-spacing: -.2px; margin-bottom: 8px; }.module-card p { font-size: 11px; line-height: 1.8; color: #91a4b1; margin-bottom: 22px; }.module-bottom { margin-top: auto; padding-top: 12px; border-top: 1px solid #a4c9df10; display: flex; align-items: center; justify-content: space-between; color: #8ea2af; font-size: 10px; }.module-arrow { color: var(--module-accent); font-size: 16px; }
.workspace-footer { border-top: 1px solid var(--border-color); padding: 21px 0 28px; display: flex; justify-content: space-between; gap: 16px; font-size: 9px; color: #748b99; }.footer-divider { margin: 0 9px; color: #3f5664; }.footer-mark { display: flex; align-items: center; gap: 10px; }.footer-mark > span { color: #65e4ca; font-size: 16px; }
@media (min-width: 1500px) { .workspace-hero { min-height: 480px; }.orbital { width: 400px; } }
@media (max-width: 1100px) { .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.workspace-content { padding-inline: 28px; }.command-header { padding-inline: 28px; }h1 { font-size: 44px; }.workspace-hero { gap: 10px; } }
@media (max-width: 768px) { .command-centre { margin-left: 0 !important; }.menu-toggle { display: flex; }.command-header, .is-public .command-header { padding-inline: 20px; height: 64px; }.workspace-content { padding-inline: 20px; }.workspace-hero { grid-template-columns: 1fr; padding-block: 35px 18px; }.orbital { width: 260px; margin-top: 12px; }.hero-copy > p { max-width: 480px; }h1 { font-size: 46px; }.public-navigation { gap: 15px; }.workspace-footer { flex-wrap: wrap; }.breadcrumb > span { margin-inline: 7px; } }
@media (max-width: 440px) { .module-grid { grid-template-columns: 1fr; }.module-card { padding: 21px; }.module-top { margin-bottom: 16px; }.section-heading h2 { font-size: 21px; }.public-brand { font-size: 16px; }.public-navigation { gap: 10px; min-width: 0; }.public-navigation :deep(.lang-select) { width: 100px; min-width: 0; }.header-login { font-size: 11px; white-space: nowrap; }.header-login span { display: none; }.account-pill { font-size: 0; }.module-card p { font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { .orbit { animation: none; }.command-centre, .module-card { transition: none; }.module-card:hover { transform: none; } }
</style>
