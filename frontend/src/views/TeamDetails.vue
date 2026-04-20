<template>
  <div class="view-container">

    <!-- ── Phase 1: League picker ──────────────────────────────────────────── -->
    <template v-if="!selectedLeague">
      <div class="page-header">
        <div>
          <h1>{{ $t('teams.title') }}</h1>
          <p class="page-sub">{{ $t('teams.sub') }}</p>
        </div>
      </div>

      <div class="league-grid">
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
    </template>

    <!-- ── Phase 2: Teams in selected league ──────────────────────────────── -->
    <template v-else>
      <div class="page-header">
        <div>
          <button class="back-btn" @click="clearLeague">{{ $t('common.allLeagues') }}</button>
          <h1>
            <span class="header-flag">{{ selectedLeague.flag }}</span>
            {{ selectedLeague.name }}
          </h1>
          <p class="page-sub">{{ filteredTeams.length }} of {{ teams.length }} clubs</p>
        </div>
      </div>

      <div class="controls">
        <input
          v-model="searchTerm"
          type="text"
          class="search-input"
          :placeholder="'🔍  ' + $t('teams.searchPlaceholder')"
        />
        <select v-model="sortOption">
          <option value="name-asc">{{ $t('teams.sortNameAsc') }}</option>
          <option value="name-desc">{{ $t('teams.sortNameDesc') }}</option>
          <option value="coach">{{ $t('teams.sortCoach') }}</option>
          <option value="country">{{ $t('teams.sortCountry') }}</option>
        </select>
      </div>

      <div v-if="loading" class="empty-state">{{ $t('teams.loading') }}</div>

      <div v-else>
        <ul v-if="filteredTeams.length" class="card-grid">
          <li
            v-for="team in filteredTeams"
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
              <div class="meta-row">
                <span class="meta-chip coach-chip">
                  <span class="chip-icon">👤</span><span>{{ team.coach || '—' }}</span><span v-if="team.coach_nationality" class="coach-flag">{{ nationalityFlag(team.coach_nationality) }}</span>
                </span>
                <span class="meta-chip country-chip">
                  <span class="chip-icon">🌍</span> {{ team.country || '—' }}
                </span>
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="empty-state">{{ $t('teams.noTeams') }}</p>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { nationalityFlag } from '../utils/football'

const leagues = ref([])
const selectedLeague = ref(null)
const teams = ref([])
const loading = ref(false)
const searchTerm = ref('')
const sortOption = ref('name-asc')
onMounted(async () => {
  const res = await api.get('/leagues')
  leagues.value = res.data
})

async function pickLeague(league) {
  selectedLeague.value = league
  teams.value = []
  loading.value = true
  searchTerm.value = ''
  try {
    const res = await api.get(`/leagues/${league.code}/teams`)
    teams.value = (res.data.teams || []).map(t => ({
      id: t.id,
      name: t.name,
      crest: t.crest || null,
      coach: t.coach?.name || null,
      coach_nationality: t.coach?.nationality || null,
      country: t.area?.name || null,
    }))
  } catch (e) {
    console.error('Failed to fetch teams', e)
  } finally {
    loading.value = false
  }
}

function clearLeague() {
  selectedLeague.value = null
  teams.value = []
  searchTerm.value = ''
}

const filteredTeams = computed(() => {

  const term = searchTerm.value.toLowerCase()
  const arr = teams.value.filter(t => t.name.toLowerCase().includes(term))
  switch (sortOption.value) {
    case 'name-asc':  return [...arr].sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc': return [...arr].sort((a, b) => b.name.localeCompare(a.name))
    case 'coach':     return [...arr].sort((a, b) => (a.coach || '').localeCompare(b.coach || ''))
    case 'country':   return [...arr].sort((a, b) => (a.country || '').localeCompare(b.country || ''))
    default:          return arr
  }
})
</script>

<style scoped>
.view-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 1.75rem;
}

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

/* ─── Back button ───────────────────────────────────────────────────────── */
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

/* ─── League picker grid ────────────────────────────────────────────────── */
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
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  cursor: pointer;
  text-align: left;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.15s, background 0.15s;
}
.league-card:hover {
  border-color: rgba(16, 185, 129, 0.4);
  transform: translateY(-3px);
  background: rgba(12, 20, 35, 0.9);
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
  color: var(--accent-green-hover);
  transform: translateX(3px);
}

/* ─── Controls ─────────────────────────────────────────────────────────── */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 220px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  transition: border-color 0.2s, background 0.2s;
}
.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { outline: none; border-color: var(--accent-green); background: rgba(16,185,129,0.04); }

select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.6rem 0.85rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}
select:focus { outline: none; border-color: var(--accent-green); }
select option {
  background: var(--bg-surface, #0f1117);
  color: var(--text-primary, #f1f5f9);
}

/* ─── Card grid ─────────────────────────────────────────────────────────── */
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

/* ─── Team card ─────────────────────────────────────────────────────────── */
.team-card {
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  overflow: hidden;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.team-card:hover {
  border-color: rgba(16, 185, 129, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.1);
}

.card-banner {
  height: 90px;
  background: linear-gradient(135deg, #0c1e3d 0%, #152033 60%, #1e3050 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.card-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.12) 0%, transparent 65%);
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
  background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 1.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59,130,246,0.4);
  position: relative;
  z-index: 1;
}

.card-body {
  padding: 1rem 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.team-name {
  font-size: 0.975rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-icon { font-size: 0.7rem; flex-shrink: 0; }
.coach-flag { font-size: 1rem; line-height: 1; flex-shrink: 0; }

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 4rem;
  font-size: 0.95rem;
}
</style>
