<template>
  <div class="view-container">

    <!-- ── Phase 1: Landing (no league selected) ──────────────────────────── -->
    <template v-if="!selectedLeague">

      <!-- ── Top Scorers Spotlight ──────────────────────────────────────── -->
      <section class="spotlight">
        <div class="section-header">
          <h2 class="section-title">{{ $t('players.spotlightTitle') }}</h2>
          <p class="section-sub">{{ $t('players.spotlightSub') }}</p>
        </div>

        <!-- Tab strip -->
        <div class="scorer-tabs" role="tablist">
          <button
            v-for="comp in featuredComps"
            :key="comp.code"
            class="scorer-tab"
            :class="{ active: activeTab === comp.code }"
            role="tab"
            :aria-selected="activeTab === comp.code"
            @click="selectTab(comp.code)"
          >
            <span class="tab-flag">{{ comp.flag }}</span>
            {{ comp.name }}
          </button>
        </div>

        <!-- Scorers list -->
        <div class="scorers-panel">
          <div v-if="scorersLoading" class="scorers-loading">
            {{ $t('players.loadingScorers') }}
          </div>
          <ul v-else-if="activeScorers.length" class="scorers-list">
            <li
              v-for="(entry, i) in activeScorers"
              :key="entry.player.id"
              class="scorer-row"
              style="cursor:pointer"
              @click="$router.push(`/players/${entry.player.id}?teamId=${entry.team.id}&code=${activeTab}`)"
            >
              <span class="rank-badge" :class="rankClass(i)">{{ i + 1 }}</span>
              <div class="scorer-avatar">{{ entry.player.name.charAt(0).toUpperCase() }}</div>
              <div class="scorer-info">
                <span class="scorer-name">{{ entry.player.name }}</span>
                <span class="scorer-team">{{ entry.team.name }}</span>
              </div>
              <div class="scorer-stats">
                <span class="stat-badge goals-badge">{{ entry.goals }}G</span>
                <span v-if="entry.assists > 0" class="stat-badge assists-badge">{{ entry.assists }}A</span>
              </div>
            </li>
          </ul>
          <p v-else class="scorers-empty">{{ $t('players.noScorers') }}</p>
        </div>
      </section>

      <!-- ── Browse Squads ──────────────────────────────────────────────── -->
      <section class="browse-section">
        <div class="browse-header">
          <h2 class="section-title">{{ $t('players.browseSquads') }}</h2>
          <hr class="section-rule" />
        </div>
        <p class="section-sub browse-sub">{{ $t('players.browseSub') }}</p>

        <div v-if="leaguesLoading" class="loading">{{ $t('players.loadingComps') }}</div>
        <div v-else class="league-grid">
          <button
            v-for="league in leagues"
            :key="league.code"
            class="league-card"
            @click="pickLeague(league)"
          >
            <span class="league-flag">{{ league.flag }}</span>
            <div class="league-info">
              <span class="league-name">{{ league.name }}</span>
              <span class="league-country">{{ league.country }}</span>
            </div>
            <span class="league-arrow">&rarr;</span>
          </button>
        </div>
      </section>

    </template>

    <!-- ── Phase 2: Teams in selected league ────────────────────────────── -->
    <template v-else>
      <div class="page-header">
        <div>
          <button class="back-btn" @click="clearLeague">{{ $t('common.allLeagues') }}</button>
          <h1>
            <span class="header-flag">{{ selectedLeague.flag }}</span>
            {{ selectedLeague.name }}
          </h1>
          <p class="page-sub">{{ $t('players.selectTeamSub') }}</p>
        </div>
      </div>

      <div v-if="teamsLoading" class="loading">{{ $t('players.loadingClubs') }}</div>

      <div v-else>
        <ul v-if="teams.length" class="card-grid">
          <li
            v-for="team in teams"
            :key="team.id"
            class="team-card"
            @click="$router.push(`/teams/${team.id}`)"
          >
            <div class="card-banner">
              <img v-if="team.crest" :src="team.crest" class="crest-img" :alt="team.name" />
              <div v-else class="team-crest">{{ team.name.charAt(0).toUpperCase() }}</div>
            </div>
            <div class="card-body">
              <h2 class="team-name">{{ team.name }}</h2>
              <span class="team-coach"><span>{{ team.coach || '—' }}</span><span v-if="team.coach_nationality" class="coach-flag">{{ nationalityFlag(team.coach_nationality) }}</span></span>
            </div>
          </li>
        </ul>
        <p v-else class="empty-state">{{ $t('players.noClubs') }}</p>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { nationalityFlag } from '../utils/football'

const router = useRouter()

// ── Featured competitions for the spotlight tab strip ────────────────────
const featuredComps = [
  { code: 'PL',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Premier League' },
  { code: 'CL',  flag: '⭐',           name: 'Champions League' },
  { code: 'PD',  flag: '🇪🇸',          name: 'La Liga' },
  { code: 'BL1', flag: '🇩🇪',          name: 'Bundesliga' },
]

// ── State ─────────────────────────────────────────────────────────────────
const leagues = ref([])
const leaguesLoading = ref(false)

const selectedLeague = ref(null)
const teams = ref([])
const teamsLoading = ref(false)

const activeTab = ref('PL')
const scorersCache = ref({})   // { [code]: scorer[] }
const scorersLoading = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────
const activeScorers = computed(() => {
  const raw = scorersCache.value[activeTab.value] || []
  return raw.slice(0, 7)
})

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(async () => {
  leaguesLoading.value = true
  try {
    const res = await api.get('/leagues')
    leagues.value = res.data
  } catch (e) {
    console.error('Failed to fetch leagues', e)
  } finally {
    leaguesLoading.value = false
  }

  // Load default tab scorers
  await loadScorers('PL')
})

// ── Methods ───────────────────────────────────────────────────────────────
async function loadScorers(code) {
  if (scorersCache.value[code] != null) return   // cache hit — skip fetch
  scorersLoading.value = true
  try {
    const res = await api.get(`/leagues/${code}/scorers`)
    scorersCache.value = {
      ...scorersCache.value,
      [code]: res.data.scorers || [],
    }
  } catch (e) {
    console.error(`Failed to fetch scorers for ${code}`, e)
    // Don't cache failures — allow retry on next tab click
  } finally {
    scorersLoading.value = false
  }
}

async function selectTab(code) {
  activeTab.value = code
  await loadScorers(code)
}

async function pickLeague(league) {
  selectedLeague.value = league
  teams.value = []
  teamsLoading.value = true
  try {
    const res = await api.get(`/leagues/${league.code}/teams`)
    teams.value = (res.data.teams || []).map(t => ({
      id:    t.id,
      name:  t.name,
      crest: t.crest || null,
      coach: t.coach?.name || null,
      coach_nationality: t.coach?.nationality || null,
    }))
  } catch (e) {
    console.error('Failed to fetch teams', e)
  } finally {
    teamsLoading.value = false
  }
}

function clearLeague() {
  selectedLeague.value = null
  teams.value = []
}

function rankClass(index) {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return 'rank-plain'
}
</script>

<style scoped>
.view-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* ─── Shared section headers ─────────────────────────────────────────────── */
.section-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin: 0;
}

.section-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  margin-bottom: 0;
}

/* ─── Spotlight section ──────────────────────────────────────────────────── */
.spotlight {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1.5rem 1.25rem;
  margin-bottom: 2.5rem;
}

.section-header {
  margin-bottom: 1.1rem;
}

/* ─── Tab strip ──────────────────────────────────────────────────────────── */
.scorer-tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
  flex-wrap: wrap;
}

.scorer-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  transition: all 0.15s;
}
.scorer-tab:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}
.scorer-tab.active {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent-hover);
}

.tab-flag { font-size: 0.9rem; line-height: 1; }

/* ─── Scorers panel ──────────────────────────────────────────────────────── */
.scorers-panel {
  min-height: 60px;
}

.scorers-loading,
.scorers-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 1.5rem 0;
}

.scorers-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.scorer-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.55rem 0.5rem;
  border-radius: var(--radius);
  transition: background 0.12s;
}
.scorer-row:hover {
  background: var(--bg-surface-2);
}

/* Rank badge */
.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-gold   { background: #f59e0b; color: #1c1100; }
.rank-silver { background: #94a3b8; color: #0f172a; }
.rank-bronze { background: #b45309; color: #fff; }
.rank-plain  { background: var(--bg-surface-2); color: var(--text-muted); border: 1px solid var(--border); }

/* Avatar */
.scorer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f59e0b;
  color: #0f1419;
  font-size: 0.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Info */
.scorer-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.scorer-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scorer-team {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Stat badges */
.scorer-stats {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.stat-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.goals-badge   { background: rgba(16,185,129,0.15); color: var(--win);    border: 1px solid rgba(16,185,129,0.3); }
.assists-badge { background: rgba(59,130,246,0.15); color: var(--accent-hover); border: 1px solid rgba(59,130,246,0.3); }

/* ─── Browse Squads section ──────────────────────────────────────────────── */
.browse-section {
  margin-top: 0;
}

.browse-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.35rem;
}

.section-rule {
  flex: 1;
  border: none;
  border-top: 1px solid var(--border);
  margin: 0;
}

.browse-sub {
  margin-bottom: 1.25rem;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  margin-top: 3rem;
  font-size: 0.9rem;
}

/* ─── League picker grid ─────────────────────────────────────────────────── */
.league-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}
@media (max-width: 700px) { .league-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px) { .league-grid { grid-template-columns: 1fr; } }

.league-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left: 3px solid transparent;
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s, border-left-color 0.18s, transform 0.15s;
}
.league-card:hover {
  border-color: var(--border-hover);
  border-left-color: var(--accent);
  transform: translateY(-2px);
}

.league-flag { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }

.league-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.league-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.league-country {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.league-arrow {
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: color 0.15s, transform 0.15s;
  flex-shrink: 0;
}
.league-card:hover .league-arrow {
  color: var(--accent-hover);
  transform: translateX(3px);
}

/* ─── Phase 2: page header ───────────────────────────────────────────────── */
.page-header { margin-bottom: 1.75rem; }

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.header-flag { font-size: 1.6rem; }

.page-sub {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* ─── Back button ────────────────────────────────────────────────────────── */
.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.4rem;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--accent-hover); }

/* ─── Teams card grid ────────────────────────────────────────────────────── */
.card-grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
@media (max-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 680px)  { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px)  { .card-grid { grid-template-columns: 1fr; } }

/* ─── Team card ──────────────────────────────────────────────────────────── */
.team-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-top: 3px solid transparent;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.18s, border-top-color 0.18s, transform 0.15s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.team-card:hover {
  border-color: var(--border-hover);
  border-top-color: var(--accent);
  transform: translateY(-2px);
}

.card-banner {
  height: 80px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-banner::before {
  display: none;
}

.crest-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
}

.team-crest {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f59e0b;
  color: #0f1419;
  font-size: 1.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.card-body {
  padding: 0.85rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.team-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-coach {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.coach-flag { font-size: 1rem; line-height: 1; flex-shrink: 0; }

/* ─── Empty state ────────────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 4rem;
  font-size: 0.95rem;
}
</style>
