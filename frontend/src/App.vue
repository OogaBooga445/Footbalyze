<template>
  <div id="app">
    <header class="app-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand" @click="closeMenu">Footbalyze</RouterLink>

        <!-- Desktop nav -->
        <nav class="navbar desktop-nav">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/teams" class="nav-link">Teams</RouterLink>
          <RouterLink to="/table" class="nav-link">Table</RouterLink>
          <RouterLink to="/leagues" class="nav-link">Leagues</RouterLink>
          <RouterLink to="/matches" class="nav-link">Matches</RouterLink>
          <RouterLink to="/players" class="nav-link">Players</RouterLink>
          <RouterLink to="/h2h" class="nav-link">H2H</RouterLink>
          <RouterLink to="/leaderboard" class="nav-link">Leaderboard</RouterLink>
          <RouterLink v-if="isLoggedIn" to="/dashboard" class="nav-link">Dashboard</RouterLink>

          <SearchBar />

          <div class="account-dropdown-wrapper">
            <button class="account-btn" @click="onAccountClick">
              {{ isLoggedIn ? user.username : 'Account' }}
            </button>

            <div v-if="showDropdown" class="dropdown-menu">
              <template v-if="!isLoggedIn">
                <button class="dropdown-item" @click="loginClick">Login</button>
                <button class="dropdown-item" @click="registerClick">Register</button>
              </template>
              <template v-else>
                <RouterLink class="dropdown-item" to="/account" @click="showDropdown = false">My Account</RouterLink>
                <RouterLink class="dropdown-item" to="/settings" @click="showDropdown = false">Settings</RouterLink>
                <RouterLink v-if="user?.role?.toLowerCase() === 'admin'" class="dropdown-item dropdown-item--admin" to="/admin" @click="showDropdown = false">Admin Panel</RouterLink>
                <button class="dropdown-item dropdown-item--danger" @click="logout">Logout</button>
              </template>
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
        <RouterLink to="/" class="mob-link" @click="closeMenu">Home</RouterLink>
        <RouterLink to="/teams" class="mob-link" @click="closeMenu">Teams</RouterLink>
        <RouterLink to="/table" class="mob-link" @click="closeMenu">Table</RouterLink>
        <RouterLink to="/leagues" class="mob-link" @click="closeMenu">Leagues</RouterLink>
        <RouterLink to="/matches" class="mob-link" @click="closeMenu">Matches</RouterLink>
        <RouterLink to="/players" class="mob-link" @click="closeMenu">Players</RouterLink>
        <RouterLink to="/h2h" class="mob-link" @click="closeMenu">H2H</RouterLink>
        <RouterLink to="/leaderboard" class="mob-link" @click="closeMenu">Leaderboard</RouterLink>

        <div class="mob-divider"></div>

        <template v-if="!isLoggedIn">
          <RouterLink to="/login" class="mob-link" @click="closeMenu">Login</RouterLink>
          <RouterLink to="/register" class="mob-link" @click="closeMenu">Register</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/account" class="mob-link" @click="closeMenu">My Account</RouterLink>
          <RouterLink to="/dashboard" class="mob-link" @click="closeMenu">Dashboard</RouterLink>
          <RouterLink to="/settings" class="mob-link" @click="closeMenu">Settings</RouterLink>
          <RouterLink v-if="user?.role?.toLowerCase() === 'admin'" to="/admin" class="mob-link mob-link--admin" @click="closeMenu">Admin Panel</RouterLink>
          <button class="mob-link mob-link--danger" @click="logoutMobile">Logout</button>
        </template>
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
import SearchBar from './components/SearchBar.vue'

const store = useStore()
const router = useRouter()
const route  = useRoute()

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
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(4, 8, 15, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent-green-hover);
  text-decoration: none;
  letter-spacing: -0.02em;
  transition: color 0.2s;
  flex-shrink: 0;
}
.brand:hover { color: #fff; }

/* ── Desktop nav ─────────────────────────────────────────────────────────── */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s, background 0.2s;
  position: relative;
  white-space: nowrap;
}
.nav-link:hover { color: var(--text-primary); background: var(--bg-surface-2); }
.nav-link.router-link-active,
.nav-link.router-link-exact-active { color: var(--accent-green-hover); }
.nav-link.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background: var(--accent-green);
  border-radius: 1px;
}

.account-btn {
  background: var(--accent-green);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.25);
  white-space: nowrap;
}
.account-btn:hover { background: var(--accent-green-hover); }

.account-dropdown-wrapper { position: relative; }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  min-width: 160px;
  z-index: 200;
  overflow: hidden;
}

.dropdown-item {
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  text-align: left;
  padding: 0.65rem 1rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: block;
  transition: background 0.15s;
}
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:hover { background: var(--bg-surface-2); }
.dropdown-item--admin { color: var(--accent-hover); }
.dropdown-item--danger { color: var(--lose); }
.dropdown-item--danger:hover { background: rgba(218, 54, 51, 0.1); }

/* ── Mobile controls (hamburger + search) ────────────────────────────────── */
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
  border-radius: var(--radius);
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
.hamburger:hover span { background: var(--text-primary); }

/* Animate to X when open */
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Mobile drawer ───────────────────────────────────────────────────────── */
.mobile-drawer {
  display: flex;
  flex-direction: column;
  background: rgba(4, 8, 15, 0.97);
  border-top: 1px solid var(--border);
  padding: 0.5rem 0 1rem;
}

.mob-link {
  display: block;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  width: 100%;
}
.mob-link:hover,
.mob-link.router-link-active { color: var(--text-primary); background: rgba(255,255,255,0.04); }
.mob-link--admin { color: var(--accent-hover); }
.mob-link--danger { color: var(--lose); }

.mob-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.5rem 0;
}

/* ── Responsive breakpoint ───────────────────────────────────────────────── */
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
