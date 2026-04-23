<template>
  <div id="app">
    <header class="app-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand" @click="closeMenu">
          Footbalyze
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="navbar desktop-nav">
          <RouterLink to="/" class="nav-link">{{ $t('nav.home') }}</RouterLink>
          <RouterLink to="/teams" class="nav-link">{{ $t('nav.teams') }}</RouterLink>
          <RouterLink to="/table" class="nav-link">{{ $t('nav.table') }}</RouterLink>
          <RouterLink to="/leagues" class="nav-link">{{ $t('nav.leagues') }}</RouterLink>
          <RouterLink to="/matches" class="nav-link">{{ $t('nav.matches') }}</RouterLink>
          <RouterLink to="/players" class="nav-link">{{ $t('nav.players') }}</RouterLink>
          <RouterLink to="/h2h" class="nav-link">{{ $t('nav.h2h') }}</RouterLink>
          <RouterLink to="/leaderboard" class="nav-link">{{ $t('nav.leaderboard') }}</RouterLink>
          <RouterLink v-if="isLoggedIn" to="/dashboard" class="nav-link">{{ $t('nav.dashboard') }}</RouterLink>

          <div class="nav-utils">
            <SearchBar />

            <button class="lang-toggle" @click="toggleLocale">{{ locale === 'en' ? 'LV' : 'EN' }}</button>

            <div class="account-dropdown-wrapper">
              <button class="account-btn" @click="onAccountClick">
                {{ isLoggedIn ? user.username : $t('nav.account') }}
              </button>

              <div v-if="showDropdown" class="dropdown-menu">
                <template v-if="!isLoggedIn">
                  <button class="dropdown-item" @click="loginClick">{{ $t('nav.login') }}</button>
                  <button class="dropdown-item" @click="registerClick">{{ $t('nav.register') }}</button>
                </template>
                <template v-else>
                  <RouterLink class="dropdown-item" to="/account" @click="showDropdown = false">{{ $t('nav.myAccount') }}</RouterLink>
                  <RouterLink class="dropdown-item" to="/settings" @click="showDropdown = false">{{ $t('nav.settings') }}</RouterLink>
                  <RouterLink v-if="user?.role?.toLowerCase() === 'admin'" class="dropdown-item dropdown-item--admin" to="/admin" @click="showDropdown = false">{{ $t('nav.adminPanel') }}</RouterLink>
                  <button class="dropdown-item dropdown-item--danger" @click="logout">{{ $t('nav.logout') }}</button>
                </template>
              </div>
            </div>
          </div>
        </nav>

        <!-- Mobile right side: search icon + hamburger -->
        <div class="mobile-controls">
          <SearchBar />
          <button class="hamburger" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <!-- Mobile drawer -->
      <nav v-if="menuOpen" class="mobile-drawer">
        <RouterLink to="/" class="mob-link" @click="closeMenu">{{ $t('nav.home') }}</RouterLink>
        <RouterLink to="/teams" class="mob-link" @click="closeMenu">{{ $t('nav.teams') }}</RouterLink>
        <RouterLink to="/table" class="mob-link" @click="closeMenu">{{ $t('nav.table') }}</RouterLink>
        <RouterLink to="/leagues" class="mob-link" @click="closeMenu">{{ $t('nav.leagues') }}</RouterLink>
        <RouterLink to="/matches" class="mob-link" @click="closeMenu">{{ $t('nav.matches') }}</RouterLink>
        <RouterLink to="/players" class="mob-link" @click="closeMenu">{{ $t('nav.players') }}</RouterLink>
        <RouterLink to="/h2h" class="mob-link" @click="closeMenu">{{ $t('nav.h2h') }}</RouterLink>
        <RouterLink to="/leaderboard" class="mob-link" @click="closeMenu">{{ $t('nav.leaderboard') }}</RouterLink>

        <div class="mob-divider"></div>

        <template v-if="!isLoggedIn">
          <RouterLink to="/login" class="mob-link" @click="closeMenu">{{ $t('nav.login') }}</RouterLink>
          <RouterLink to="/register" class="mob-link" @click="closeMenu">{{ $t('nav.register') }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/account" class="mob-link" @click="closeMenu">{{ $t('nav.myAccount') }}</RouterLink>
          <RouterLink to="/dashboard" class="mob-link" @click="closeMenu">{{ $t('nav.dashboard') }}</RouterLink>
          <RouterLink to="/settings" class="mob-link" @click="closeMenu">{{ $t('nav.settings') }}</RouterLink>
          <RouterLink v-if="user?.role?.toLowerCase() === 'admin'" to="/admin" class="mob-link mob-link--admin" @click="closeMenu">{{ $t('nav.adminPanel') }}</RouterLink>
          <button class="mob-link mob-link--danger" @click="logoutMobile">{{ $t('nav.logout') }}</button>
        </template>

        <div class="mob-divider"></div>
        <button class="mob-link" @click="toggleLocale">{{ locale === 'en' ? '🌐 Latviski' : '🌐 English' }}</button>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SearchBar from './components/SearchBar.vue'

const store = useStore()
const router = useRouter()
const route  = useRoute()
const { locale } = useI18n()

function toggleLocale() {
  locale.value = locale.value === 'en' ? 'lv' : 'en'
  localStorage.setItem('locale', locale.value)
}

const isLoggedIn = computed(() => !!store.state.user)
const user = computed(() => store.state.user)

const showDropdown = ref(false)
const menuOpen = ref(false)

// Close mobile menu on route change
watch(() => route.path, () => { menuOpen.value = false })

function closeMenu() {
  menuOpen.value = false
}

function onAccountClick() {
  if (isLoggedIn.value) {
    router.push('/account')
    showDropdown.value = false
  } else {
    showDropdown.value = !showDropdown.value
  }
}

function loginClick() {
  showDropdown.value = false
  router.push('/login')
}

function registerClick() {
  showDropdown.value = false
  router.push('/register')
}

function logout() {
  showDropdown.value = false
  store.dispatch('logout')
  router.push('/')
}

function logoutMobile() {
  closeMenu()
  store.dispatch('logout')
  router.push('/')
}

function handleOutsideClick(e) {
  const wrapper = document.querySelector('.account-dropdown-wrapper')
  if (wrapper && !wrapper.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})
</script>

<style scoped>
/* ── Header shell ────────────────────────────────────────────────────────── */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 20, 25, 0.9);
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
  backdrop-filter: blur(20px);
}

/* Amber rule across the top */
.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #f59e0b 30%, #fbbf24 50%, #f59e0b 70%, transparent 100%);
  opacity: 0.7;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ── Brand ───────────────────────────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.2rem;
  font-weight: 800;
  color: #f1f5f9;
  text-decoration: none;
  letter-spacing: -0.03em;
  flex-shrink: 0;
  transition: color 0.2s;
}
.brand:hover { color: #fff; }


/* ── Desktop nav ─────────────────────────────────────────────────────────── */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.15s, background 0.15s;
  white-space: nowrap;
}
.nav-link:hover { color: var(--text-primary); }
.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  font-weight: 600;
}

/* ── Utility controls ────────────────────────────────────────────────────── */
.nav-utils {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.lang-toggle {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.28rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.lang-toggle:hover { color: #f59e0b; border-color: rgba(245,158,11,0.4); }

.account-btn {
  background: #f59e0b;
  color: #0f1419;
  border: none;
  border-radius: 6px;
  padding: 0.38rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  letter-spacing: -0.01em;
}
.account-btn:hover { background: #fbbf24; }

/* ── Dropdown ────────────────────────────────────────────────────────────── */
.account-dropdown-wrapper { position: relative; }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #141c27;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  min-width: 170px;
  z-index: 200;
  overflow: hidden;
}

.dropdown-item {
  background: none;
  border: none;
  border-bottom: 1px solid rgba(245, 158, 11, 0.08);
  text-align: left;
  padding: 0.65rem 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: block;
  transition: background 0.12s, color 0.12s;
}
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:hover { background: rgba(245,158,11,0.06); color: var(--text-primary); }
.dropdown-item--admin { color: #f59e0b; }
.dropdown-item--danger { color: var(--lose); }
.dropdown-item--danger:hover { background: rgba(239, 68, 68, 0.08); }

/* ── Mobile controls ─────────────────────────────────────────────────────── */
.mobile-controls {
  display: none;
  align-items: center;
  gap: 0.5rem;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  width: 36px;
  height: 36px;
}
.hamburger span {
  display: block;
  height: 2px;
  background: var(--text-secondary);
  border-radius: 2px;
  transition: transform 0.2s, opacity 0.2s, background 0.2s;
  transform-origin: center;
}
.hamburger:hover span { background: #f59e0b; }
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Mobile drawer ───────────────────────────────────────────────────────── */
.mobile-drawer {
  display: flex;
  flex-direction: column;
  background: #0f1419;
  border-top: 1px solid rgba(245, 158, 11, 0.1);
  padding: 0.75rem 0 1.25rem;
}

.mob-link {
  display: block;
  padding: 0.7rem 1.5rem;
  color: var(--text-muted);
  font-size: 0.975rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  border-left: 3px solid transparent;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s, border-left-color 0.15s, background 0.15s;
  width: 100%;
}
.mob-link:hover { color: var(--text-primary); }
.mob-link.router-link-active {
  color: #f59e0b;
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}
.mob-link--admin { color: #f59e0b; }
.mob-link--danger { color: var(--lose); }

.mob-divider {
  border: none;
  border-top: 1px solid rgba(245, 158, 11, 0.08);
  margin: 0.5rem 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .desktop-nav { display: none; }
  .mobile-controls { display: flex; }
  .mobile-drawer { display: flex; }
}

/* ── App layout ──────────────────────────────────────────────────────────── */
.app-main {
  flex: 1;
  width: 100%;
  position: relative;
  z-index: 1;
}
</style>
