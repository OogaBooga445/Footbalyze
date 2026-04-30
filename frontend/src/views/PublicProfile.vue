<template>
  <!-- Loading -->
  <div v-if="loading" class="profile-page">
    <p class="loading-text">Loading profile…</p>
  </div>

  <!-- Not found -->
  <div v-else-if="notFound" class="profile-page profile-page--centered">
    <div class="not-found-card">
      <span class="not-found-icon">👤</span>
      <h2>Profile not found</h2>
      <p>No user with the username <strong>{{ $route.params.username }}</strong> exists.</p>
      <RouterLink to="/" class="btn-primary">Go home</RouterLink>
    </div>
  </div>

  <!-- Profile -->
  <div v-else-if="profile" class="profile-page">

    <!-- Header -->
    <div class="profile-header">
      <div class="profile-avatar">
        <img v-if="profile.avatarUrl" :src="profile.avatarUrl" class="profile-avatar-img" :alt="profile.username" />
        <span v-else class="profile-avatar-initials">{{ profile.username.charAt(0).toUpperCase() }}</span>
      </div>
      <div class="profile-header-info">
        <h1 class="profile-username">{{ profile.username }}</h1>
        <span v-if="isOwnProfile" class="own-profile-badge">This is you</span>
      </div>
      <RouterLink v-if="isOwnProfile" to="/dashboard" class="btn-secondary">Go to dashboard</RouterLink>
    </div>

    <!-- Favourites row -->
    <div class="fav-row">

      <!-- Favourite team -->
      <div class="fav-card">
        <h2 class="section-title">Favourite team</h2>

        <div v-if="teamDetail" class="fav-team-display">
          <div class="team-display-top">
            <div class="team-crest-wrap">
              <img v-if="teamDetail.Crest" :src="teamDetail.Crest" class="team-crest-img" :alt="teamDetail.Team_Name" />
              <div v-else class="team-crest-letter">{{ teamDetail.Team_Name.charAt(0) }}</div>
            </div>
            <div class="team-display-info">
              <span class="team-display-name">{{ teamDetail.Team_Name }}</span>
              <div class="team-meta-row">
                <span v-if="teamDetail.leagueName" class="meta-chip">{{ teamDetail.leagueName }}</span>
                <span v-if="teamDetail.tableRow" class="meta-chip meta-chip--pos">
                  <span v-if="teamDetail.leagueCode" class="chip-flag">{{ leagueFlagMap[teamDetail.leagueCode] || '🏆' }}</span>
                  {{ ordinal(teamDetail.tableRow.Position) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="teamDetail.tableRow" class="stat-strip">
            <div class="strip-item">
              <span class="strip-val strip-val--pts">{{ teamDetail.tableRow.Pts }}</span>
              <span class="strip-lbl">Pts</span>
            </div>
            <div class="strip-divider"></div>
            <div class="strip-item">
              <span class="strip-val strip-val--win">{{ teamDetail.tableRow.W }}</span>
              <span class="strip-lbl">W</span>
            </div>
            <div class="strip-item">
              <span class="strip-val strip-val--draw">{{ teamDetail.tableRow.D }}</span>
              <span class="strip-lbl">D</span>
            </div>
            <div class="strip-item">
              <span class="strip-val strip-val--lose">{{ teamDetail.tableRow.L }}</span>
              <span class="strip-lbl">L</span>
            </div>
            <div class="strip-divider"></div>
            <div class="strip-item">
              <span class="strip-val" :class="teamDetail.tableRow.GD > 0 ? 'strip-val--win' : teamDetail.tableRow.GD < 0 ? 'strip-val--lose' : ''">
                {{ teamDetail.tableRow.GD > 0 ? '+' : '' }}{{ teamDetail.tableRow.GD }}
              </span>
              <span class="strip-lbl">GD</span>
            </div>
          </div>

          <div v-if="teamForm.length" class="form-row">
            <span class="form-label">Form</span>
            <div class="form-dots">
              <span
                v-for="(r, i) in teamForm"
                :key="i"
                class="form-dot"
                :class="`form-dot--${r}`"
                :title="r === 'win' ? 'W' : r === 'draw' ? 'D' : 'L'"
              ></span>
            </div>
          </div>

          <RouterLink :to="`/teams/${teamDetail.Team_ID}`" class="view-link">View squad</RouterLink>
        </div>

        <div v-else-if="teamLoading" class="loading-text">Loading…</div>
        <p v-else class="no-fav">No favourite team set.</p>
      </div>

      <!-- Favourite player -->
      <div class="fav-card">
        <h2 class="section-title">Favourite player</h2>

        <div v-if="profile.favPlayerMeta" class="fav-player-display">
          <div class="player-display-top">
            <div class="player-avatar" :class="`avatar-${posClass(profile.favPlayerMeta.Position)}`">
              {{ profile.favPlayerMeta.Player_Name.charAt(0) }}
            </div>
            <div class="player-display-info">
              <div class="player-name-row">
                <span class="player-display-name">{{ profile.favPlayerMeta.Player_Name }}</span>
              </div>
              <div class="player-meta-row">
                <span class="pos-badge" :class="`pos-badge--${posClass(profile.favPlayerMeta.Position)}`">
                  {{ posAbbr(profile.favPlayerMeta.DetailedPosition) }}
                </span>
                <span class="meta-chip">{{ profile.favPlayerMeta.Team_Name }}</span>
                <span v-if="profile.favPlayerMeta.Nationality" class="meta-chip nat-chip">
                  {{ nationalityFlag(profile.favPlayerMeta.Nationality) }} {{ profile.favPlayerMeta.Nationality }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="no-fav">No favourite player set.</p>
      </div>
    </div>

    <!-- Watchlist -->
    <div class="full-card">
      <div class="section-title-row">
        <h2 class="section-title">Watchlist</h2>
        <span v-if="profile.watchlist.length" class="dash-tab-count">{{ profile.watchlist.length }}</span>
      </div>

      <div v-if="profile.watchlist.length" class="watchlist-grid">
        <div v-for="p in profile.watchlist" :key="p.Player_ID" class="watchlist-card">
          <div class="watchlist-card-top">
            <div class="player-avatar player-avatar--sm" :class="`avatar-${posClass(p.Position)}`">
              {{ (p.Player_Name || '?').charAt(0) }}
            </div>
            <div class="watchlist-card-info">
              <span class="watchlist-player-name">{{ p.Player_Name }}</span>
              <span class="watchlist-team-name">{{ p.Team_Name }}</span>
            </div>
          </div>
          <div class="watchlist-card-meta">
            <span class="pos-badge pos-badge--sm" :class="`pos-badge--${posClass(p.Position)}`">{{ posAbbr(p.DetailedPosition) }}</span>
            <span v-if="p.Nationality" class="meta-chip">{{ nationalityFlag(p.Nationality) }}</span>
            <span v-if="p.LeagueCode" class="meta-chip">{{ leagueFlagMap[p.LeagueCode] || '🏆' }} {{ p.LeagueCode }}</span>
          </div>
        </div>
      </div>

      <p v-else class="no-fav">Watchlist is empty.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useStore } from 'vuex'
import api from '../services/api'
import { nationalityFlag, posClass, posAbbr } from '../utils/football'

const route = useRoute()
const store = useStore()

const loading = ref(true)
const notFound = ref(false)
const profile = ref(null)
const teamDetail = ref(null)
const teamLoading = ref(false)

const loggedInUser = computed(() => store.state.user)
const isOwnProfile = computed(() =>
  loggedInUser.value?.username?.toLowerCase() === profile.value?.username?.toLowerCase()
)

const playerLeagues = [
  { code: 'PL',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  flag: '🇪🇸' },
  { code: 'BL1', flag: '🇩🇪' },
  { code: 'SA',  flag: '🇮🇹' },
  { code: 'FL1', flag: '🇫🇷' },
  { code: 'ELC', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PPL', flag: '🇵🇹' },
  { code: 'DED', flag: '🇳🇱' },
  { code: 'BSA', flag: '🇧🇷' },
]
const leagueFlagMap = Object.fromEntries(playerLeagues.map(l => [l.code, l.flag]))

const teamForm = computed(() => {
  if (!teamDetail.value?.recentMatches) return []
  return [...teamDetail.value.recentMatches]
    .slice(-5)
    .map(m => {
      if (!m.Score || !m.Score.includes('-')) return 'draw'
      const [h, a] = m.Score.split('-').map(Number)
      if (m.HomeTeamID === profile.value?.favTeamId) return h > a ? 'win' : h < a ? 'lose' : 'draw'
      if (m.AwayTeamID === profile.value?.favTeamId) return a > h ? 'win' : a < h ? 'lose' : 'draw'
      return 'draw'
    })
})

function ordinal(n) {
  if (!n) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

async function fetchTeamDetail(teamId) {
  if (!teamId) return
  teamLoading.value = true
  try {
    const res = await api.get(`/teams/${teamId}`)
    teamDetail.value = res.data
  } catch {
    teamDetail.value = null
  } finally {
    teamLoading.value = false
  }
}

onMounted(async () => {
  const username = route.params.username
  try {
    const res = await api.get(`/users/${username}`)
    profile.value = res.data
    if (profile.value.favTeamId) {
      fetchTeamDetail(profile.value.favTeamId)
    }
  } catch (err) {
    if (err.response?.status === 404) {
      notFound.value = true
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-page--centered {
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
}

/* ── Not found ─────────────────────────────────────────────────────────────── */
.not-found-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  max-width: 380px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.not-found-icon { font-size: 2.5rem; line-height: 1; }
.not-found-card h2 { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
.not-found-card p  { color: var(--text-secondary); font-size: 0.95rem; }

/* ── Profile header ─────────────────────────────────────────────────────────── */
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid var(--border);
}
.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-avatar-initials {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
}

.profile-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.profile-username {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.own-profile-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-hover);
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 2px 10px;
  width: fit-content;
}

/* ── Two-col fav row ─────────────────────────────────────────────────────────── */
.fav-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 680px) { .fav-row { grid-template-columns: 1fr; } }

/* ── Cards ──────────────────────────────────────────────────────────────────── */
.fav-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.full-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Team display ────────────────────────────────────────────────────────────── */
.fav-team-display { display: flex; flex-direction: column; gap: 0.85rem; }
.team-display-top { display: flex; align-items: center; gap: 1rem; }

.team-crest-wrap {
  width: 56px; height: 56px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0c1e3d 0%, #152033 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}
.team-crest-img { width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4)); }
.team-crest-letter { font-size: 1.4rem; font-weight: 800; color: var(--accent-hover); }

.team-display-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.team-display-name { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.team-meta-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.meta-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.72rem; font-weight: 600; color: var(--text-secondary);
  background: var(--bg-surface-2); border: 1px solid var(--border);
  border-radius: 999px; padding: 0.15rem 0.55rem; white-space: nowrap;
}
.chip-flag { font-size: 1rem; line-height: 1; }
.nat-chip { gap: 0.3rem; }
.meta-chip--pos { color: var(--accent-hover); background: var(--accent-muted); border-color: var(--accent); }

.stat-strip {
  display: flex; align-items: center; gap: 0.6rem;
  background: var(--bg-surface-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 0.6rem 0.85rem;
}
.strip-item { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; flex: 1; }
.strip-val { font-size: 1rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.strip-val--pts  { color: var(--accent-hover); }
.strip-val--win  { color: var(--win); }
.strip-val--draw { color: var(--draw); }
.strip-val--lose { color: var(--lose); }
.strip-lbl { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.strip-divider { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }

.form-row { display: flex; align-items: center; gap: 0.6rem; }
.form-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.form-dots { display: flex; gap: 0.3rem; }
.form-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.form-dot--win  { background: var(--win); }
.form-dot--lose { background: var(--lose); }
.form-dot--draw { background: var(--draw); }

.view-link { font-size: 0.82rem; font-weight: 700; color: var(--accent-hover); text-decoration: none; transition: color 0.15s; width: fit-content; }
.view-link:hover { color: #fff; text-decoration: underline; }

/* ── Player display ──────────────────────────────────────────────────────────── */
.fav-player-display { display: flex; flex-direction: column; gap: 0.85rem; }
.player-display-top { display: flex; align-items: flex-start; gap: 0.85rem; }

.player-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  font-size: 1.3rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.avatar-gk      { background: linear-gradient(135deg, var(--pos-gk),  #b45309); box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
.avatar-def     { background: linear-gradient(135deg, var(--pos-def), #1d4ed8); box-shadow: 0 4px 14px rgba(59,130,246,0.3); }
.avatar-mid     { background: linear-gradient(135deg, var(--pos-mid), #059669); box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
.avatar-fwd     { background: linear-gradient(135deg, var(--pos-fwd), #b91c1c); box-shadow: 0 4px 14px rgba(239,68,68,0.3); }
.avatar-unknown { background: var(--bg-surface-2); color: var(--text-muted); }

.player-display-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.player-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.player-display-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.player-meta-row { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }

.pos-badge { border-radius: 4px; padding: 2px 7px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; }
.pos-badge--sm { font-size: 0.62rem; padding: 1px 5px; }
.pos-badge--gk      { background: var(--pos-gk-muted);  color: var(--pos-gk);  border: 1px solid var(--pos-gk); }
.pos-badge--def     { background: var(--pos-def-muted); color: var(--pos-def); border: 1px solid var(--pos-def); }
.pos-badge--mid     { background: var(--pos-mid-muted); color: var(--pos-mid); border: 1px solid var(--pos-mid); }
.pos-badge--fwd     { background: var(--pos-fwd-muted); color: var(--pos-fwd); border: 1px solid var(--pos-fwd); }
.pos-badge--unknown { background: var(--bg-surface-2);  color: var(--text-muted); border: 1px solid var(--border); }

/* ── Watchlist ───────────────────────────────────────────────────────────────── */
.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.6rem;
}

.watchlist-card {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.15s;
}
.watchlist-card:hover { border-color: var(--accent); }

.watchlist-card-top { display: flex; align-items: center; gap: 0.55rem; }

.player-avatar--sm { width: 34px; height: 34px; font-size: 0.85rem; }

.watchlist-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
.watchlist-player-name { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.watchlist-team-name   { font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.watchlist-card-meta   { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }

/* ── Shared ──────────────────────────────────────────────────────────────────── */
.btn-primary {
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius); padding: 0.5rem 1.1rem;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  text-decoration: none; transition: background 0.2s; white-space: nowrap;
}
.btn-primary:hover { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-surface-2); color: var(--text-secondary);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: border-color 0.15s, color 0.15s;
  white-space: nowrap; margin-left: auto;
}
.btn-secondary:hover { border-color: var(--accent); color: var(--accent-hover); }

.no-fav { font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
.loading-text { color: var(--text-muted); font-style: italic; font-size: 0.875rem; }

.dash-tab-count {
  font-size: 0.62rem; font-weight: 700;
  background: var(--accent-muted); color: var(--accent-hover);
  border: 1px solid rgba(245,158,11,0.25); border-radius: 999px;
  padding: 1px 6px;
}
</style>
