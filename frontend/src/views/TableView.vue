<template>
  <div class="view-container">

    <!-- ── Phase 1: League picker ──────────────────────────────────────────── -->
    <template v-if="!selectedLeague">
      <div class="page-header">
        <div>
          <h1>{{ $t('table.title') }}</h1>
          <p class="page-sub">{{ $t('table.sub') }}</p>
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

    <!-- ── Phase 2: Standings table ────────────────────────────────────────── -->
    <template v-else>
      <div class="page-header">
        <div>
          <button class="back-btn" @click="clearLeague">{{ $t('common.allLeagues') }}</button>
          <h1>
            <span class="header-flag">{{ selectedLeague.flag }}</span>
            {{ selectedLeague.name }}
          </h1>
          <p class="page-sub">{{ $t('table.seasonStandings') }}</p>
        </div>
      </div>

      <div v-if="loading" class="loading">{{ $t('table.computing') }}</div>

      <div v-else-if="table.length" class="table-wrap">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="col-pos">#</th>
              <th class="col-team">{{ $t('table.club') }}</th>
              <th class="col-num" :title="$t('table.colPlayed')">P</th>
              <th class="col-num" :title="$t('table.colWon')">W</th>
              <th class="col-num" :title="$t('table.colDrawn')">D</th>
              <th class="col-num" :title="$t('table.colLost')">L</th>
              <th class="col-num" :title="$t('table.colGF')">GF</th>
              <th class="col-num" :title="$t('table.colGA')">GA</th>
              <th class="col-num" :title="$t('table.colGD')">GD</th>
              <th class="col-pts" :title="$t('table.colPts')">Pts</th>
              <th class="col-form" :title="$t('table.colForm')">{{ $t('common.form') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, i) in table"
              :key="team.Team_ID"
              class="team-row"
              :class="rowZone(i)"
              @click="$router.push(`/teams/${team.Team_ID}`)"
            >
              <td class="col-pos">
                <span class="pos-badge" :class="rowZone(i)">{{ i + 1 }}</span>
              </td>
              <td class="col-team">
                <div class="team-cell">
                  <img v-if="team.crest" :src="team.crest" class="mini-crest-img" :alt="team.Team_Name" />
                  <div v-else class="mini-crest">{{ team.Team_Name.charAt(0) }}</div>
                  <span class="team-name-text">{{ team.Team_Name }}</span>
                </div>
              </td>
              <td class="col-num muted">{{ team.P }}</td>
              <td class="col-num win-text">{{ team.W }}</td>
              <td class="col-num draw-text">{{ team.D }}</td>
              <td class="col-num lose-text">{{ team.L }}</td>
              <td class="col-num">{{ team.GF }}</td>
              <td class="col-num">{{ team.GA }}</td>
              <td class="col-num gd-cell" :class="team.GD > 0 ? 'win-text' : team.GD < 0 ? 'lose-text' : ''">
                {{ team.GD > 0 ? '+' : '' }}{{ team.GD }}
              </td>
              <td class="col-pts">
                <span class="pts-badge">{{ team.Pts }}</span>
              </td>
              <td class="col-form">
                <div class="form-dots">
                  <span
                    v-for="(r, fi) in (form[team.Team_ID] || [])"
                    :key="fi"
                    class="form-dot"
                    :class="`dot-${r}`"
                    :title="r === 'w' ? $t('table.win') : r === 'd' ? $t('table.draw') : $t('table.loss')"
                  ></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="legend">
          <span class="legend-item"><span class="legend-dot zone-ucl"></span> {{ zoneLabels.ucl }}</span>
          <span v-if="zoneLabels.uel" class="legend-item"><span class="legend-dot zone-uel"></span> {{ zoneLabels.uel }}</span>
          <span class="legend-item"><span class="legend-dot zone-rel"></span> {{ zoneLabels.rel }}</span>
        </div>
      </div>

      <div v-else class="loading">{{ $t('table.noStandings') }}</div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../services/api'

const { t } = useI18n()

const route = useRoute()

const leagues = ref([])
const selectedLeague = ref(null)
const table = ref([])
const form  = ref({})
const loading = ref(false)

// Zone boundaries and labels per competition
const zoneConfigs = {
  PL:  { ucl: 4, uel: 6,    rel: 17, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  PD:  { ucl: 4, uel: 6,    rel: 17, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  BL1: { ucl: 4, uel: 6,    rel: 15, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  SA:  { ucl: 4, uel: 6,    rel: 17, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  FL1: { ucl: 3, uel: 5,    rel: 15, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  ELC: { ucl: 2, uel: 6,    rel: 21, labels: { ucl: 'Promotion',        uel: 'Playoffs',      rel: 'Relegation' } },
  PPL: { ucl: 4, uel: 6,    rel: 15, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  DED: { ucl: 2, uel: 4,    rel: 15, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } },
  BSA: { ucl: 6, uel: null,  rel: 16, labels: { ucl: 'Copa Libertadores', uel: null,           rel: 'Relegation' } },
  CL:  { ucl: 8, uel: 24,   rel: 32, labels: { ucl: 'Round of 16',      uel: 'Knockout Playoff', rel: 'Eliminated' } },
}

const zoneLabels = ref({ ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' })

onMounted(async () => {
  const res = await api.get('/leagues')
  leagues.value = res.data
  const code = route.query.code
  if (code) {
    const league = res.data.find(l => l.code === code)
    if (league) pickLeague(league)
  }
})

async function pickLeague(league) {
  selectedLeague.value = league
  table.value = []
  form.value = {}
  loading.value = true

  const cfg = zoneConfigs[league.code] || { ucl: 4, uel: 6, rel: 17, labels: { ucl: 'Champions League', uel: 'Europa League', rel: 'Relegation' } }
  zoneLabels.value = cfg.labels

  try {
    const [standingsRes, matchRes] = await Promise.all([
      api.get(`/leagues/${league.code}/standings`),
      api.get(`/leagues/${league.code}/matches`),
    ])

    const data = standingsRes.data
    const total = (data.standings || []).find(s => s.type === 'TOTAL')
    if (total) {
      table.value = total.table.map(row => ({
        Team_ID:   row.team.id,
        Team_Name: row.team.name,
        crest:     row.team.crest || null,
        P:  row.playedGames,
        W:  row.won,
        D:  row.draw,
        L:  row.lost,
        GF: row.goalsFor,
        GA: row.goalsAgainst,
        GD: row.goalDifference,
        Pts: row.points,
      }))
    }

    // Build last-5 form per team
    const matches = Array.isArray(matchRes.data) ? matchRes.data : (matchRes.data.matches || [])
    const allMatches = [...matches].sort((a, b) => new Date(b.MatchDate || b.utcDate) - new Date(a.MatchDate || a.utcDate))
    const formMap = {}
    for (const m of allMatches) {
      if (m.status !== 'FINISHED') continue
      const ft = m.score?.fullTime
      const hg = ft?.home ?? (typeof m.Score === 'string' ? Number(m.Score.split('-')[0]) : null)
      const ag = ft?.away ?? (typeof m.Score === 'string' ? Number(m.Score.split('-')[1]) : null)
      if (hg === null || ag === null || isNaN(hg) || isNaN(ag)) continue
      const score = `${hg}-${ag}`
      if (!score.includes('-')) continue
      const addForm = (id, result) => {
        if (!formMap[id]) formMap[id] = []
        if (formMap[id].length < 5) formMap[id].push(result)
      }
      const homeEntry = table.value.find(t => t.Team_Name === (m.HomeTeam || m.homeTeam?.name))
      const awayEntry = table.value.find(t => t.Team_Name === (m.AwayTeam || m.awayTeam?.name))
      if (homeEntry && awayEntry) {
        if (hg > ag)      { addForm(homeEntry.Team_ID, 'w'); addForm(awayEntry.Team_ID, 'l') }
        else if (hg < ag) { addForm(homeEntry.Team_ID, 'l'); addForm(awayEntry.Team_ID, 'w') }
        else              { addForm(homeEntry.Team_ID, 'd'); addForm(awayEntry.Team_ID, 'd') }
      }
    }
    form.value = formMap
  } catch (e) {
    console.error('Failed to load standings', e)
  } finally {
    loading.value = false
  }
}

function clearLeague() {
  selectedLeague.value = null
  table.value = []
  form.value = {}
}

function rowZone(i) {
  if (!selectedLeague.value) return ''
  const cfg = zoneConfigs[selectedLeague.value.code]
  if (!cfg) return ''
  if (i < cfg.ucl) return 'zone-ucl'
  if (cfg.uel && i < cfg.uel) return 'zone-uel'
  if (i >= cfg.rel) return 'zone-rel'
  return ''
}
</script>

<style scoped>
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

.loading {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4rem;
}

/* ─── Table wrapper ─────────────────────────────────────────────────────── */
.table-wrap {
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
  overflow-x: auto;
  overflow-y: hidden;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
thead tr {
  background: var(--bg-surface-2);
  border-bottom: 1px solid var(--border);
}

th {
  padding: 0.65rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
}

th.col-team { text-align: left; padding-left: 1rem; }

/* ─── Body rows ─────────────────────────────────────────────────────────── */
.team-row {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}

.team-row:last-child { border-bottom: none; }
.team-row:hover { background: var(--bg-surface-2); }

/* Zone left-border indicators */
.team-row.zone-ucl { border-left: 3px solid var(--accent); }
.team-row.zone-uel { border-left: 3px solid var(--pos-mid); }
.team-row.zone-rel { border-left: 3px solid var(--lose); }

td {
  padding: 0.7rem 0.75rem;
  text-align: center;
  color: var(--text-primary);
}

/* ─── Position badge ─────────────────────────────────────────────────────── */
.col-pos { width: 36px; }

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--bg-surface-2);
  color: var(--text-muted);
}

.pos-badge.zone-ucl { background: var(--accent-muted); color: var(--accent-hover); }
.pos-badge.zone-uel { background: var(--pos-mid-muted); color: var(--pos-mid); }
.pos-badge.zone-rel { background: var(--lose-muted); color: var(--lose); }

/* ─── Team cell ─────────────────────────────────────────────────────────── */
.col-team { text-align: left; padding-left: 1rem; min-width: 180px; }

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.mini-crest-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.mini-crest {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.team-name-text {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

/* ─── Number columns ─────────────────────────────────────────────────────── */
.col-num { width: 38px; color: var(--text-secondary); }
.muted   { color: var(--text-muted); }
.win-text  { color: var(--win); }
.lose-text { color: var(--lose); }
.draw-text { color: var(--draw); }

/* ─── Points badge ───────────────────────────────────────────────────────── */
.col-pts { width: 44px; }

.pts-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 0.15rem 0.4rem;
  background: var(--accent-muted);
  color: var(--accent-hover);
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.875rem;
}

/* ─── Form dots ──────────────────────────────────────────────────────────── */
.col-form { width: 80px; }

.form-dots {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.form-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-w { background: var(--win); }
.dot-d { background: var(--draw); }
.dot-l { background: var(--lose); }

/* ─── Legend ─────────────────────────────────────────────────────────────── */
.legend {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
  background: var(--bg-surface-2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.legend-dot.zone-ucl { background: var(--accent); }
.legend-dot.zone-uel { background: var(--pos-mid); }
.legend-dot.zone-rel { background: var(--lose); }

/* Mobile */
@media (max-width: 640px) {
  .col-form { display: none; }
  .col-num  { width: 28px; }
  th, td    { padding: 0.6rem 0.4rem; }
  .col-team { min-width: 0; max-width: 140px; }
  .team-name-text { font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; display: block; }
}

@media (max-width: 560px) {
  /* Hide D, L, GF, GA — keep P, W, GD, Pts */
  th:nth-child(5),  td:nth-child(5),
  th:nth-child(6),  td:nth-child(6),
  th:nth-child(7),  td:nth-child(7),
  th:nth-child(8),  td:nth-child(8) { display: none; }
  th, td { padding: 0.55rem 0.35rem; }
  .team-name-text { font-size: 0.78rem; }
  .col-team { max-width: 110px; }
}

@media (max-width: 380px) {
  /* Also hide GD on very small screens */
  th:nth-child(9), td:nth-child(9) { display: none; }
  th, td { padding: 0.5rem 0.25rem; }
}
</style>
