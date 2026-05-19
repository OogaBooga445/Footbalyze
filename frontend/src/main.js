import './assets/main.css'
const _flagStyle = document.createElement('style')
_flagStyle.textContent = `@font-face {
  font-family: "Twemoji Country Flags";
  unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067,
    U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
  src: url('/TwemojiCountryFlags.woff2') format('woff2');
  font-display: swap;
}`
document.head.appendChild(_flagStyle)

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import store from './store/store.js'
import en from './locales/en.js'
import lv from './locales/lv.js'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages: { en, lv },
})

const app = createApp(App)

app.use(router)
app.use(store)
app.use(i18n)

app.mount('#app')
