<template>
  <div class="profile-page">

    <!-- ── Profile header ──────────────────────────────────────────────────── -->
    <div class="profile-header">
      <div class="header-glow"></div>
      <div class="header-inner">
        <!-- Avatar: click to upload -->
        <div class="avatar-wrap" @click="triggerUpload" :class="{ uploading: avatarUploading }" title="Change profile picture">
          <img v-if="previewUrl || avatarUrl" :src="previewUrl || avatarUrl" class="avatar avatar-img" alt="Profile" />
          <div v-else class="avatar">{{ username.charAt(0).toUpperCase() }}</div>
          <div class="avatar-overlay">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />
        </div>
        <div class="header-info">
          <div class="header-top">
            <h1 class="profile-name">{{ username }}</h1>
            <span class="role-badge" :class="role?.toLowerCase() === 'admin' ? 'role-admin' : ''">
              {{ role }}
            </span>
          </div>
          <p class="profile-email">{{ email }}</p>
        </div>
        <div class="header-actions">
          <RouterLink to="/settings" class="icon-btn" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {{ $t('account.settings') }}
          </RouterLink>
          <RouterLink v-if="role?.toLowerCase() === 'admin'" to="/admin" class="icon-btn icon-btn--admin" title="Admin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {{ $t('account.admin') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="profile-body">

      <!-- ── Prediction stats ─────────────────────────────────────────────── -->
      <section class="card">
        <h2 class="card-title">{{ $t('account.predPerf') }}</h2>

        <div v-if="statsLoading" class="card-loading">{{ $t('account.loadingStats') }}</div>

        <template v-else-if="stats">
          <div class="perf-strip">
            <div class="perf-stat">
              <span class="perf-val perf-val--pts">{{ stats.points }}</span>
              <span class="perf-lbl">{{ $t('account.points') }}</span>
            </div>
            <div class="perf-divider"></div>
            <div class="perf-stat">
              <span class="perf-val">{{ accuracy }}%</span>
              <span class="perf-lbl">{{ $t('account.accuracy') }}</span>
            </div>
            <div class="perf-divider"></div>
            <div class="perf-stat">
              <span class="perf-val perf-val--rank">#{{ rank }}</span>
              <span class="perf-lbl">{{ $t('account.leaderboard') }}</span>
            </div>
            <div class="perf-divider"></div>
            <div class="perf-stat">
              <span class="perf-val">{{ stats.total }}</span>
              <span class="perf-lbl">{{ $t('account.resolved') }}</span>
            </div>
          </div>

          <div class="outcome-bar">
            <div class="oc exact" :style="{ flex: +stats.exact_count || 0 }"></div>
            <div class="oc correct" :style="{ flex: +stats.correct_count || 0 }"></div>
            <div class="oc wrong" :style="{ flex: +stats.wrong_count || 0 }"></div>
          </div>

          <div class="outcome-legend">
            <span class="leg exact">🎯 {{ stats.exact_count }} {{ $t('leaderboardCols.exact') }}</span>
            <span class="leg correct">✓ {{ stats.correct_count }} {{ $t('leaderboardCols.correct') }}</span>
            <span class="leg wrong">✗ {{ stats.wrong_count }} {{ $t('leaderboardCols.wrong') }}</span>
          </div>

          <RouterLink to="/leaderboard" class="card-link">{{ $t('account.viewLeaderboard') }}</RouterLink>
        </template>

        <div v-else class="stats-empty">
          <p>{{ $t('account.noPredictions') }}</p>
          <RouterLink to="/dashboard" class="card-link">{{ $t('account.toDashboard') }}</RouterLink>
        </div>
      </section>

      <!-- ── Quick nav ────────────────────────────────────────────────────── -->
      <section class="card">
        <h2 class="card-title">{{ $t('account.quickNav') }}</h2>
        <div class="nav-grid">
          <RouterLink to="/dashboard" class="nav-card">
            <span class="nav-icon">⭐</span>
            <span class="nav-label">{{ $t('account.dashboardLabel') }}</span>
            <span class="nav-desc">{{ $t('account.dashboardDesc') }}</span>
          </RouterLink>
          <RouterLink to="/leaderboard" class="nav-card">
            <span class="nav-icon">🏆</span>
            <span class="nav-label">{{ $t('account.leaderboard') }}</span>
            <span class="nav-desc">{{ $t('account.leaderboardDesc') }}</span>
          </RouterLink>
          <RouterLink to="/matches" class="nav-card">
            <span class="nav-icon">📅</span>
            <span class="nav-label">{{ $t('account.matchesLabel') }}</span>
            <span class="nav-desc">{{ $t('account.matchesDesc') }}</span>
          </RouterLink>
          <RouterLink to="/table" class="nav-card">
            <span class="nav-icon">📊</span>
            <span class="nav-label">{{ $t('account.tableLabel') }}</span>
            <span class="nav-desc">{{ $t('account.tableDesc') }}</span>
          </RouterLink>
          <RouterLink to="/players" class="nav-card">
            <span class="nav-icon">👤</span>
            <span class="nav-label">{{ $t('account.playersLabel') }}</span>
            <span class="nav-desc">{{ $t('account.playersDesc') }}</span>
          </RouterLink>
          <RouterLink to="/h2h" class="nav-card">
            <span class="nav-icon">⚡</span>
            <span class="nav-label">{{ $t('account.h2hLabel') }}</span>
            <span class="nav-desc">{{ $t('account.h2hDesc') }}</span>
          </RouterLink>
        </div>
      </section>

      <!-- ── Danger zone ──────────────────────────────────────────────────── -->
      <div class="danger-zone">
        <button class="logout-btn" @click="handleLogout">{{ $t('account.signOut', { name: username }) }}</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import api from '../services/api'

const store = useStore()
const router = useRouter()

const statsLoading = ref(true)
const stats = ref(null)
const rank = ref(null)
const avatarUploading = ref(false)
const previewUrl = ref(null)
const fileInput = ref(null)

const username  = computed(() => store.state.user?.username  || 'User')
const email     = computed(() => store.state.user?.email     || '-')
const role      = computed(() => store.state.user?.role      || 'user')
const avatarUrl = computed(() => store.state.user?.avatarUrl || null)
const accuracy  = computed(() => {
  if (!stats.value || !stats.value.total) return 0
  return Math.round(((+stats.value.exact_count + +stats.value.correct_count) / +stats.value.total) * 100)
})

onMounted(async () => {
  try {
    const res = await api.get('/user/me')
    if (res.data.avatarUrl) store.commit('setAvatar', res.data.avatarUrl)
  } catch { /* silent */ }

  try {
    const res = await api.get('/predictions/leaderboard')
    const rows = res.data
    const idx = rows.findIndex(r => r.Username === username.value)
    if (idx !== -1) { stats.value = rows[idx]; rank.value = idx + 1 }
  } catch { /* silent */ } finally {
    statsLoading.value = false
  }
})

function triggerUpload() {
  fileInput.value.click()
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  previewUrl.value = URL.createObjectURL(file)
  avatarUploading.value = true
  try {
    const form = new FormData()
    form.append('avatar', file)
    const res = await api.post('/user/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    store.commit('setAvatar', res.data.avatarUrl)
    previewUrl.value = null
  } catch {
    previewUrl.value = null
    store.commit('setAvatar', null)
  } finally {
    avatarUploading.value = false
    e.target.value = ''
  }
}

function handleLogout() {
  store.dispatch('logout')
  router.push('/')
}
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

/* ── Profile header ──────────────────────────────────────────────────────── */
.profile-header {
  position: relative;
  background: #141c27;
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
  overflow: hidden;
  padding: 2.5rem 1.5rem 2rem;
}

.header-glow {
  display: none;
}

.header-inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

/* Avatar upload */
.avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
}
.avatar-wrap:hover .avatar-overlay { opacity: 1; }
.avatar-wrap.uploading .avatar-overlay { opacity: 1; background: rgba(0,0,0,0.5); }

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f59e0b;
  color: #0f1419;
  font-size: 1.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2), 0 4px 20px rgba(0,0,0,0.4);
}

.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2), 0 4px 20px rgba(0,0,0,0.4);
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-input {
  display: none;
}

.header-info { flex: 1; min-width: 0; }

.header-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.2rem;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  margin: 0;
}

.role-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.role-badge.role-admin {
  background: rgba(59,130,246,0.1);
  color: var(--accent-hover);
  border-color: rgba(59,130,246,0.25);
}

.profile-email {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.icon-btn:hover { border-color: var(--text-muted); color: var(--text-primary); }
.icon-btn--admin {
  background: rgba(59,130,246,0.08);
  border-color: rgba(59,130,246,0.25);
  color: var(--accent-hover);
}
.icon-btn--admin:hover { background: rgba(59,130,246,0.15); border-color: var(--accent-hover); }

/* ── Body ────────────────────────────────────────────────────────────────── */
.profile-body {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  padding: 1.75rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Cards ───────────────────────────────────────────────────────────────── */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0;
}

.card-loading {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}

.card-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-hover);
  text-decoration: none;
  align-self: flex-start;
}
.card-link:hover { text-decoration: underline; }

/* ── Performance strip ───────────────────────────────────────────────────── */
.perf-strip {
  display: flex;
  align-items: center;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.perf-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 1rem 0.5rem;
}

.perf-val {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.5px;
}
.perf-val--pts  { color: var(--accent-hover); }
.perf-val--rank { color: #facc15; }

.perf-lbl {
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.perf-divider {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  flex-shrink: 0;
}

/* Outcome progress bar */
.outcome-bar {
  display: flex;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  gap: 2px;
}
.oc { border-radius: 999px; min-width: 4px; }
.oc.exact   { background: var(--win); }
.oc.correct { background: var(--accent); }
.oc.wrong   { background: var(--lose); }

.outcome-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.leg {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}
.leg.exact   { color: var(--win); }
.leg.correct { color: var(--accent-hover); }
.leg.wrong   { color: var(--lose); }

.stats-empty { display: flex; flex-direction: column; gap: 0.5rem; }
.stats-empty p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

/* ── Nav grid ────────────────────────────────────────────────────────────── */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

@media (max-width: 520px) { .nav-grid { grid-template-columns: repeat(2, 1fr); } }

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.nav-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-surface-2);
  transform: translateY(-2px);
}

.nav-icon { font-size: 1.3rem; line-height: 1; margin-bottom: 0.2rem; }
.nav-label { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.nav-desc  { font-size: 0.72rem; color: var(--text-muted); line-height: 1.3; }

/* ── Danger zone ─────────────────────────────────────────────────────────── */
.danger-zone {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--lose);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  opacity: 0.7;
  transition: opacity 0.15s, background 0.15s;
}
.logout-btn:hover { opacity: 1; background: rgba(239,68,68,0.08); }

/* ── Mobile ──────────────────────────────────────────────────────────────── */
@media (max-width: 500px) {
  .profile-header { padding: 1.75rem 1.25rem 1.5rem; }
  .avatar-wrap { width: 56px; height: 56px; }
  .avatar, .avatar-img { width: 56px; height: 56px; font-size: 1.5rem; }
  .profile-name { font-size: 1.25rem; }
  .header-actions { display: none; }
  .profile-body { padding: 1.25rem 1rem 3rem; }
  .perf-val { font-size: 1.3rem; }
  .perf-stat { padding: 0.75rem 0.25rem; }
}
</style>
