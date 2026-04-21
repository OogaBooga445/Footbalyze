<template>
  <div class="view-container">

    <!-- ── Step 1: League picker ─────────────────────────────────────────── -->
    <template v-if="!selectedLeague">
      <div class="page-header">
        <h1>{{ $t('h2h.title') }}</h1>
        <p class="page-sub">{{ $t('h2h.sub') }}</p>
      </div>
      <div class="league-grid">
        <button v-for="league in leagues" :key="league.code" class="league-card" @click="pickLeague(league)">
          <span class="league-flag">{{ league.flag }}</span>
          <div class="league-info">
            <span class="league-name">{{ league.name }}</span>
            <span class="league-country">{{ league.country }}</span>
          </div>
          <span class="league-arrow">&rarr;</span>
        </button>
      </div>
    </template>

    <!-- ── Step 2 & 3 ─────────────────────────────────────────────────────── -->
    <template v-else>
      <div class="page-header">
        <button class="back-btn" @click="reset">{{ $t('common.allLeagues') }}</button>
        <h1><span class="header-flag">{{ selectedLeague.flag }}</span>{{ selectedLeague.name }}</h1>
        <p class="page-sub">{{ $t('h2h.selectTwo') }}</p>
      </div>

      <div v-if="teamsLoading" class="loading">{{ $t('h2h.loadingClubs') }}</div>

      <template v-else>

        <!-- Team pickers -->
        <div class="pickers-row">
          <div class="picker-panel" :class="{ 'picker-panel--done': team1 }">
            <div class="picker-label">{{ team1 ? team1.Team_Name : $t('h2h.club1') }}</div>
            <img v-if="team1" :src="team1.Crest" class="picker-crest-selected" :alt="team1.Team_Name" />
            <button v-if="team1" class="picker-clear" @click="team1 = null; result = null">{{ $t('h2h.change') }}</button>
          </div>

          <div class="vs-divider">VS</div>

          <div class="picker-panel" :class="{ 'picker-panel--done': team2 }">
            <div class="picker-label">{{ team2 ? team2.Team_Name : $t('h2h.club2') }}</div>
            <img v-if="team2" :src="team2.Crest" class="picker-crest-selected" :alt="team2.Team_Name" />
            <button v-if="team2" class="picker-clear" @click="team2 = null; result = null">{{ $t('h2h.change') }}</button>
          </div>
        </div>

        <!-- Team grid (hidden once both selected) -->
        <div v-if="!team1 || !team2" class="team-grid">
          <button
            v-for="t in teams"
            :key="t.Team_ID"
            class="team-tile"
            :class="{
              'team-tile--selected': team1?.Team_ID === t.Team_ID || team2?.Team_ID === t.Team_ID,
              'team-tile--disabled': (team1 && team2) || team1?.Team_ID === t.Team_ID
            }"
            @click="pickTeam(t)"
          >
            <img v-if="t.Crest" :src="t.Crest" class="tile-crest" :alt="t.Team_Name" />
            <span class="tile-name">{{ t.Team_Name }}</span>
          </button>
        </div>

        <!-- Load H2H once both picked -->
        <div v-if="team1 && team2 && h2hLoading" class="loading">{{ $t('h2h.loading') }}</div>

        <!-- ── H2H Result ──────────────────────────────────────────────────── -->
        <template v-if="result && !h2hLoading">

          <!-- Record banner -->
          <div class="record-banner">
            <div class="rb-side">
              <img v-if="team1.Crest" :src="team1.Crest" class="rb-crest" />
              <span class="rb-name">{{ team1.Team_Name }}</span>
            </div>
            <div class="rb-stats">
              <div class="rb-stat rb-stat--win">
                <span class="rb-val">{{ result.record.team1Wins }}</span>
                <span class="rb-lbl">{{ $t('h2h.wins') }}</span>
              </div>
              <div class="rb-stat rb-stat--draw">
                <span class="rb-val">{{ result.record.draws }}</span>
                <span class="rb-lbl">{{ $t('h2h.draws') }}</span>
              </div>
              <div class="rb-stat rb-stat--win">
                <span class="rb-val">{{ result.record.team2Wins }}</span>
                <span class="rb-lbl">{{ $t('h2h.wins') }}</span>
              </div>
            </div>
            <div class="rb-side rb-side--right">
              <img v-if="team2.Crest" :src="team2.Crest" class="rb-crest" />
              <span class="rb-name">{{ team2.Team_Name }}</span>
            </div>
          </div>

          <!-- Goals scored -->
          <div class="goals-bar-wrap">
            <span class="goals-label">{{ result.record.team1Goals }} {{ $t('common.goals') }}</span>
            <div class="goals-bar">
              <div
                class="goals-fill goals-fill--1"
                :style="{ width: goalsWidth(result.record.team1Goals) }"
              ></div>
              <div
                class="goals-fill goals-fill--2"
                :style="{ width: goalsWidth(result.record.team2Goals) }"
              ></div>
            </div>
            <span class="goals-label">{{ result.record.team2Goals }} {{ $t('common.goals') }}</span>
          </div>

          <!-- Match history -->
          <div v-if="result.meetings.length" class="meetings-section">
            <h2 class="meetings-title">{{ $t('h2h.seasonMeetings') }}</h2>
            <div class="meetings-list">
              <div v-for="m in result.meetings" :key="m.Match_ID" class="meeting-row">
                <span class="meeting-date">{{ formatDate(m.MatchDate) }}</span>
                <div class="meeting-teams">
                  <span class="meeting-team" :class="{ 'is-winner': homeWon(m) }">{{ m.HomeTeam }}</span>
                  <img v-if="m.HomeCrest" :src="m.HomeCrest" class="meeting-crest" />
                  <span class="meeting-score" :class="scoreClass(m.Score)">{{ m.Score }}</span>
                  <img v-if="m.AwayCrest" :src="m.AwayCrest" class="meeting-crest" />
                  <span class="meeting-team meeting-team--away" :class="{ 'is-winner': awayWon(m) }">{{ m.AwayTeam }}</span>
                </div>
                <span class="meeting-md">MD {{ m.Matchday }}</span>
              </div>
            </div>
          </div>

          <p v-else class="empty-state">{{ $t('h2h.noMeetings') }}</p>

        </template>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const leagues       = ref([])
const selectedLeague = ref(null)
const teams         = ref([])
const teamsLoading  = ref(false)
const team1         = ref(null)
const team2         = ref(null)
const result        = ref(null)
const h2hLoading    = ref(false)

onMounted(async () => {
  const res = await api.get('/leagues')
  leagues.value = res.data
})

async function pickLeague(league) {
  selectedLeague.value = league
  teamsLoading.value = true
  team1.value = null
  team2.value = null
  result.value = null
  try {
    const res = await api.get(`/leagues/${league.code}/teams`)
    const raw = res.data?.teams || res.data || []
    teams.value = raw.map(t => ({
      Team_ID:   t.id,
      Team_Name: t.name,
      Crest:     t.crest || null,
    })).sort((a, b) => a.Team_Name.localeCompare(b.Team_Name))
  } catch (e) {
    console.error('Failed to load teams', e)
  } finally {
    teamsLoading.value = false
  }
}

async function pickTeam(t) {
  if (team1.value?.Team_ID === t.Team_ID || team2.value?.Team_ID === t.Team_ID) return
  if (!team1.value) { team1.value = t; return }
  if (!team2.value) {
    team2.value = t
    await loadH2H()
  }
}

async function loadH2H() {
  h2hLoading.value = true
  result.value = null
  try {
    const res = await api.get('/h2h', {
      params: {
        code:    selectedLeague.value.code,
        team1Id: team1.value.Team_ID,
        team2Id: team2.value.Team_ID,
      }
    })
    result.value = res.data
  } catch (e) {
    console.error('Failed to load H2H', e)
  } finally {
    h2hLoading.value = false
  }
}

function reset() {
  selectedLeague.value = null
  teams.value = []
  team1.value = null
  team2.value = null
  result.value = null
}

function goalsWidth(goals) {
  const total = (result.value?.record.team1Goals ?? 0) + (result.value?.record.team2Goals ?? 0)
  if (!total) return '50%'
  return `${(goals / total) * 100}%`
}

function homeWon(m) {
  if (!m.Score) return false
  const [h, a] = m.Score.split('-').map(Number)
  return h > a
}
function awayWon(m) {
  if (!m.Score) return false
  const [h, a] = m.Score.split('-').map(Number)
  return a > h
}
function scoreClass(score) {
  if (!score) return ''
  const [h, a] = score.split('-').map(Number)
  if (h === a) return 'score-draw'
  return 'score-decisive'
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
/* ─── Base layout ───────────────────────────────────────────────────────── */
.view-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

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

.loading {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4rem;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 2rem;
}

/* ─── League picker (shared pattern) ───────────────────────────────────── */
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
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, transform 0.15s;
}
.league-card:hover { border-color: rgba(16,185,129,0.4); transform: translateY(-2px); }
.league-flag { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }
.league-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.league-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.league-country { font-size: 0.75rem; color: var(--text-muted); }
.league-arrow { font-size: 0.9rem; color: var(--text-muted); flex-shrink: 0; }
.league-card:hover .league-arrow { color: var(--accent-green-hover); }

/* ─── Pickers row ───────────────────────────────────────────────────────── */
.pickers-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.picker-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-height: 100px;
  justify-content: center;
  transition: border-color 0.2s;
}

.picker-panel--done {
  border-color: rgba(16,185,129,0.35);
}

.picker-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.picker-crest-selected {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.picker-clear {
  background: none;
  border: none;
  font-size: 0.72rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.picker-clear:hover { color: var(--text-primary); }

.vs-divider {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ─── Team grid ─────────────────────────────────────────────────────────── */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.6rem;
  margin-bottom: 2rem;
}

.team-tile {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.team-tile:hover { border-color: rgba(16,185,129,0.4); transform: translateY(-2px); }
.team-tile--selected { border-color: var(--accent-green); background: rgba(16,185,129,0.06); }
.team-tile--disabled { opacity: 0.4; pointer-events: none; }

.tile-crest {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.tile-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.2;
}

/* ─── Record banner ─────────────────────────────────────────────────────── */
.record-banner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.rb-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.rb-side--right { }

.rb-crest {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
}

.rb-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.rb-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rb-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 52px;
}

.rb-val {
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
  color: var(--text-primary);
}

.rb-lbl {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ─── Goals bar ─────────────────────────────────────────────────────────── */
.goals-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.goals-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 56px;
}

.goals-label:last-child { text-align: right; }

.goals-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-surface-2);
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
}

.goals-fill {
  height: 100%;
  transition: width 0.5s ease;
}
.goals-fill--1 { background: var(--accent-green); }
.goals-fill--2 { background: var(--accent-hover); }

/* ─── Meetings ──────────────────────────────────────────────────────────── */
.meetings-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.meeting-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
}

.meeting-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  min-width: 80px;
  flex-shrink: 0;
}

.meeting-teams {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.meeting-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.meeting-team {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 100px;
  text-align: right;
}

.meeting-team--away { text-align: left; }

.meeting-team.is-winner { color: var(--win); }

.meeting-score {
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  flex-shrink: 0;
}

.score-draw     { color: var(--draw); }
.score-decisive { color: var(--text-primary); }

.meeting-md {
  font-size: 0.7rem;
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .record-banner { grid-template-columns: 1fr; gap: 1rem; }
  .rb-stats { justify-content: center; }
  .meeting-date, .meeting-md { display: none; }
}
</style>
