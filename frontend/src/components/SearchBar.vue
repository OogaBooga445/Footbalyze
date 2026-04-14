<template>
  <div class="search-wrap" ref="wrapRef">

    <!-- Trigger -->
    <button v-if="!open" class="search-trigger" @click="openSearch" aria-label="Search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </button>

    <!-- Expanded input -->
    <div v-else class="search-box">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Search teams or leagues..."
        @keydown.escape="close"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectActive"
      />
      <button class="search-close" @click="close">✕</button>

      <!-- Results dropdown -->
      <div v-if="query.length >= 1 && results.length" class="search-dropdown">
        <div
          v-for="(r, i) in results"
          :key="r.id"
          class="search-result"
          :class="{ 'search-result--active': i === activeIndex }"
          @mouseenter="activeIndex = i"
          @click="navigate(r)"
        >
          <img v-if="r.crest" :src="r.crest" class="result-crest" :alt="r.label" />
          <span v-else-if="r.flag" class="result-flag">{{ r.flag }}</span>
          <span v-else class="result-avatar">{{ r.label.charAt(0) }}</span>
          <div class="result-info">
            <span class="result-label">{{ r.label }}</span>
            <span class="result-sub">{{ r.sub }}</span>
          </div>
          <span class="result-type">{{ r.type }}</span>
        </div>
      </div>

      <div v-else-if="query.length >= 1 && !loading && results.length === 0" class="search-dropdown">
        <div class="search-empty">No results for "{{ query }}"</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router   = useRouter()
const open     = ref(false)
const query    = ref('')
const debouncedQuery = ref('')
const loading  = ref(false)
const activeIndex = ref(-1)
const inputRef = ref(null)
const wrapRef  = ref(null)

let debounceTimer = null
watch(query, val => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 200)
})

// Cached data — fetched once
const allTeams   = ref([])
const allLeagues = ref([])
const allPlayers = ref([])
let dataLoaded   = false
let playersLoaded = false

const PLAYER_CODES = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'ELC', 'PPL', 'DED', 'BSA']

async function loadData() {
  if (dataLoaded) return
  loading.value = true
  try {
    const [teamsRes, leaguesRes] = await Promise.all([
      api.get('/all-teams'),
      api.get('/leagues'),
    ])
    allTeams.value   = teamsRes.data || []
    allLeagues.value = leaguesRes.data || []
    dataLoaded = true
  } catch (e) {
    console.error('Search data load failed', e)
  } finally {
    loading.value = false
  }

  // Load all players in background after initial data is ready
  if (!playersLoaded) {
    playersLoaded = true
    const results = await Promise.allSettled(
      PLAYER_CODES.map(code => api.get('/players', { params: { code } }))
    )
    const players = []
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled') {
        players.push(...(r.value.data || []).map(p => ({ ...p, leagueCode: PLAYER_CODES[i] })))
      }
    }
    // Deduplicate by Player_ID
    const seen = new Set()
    allPlayers.value = players.filter(p => {
      if (seen.has(p.Player_ID)) return false
      seen.add(p.Player_ID)
      return true
    })
  }
}

const results = computed(() => {
  if (!debouncedQuery.value.trim()) return []
  const q = debouncedQuery.value.toLowerCase()

  const leagues = allLeagues.value
    .filter(l => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q))
    .slice(0, 2)
    .map(l => ({ id: `league-${l.code}`, label: l.name, sub: l.country, flag: l.flag, crest: null, type: 'League', route: `/leagues?code=${l.code}` }))

  const teams = allTeams.value
    .filter(t => t.Team_Name.toLowerCase().includes(q))
    .slice(0, 4)
    .map(t => ({ id: `team-${t.Team_ID}`, label: t.Team_Name, sub: t.leagueName, crest: t.Crest, flag: null, type: 'Club', route: `/teams/${t.Team_ID}` }))

  const players = allPlayers.value
    .filter(p => `${p.Name} ${p.Surname}`.toLowerCase().includes(q))
    .slice(0, 5)
    .map(p => ({ id: `player-${p.Player_ID}`, label: `${p.Name} ${p.Surname}`, sub: `${p.Team_Name} · ${p.Position}`, flag: null, crest: null, type: 'Player', route: `/players/${p.Player_ID}?teamId=${p.Team_ID}&code=${p.leagueCode}` }))

  return [...leagues, ...teams, ...players]
})

watch(results, () => { activeIndex.value = -1 })

async function openSearch() {
  open.value = true
  await loadData()
  await nextTick()
  inputRef.value?.focus()
}

function close() {
  open.value = false
  query.value = ''
  activeIndex.value = -1
}

function moveDown() {
  if (activeIndex.value < results.value.length - 1) activeIndex.value++
}

function moveUp() {
  if (activeIndex.value > 0) activeIndex.value--
}

function selectActive() {
  const r = results.value[activeIndex.value] ?? results.value[0]
  if (r) navigate(r)
}

function navigate(r) {
  router.push(r.route)
  close()
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* Trigger icon button */
.search-trigger {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: var(--radius);
  transition: color 0.15s, background 0.15s;
}
.search-trigger:hover {
  color: var(--text-primary);
  background: var(--bg-surface-2);
}

/* Expanded box */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 0.5rem;
  width: 260px;
  transition: border-color 0.15s;
}

@media (max-width: 960px) {
  .search-box { width: 160px; }
}
.search-box:focus-within {
  border-color: rgba(16,185,129,0.5);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.875rem;
  padding: 0.4rem 0;
  min-width: 0;
}
.search-input::placeholder { color: var(--text-muted); }

.search-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
}
.search-close:hover { color: var(--text-primary); }

/* Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  min-width: 280px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  overflow: hidden;
  z-index: 999;
}

@media (max-width: 960px) {
  .search-dropdown {
    left: auto;
    right: 0;
    width: calc(100vw - 2rem);
    min-width: unset;
  }
}

.search-result {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.search-result:last-child { border-bottom: none; }
.search-result--active,
.search-result:hover { background: var(--bg-surface-2); }

.result-crest {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.result-flag {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.result-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.result-type {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg-surface-2);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.result-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-empty {
  padding: 0.85rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
}
</style>
