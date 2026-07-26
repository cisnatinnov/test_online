import { createI18n } from 'vue-i18n'
import enGB from './en-GB.json'
import enUS from './en-US.json'
import id from './id.json'
import es from './es.json'
import pt from './pt.json'

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null

const i18n = createI18n({
  legacy: false,
  locale: saved || 'en-GB',
  fallbackLocale: 'en-GB',
  messages: { 'en-GB': enGB, 'en-US': enUS, id, es, pt },
})

export default i18n
