<template>
  <div class="view-container">

    <!-- ── Phase 1: League picker ──────────────────────────────────────────── -->
    <template v-if="!selectedLeague">
      <div class="page-header">
        <div>
          <h1>{{ $t('leagues.title') }}</h1>
          <p class="page-sub">{{ $t('leagues.sub') }}</p>
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

    <!-- ── Phase 2: League dashboard ──────────────────────────────────────── -->
    <template v-else>
      <div class="page-header">
        <div>
          <button class="back-btn" @click="clearLeague">{{ $t('common.allLeagues') }}</button>
          <h1>
            <span class="header-flag">{{ selectedLeague.flag }}</span>
            {{ selectedLeague.name }}
          </h1>
          <p class="page-sub">{{ selectedLeague.country }} · {{ $t('common.season') }}</p>
        </div>
      </div>

      <div v-if="loading" class="loading">{{ $t('leagues.loading') }}</div>

      <template v-else>

        <!-- ── Highlight cards ─────────────────────────────────────────────── -->
        <div class="highlight-row">

          <!-- Leader -->
          <div class="highlight-card leader-card">
            <div class="hc-label">{{ $t('leagues.leagueLeader') }}</div>
            <div class="hc-main">
              <img v-if="leader?.crest" :src="leader.crest" class="hc-crest" :alt="leader.name" />
              <div v-else class="hc-avatar">{{ leader?.name?.charAt(0) }}</div>
              <div class="hc-info">
                <span class="hc-name">{{ leader?.name || '—' }}</span>
                <div class="hc-stats-row">
                  <span class="hc-chip hc-pts">{{ leader?.points }} pts</span>
                  <span class="hc-chip hc-wdl">{{ leader?.won }}W {{ leader?.draw }}D {{ leader?.lost }}L</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Scorer -->
          <div class="highlight-card scorer-card" style="cursor:pointer" @click="topScorer && $router.push(`/players/${topScorer.player.id}?teamId=${topScorer.team.id}&code=${selectedLeague.code}`)">
            <div class="hc-label">{{ $t('leagues.topScorer') }}</div>
            <div class="hc-main">
              <div class="hc-avatar scorer-avatar">{{ topScorer?.player?.name?.charAt(0) || '?' }}</div>
              <div class="hc-info">
                <span class="hc-name">{{ topScorer?.player?.name || '—' }}</span>
                <span class="hc-subname">{{ topScorer?.team?.shortName || topScorer?.team?.name || '' }}</span>
                <div class="hc-stats-row">
                  <span class="hc-chip hc-goals">⚽ {{ topScorer?.goals ?? 0 }} goals</span>
                  <span v-if="topScorer?.assists" class="hc-chip hc-assists">🅰 {{ topScorer.assists }} assists</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Season stats -->
          <div class="highlight-card stats-card">
            <div class="hc-label">{{ $t('leagues.seasonStats') }}</div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-val">{{ seasonStats.totalGoals }}</span>
                <span class="stat-lbl">{{ $t('leagues.goals') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{ seasonStats.played }}</span>
                <span class="stat-lbl">{{ $t('leagues.matchesPlayed') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{ seasonStats.gpg }}</span>
                <span class="stat-lbl">{{ $t('leagues.goalsPerGame') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-val" :style="typeof seasonStats.topMatchday === 'string' && seasonStats.topMatchday.length > 3 ? 'font-size:0.9rem' : ''">{{ seasonStats.topMatchday }}</span>
                <span class="stat-lbl">{{ seasonStats.hasKnockout ? $t('leagues.currentStage') : $t('leagues.currentMatchday') }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Results + Fixtures (all leagues) ─────────────────────────── -->
        <div class="fixtures-row">
          <div class="fixtures-panel">
            <h2 class="panel-title">{{ $t('leagues.recentResults') }}</h2>
            <div v-if="recentResults.length" class="match-list">
              <div v-for="m in recentResults" :key="m.id" class="match-row">
                <span class="match-md">{{ m.matchday ? `MD ${m.matchday}` : formatDate(m.utcDate) }}</span>
                <div class="match-teams">
                  <div class="match-team home">
                    <img v-if="m.homeTeam.crest" :src="m.homeTeam.crest" class="team-crest-img" />
                    <span>{{ m.homeTeam.shortName || m.homeTeam.name }}</span>
                  </div>
                  <span class="score-pill" :class="scorePillClass(m)">
                    {{ m.score.fullTime.home }} – {{ m.score.fullTime.away }}
                  </span>
                  <div class="match-team away">
                    <img v-if="m.awayTeam.crest" :src="m.awayTeam.crest" class="team-crest-img" />
                    <span>{{ m.awayTeam.shortName || m.awayTeam.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="empty-state">{{ $t('leagues.noRecentResults') }}</p>
          </div>
          <div class="fixtures-panel">
            <h2 class="panel-title">{{ $t('leagues.upcomingFixtures') }}</h2>
            <div v-if="upcomingFixtures.length" class="match-list">
              <div v-for="m in upcomingFixtures" :key="m.id" class="match-row">
                <span class="match-md">{{ formatDate(m.utcDate) }}</span>
                <div class="match-teams">
                  <div class="match-team home">
                    <img v-if="m.homeTeam?.crest" :src="m.homeTeam.crest" class="team-crest-img" />
                    <span>{{ m.homeTeam?.shortName || m.homeTeam?.name || 'TBD' }}</span>
                  </div>
                  <span class="score-pill upcoming-pill">{{ formatTime(m.utcDate) }}</span>
                  <div class="match-team away">
                    <img v-if="m.awayTeam?.crest" :src="m.awayTeam.crest" class="team-crest-img" />
                    <span>{{ m.awayTeam?.shortName || m.awayTeam?.name || 'TBD' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="empty-state">{{ $t('leagues.noUpcoming') }}</p>
          </div>
        </div>

        <!-- ── Mini table top 5 (non-CL only) ───────────────────────────────── -->
        <div v-if="selectedLeague.code !== 'CL'" class="mini-table-wrap">
          <div class="panel-title-row">
            <h2 class="panel-title">{{ $t('leagues.top5') }}</h2>
            <router-link :to="`/table?code=${selectedLeague.code}`" class="see-all-link">{{ $t('leagues.fullTable') }}</router-link>
          </div>
          <table class="mini-table">
            <thead>
              <tr>
                <th class="col-pos">#</th>
                <th class="col-team">Club</th>
                <th class="col-num" title="Played">P</th>
                <th class="col-num" title="Won">W</th>
                <th class="col-num" title="Goal Difference">GD</th>
                <th class="col-pts">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in top5"
                :key="row.team.id"
                class="mini-row zone-ucl"
                @click="$router.push(`/teams/${row.team.id}`)"
              >
                <td class="col-pos"><span class="pos-badge zone-ucl">{{ i + 1 }}</span></td>
                <td class="col-team">
                  <div class="team-cell">
                    <img v-if="row.team.crest" :src="row.team.crest" class="mini-crest-img" :alt="row.team.name" />
                    <div v-else class="mini-crest">{{ row.team.name.charAt(0) }}</div>
                    <span class="team-name-text">{{ row.team.shortName || row.team.name }}</span>
                  </div>
                </td>
                <td class="col-num muted">{{ row.playedGames }}</td>
                <td class="col-num win-text">{{ row.won }}</td>
                <td class="col-num" :class="row.goalDifference > 0 ? 'win-text' : row.goalDifference < 0 ? 'lose-text' : ''">
                  {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                </td>
                <td class="col-pts"><span class="pts-badge">{{ row.points }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Scorers & Assists leaderboard ───────────────────────────────── -->
        <div v-if="topScorers.length || topAssists.length" class="leaderboard-row">

          <!-- Top Scorers -->
          <div class="leaderboard-panel">
            <h2 class="panel-title">{{ $t('leagues.topScorers') }}</h2>
            <div class="leaderboard-list">
              <div v-for="(s, i) in topScorers" :key="s.player?.id ?? i" class="lb-row" style="cursor:pointer" @click="$router.push(`/players/${s.player.id}?teamId=${s.team.id}&code=${selectedLeague.code}`)">
                <span class="lb-rank">{{ i + 1 }}</span>
                <img v-if="s.team?.crest" :src="s.team.crest" class="lb-crest" :alt="s.team.name" />
                <div class="lb-info">
                  <span class="lb-name">{{ s.player?.name }}</span>
                  <span class="lb-team">{{ s.team?.shortName || s.team?.name }}</span>
                </div>
                <span class="lb-stat lb-stat--goals">{{ s.goals }}</span>
              </div>
            </div>
          </div>

          <!-- Top Assists -->
          <div class="leaderboard-panel">
            <h2 class="panel-title">{{ $t('leagues.topAssists') }}</h2>
            <div v-if="topAssists.length" class="leaderboard-list">
              <div v-for="(s, i) in topAssists" :key="s.player?.id ?? i" class="lb-row" style="cursor:pointer" @click="$router.push(`/players/${s.player.id}?teamId=${s.team.id}&code=${selectedLeague.code}`)">
                <span class="lb-rank">{{ i + 1 }}</span>
                <img v-if="s.team?.crest" :src="s.team.crest" class="lb-crest" :alt="s.team.name" />
                <div class="lb-info">
                  <span class="lb-name">{{ s.player?.name }}</span>
                  <span class="lb-team">{{ s.team?.shortName || s.team?.name }}</span>
                </div>
                <span class="lb-stat lb-stat--assists">{{ s.assists }}</span>
              </div>
            </div>
            <p v-else class="empty-state">{{ $t('leagues.noAssists') }}</p>
          </div>

        </div>

        <!-- ── Horizontal knockout bracket (CL only) ──────────────────────── -->
        <template v-if="knockoutBracket">
          <div class="bracket-section">
            <div class="bracket-section-header">{{ $t('leagues.knockoutStage') }}</div>
            <div class="bracket-wrap">
              <div class="bracket-cols">
                <div v-for="round in knockoutBracket" :key="round.stage" class="bracket-col">
                  <div class="col-header">{{ round.label }}</div>
                  <div class="col-ties">
                    <div
                      v-for="(tie, i) in round.ties"
                      :key="i"
                      class="tie-card"
                      :class="{ 'tie-finished': tie.status === 'FINISHED', 'tie-in-progress': tie.status === 'IN_PROGRESS' }"
                    >
                      <template v-if="!tie.team1?.name && !tie.team2?.name">
                        <div class="tie-tbd">TBD</div>
                      </template>
                      <template v-else>
                        <div class="tie-team" :class="{ 'is-winner': tie.winner === 'team1', 'is-loser': tie.winner === 'team2' }">
                          <img v-if="tie.team1?.crest" :src="tie.team1.crest" class="tie-crest" />
                          <div v-else class="tie-avatar">{{ tie.team1?.shortName?.charAt(0) || '?' }}</div>
                          <span class="tie-name">{{ tie.team1?.shortName || tie.team1?.name || 'TBD' }}</span>
                          <span v-if="tie.agg1 !== null" class="tie-agg" :class="{ 'agg-win': tie.winner === 'team1', 'agg-lose': tie.winner === 'team2' }">{{ tie.agg1 }}</span>
                        </div>
                        <div class="tie-middle">
                          <span v-if="tie.status === 'UPCOMING' && tie.nextDate" class="tie-date">{{ formatDate(tie.nextDate) }}</span>
                          <span v-else-if="tie.agg1 !== null" class="tie-agg-label">agg</span>
                          <span v-else class="tie-vs">vs</span>
                        </div>
                        <div class="tie-team" :class="{ 'is-winner': tie.winner === 'team2', 'is-loser': tie.winner === 'team1' }">
                          <img v-if="tie.team2?.crest" :src="tie.team2.crest" class="tie-crest" />
                          <div v-else class="tie-avatar">{{ tie.team2?.shortName?.charAt(0) || '?' }}</div>
                          <span class="tie-name">{{ tie.team2?.shortName || tie.team2?.name || 'TBD' }}</span>
                          <span v-if="tie.agg2 !== null" class="tie-agg" :class="{ 'agg-win': tie.winner === 'team2', 'agg-lose': tie.winner === 'team1' }">{{ tie.agg2 }}</span>
                        </div>
                        <div v-if="tie.legs.length || (tie.status === 'IN_PROGRESS' && tie.nextDate)" class="tie-legs">
                          <span v-for="(leg, li) in tie.legs" :key="li" class="leg-chip">{{ leg }}</span>
                          <span v-if="tie.status === 'IN_PROGRESS' && tie.nextDate" class="leg-upcoming">2nd: {{ formatDate(tie.nextDate) }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const leagues = ref([])
const selectedLeague = ref(null)
const loading = ref(false)


const standingsRaw = ref([])
const matchesRaw   = ref([])
const scorersRaw   = ref([])

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
  loading.value = true
  standingsRaw.value = []
  matchesRaw.value   = []
  scorersRaw.value   = []

  const [standRes, matchRes, scorerRes] = await Promise.all([
    api.get(`/leagues/${league.code}/standings`),
    api.get(`/leagues/${league.code}/matches`),
    api.get(`/leagues/${league.code}/scorers`),
  ])

  standingsRaw.value = standRes.data.standings?.[0]?.table || []
  const d = matchRes.data
  matchesRaw.value = Array.isArray(d) ? d : (d.matches || [])
  scorersRaw.value = scorerRes.data.scorers || []

  loading.value = false
}

function clearLeague() {
  selectedLeague.value = null
  standingsRaw.value = []
  matchesRaw.value   = []
  scorersRaw.value   = []
}

// ── Derived data ───────────────────────────────────────────────────────────

const leader = computed(() => {
  const row = standingsRaw.value[0]
  if (!row) return null
  return {
    name:   row.team.name,
    crest:  row.team.crest,
    points: row.points,
    won:    row.won,
    draw:   row.draw,
    lost:   row.lost,
  }
})

const topScorer  = computed(() => scorersRaw.value[0] || null)
const topScorers = computed(() => scorersRaw.value.slice(0, 10))
const topAssists = computed(() =>
  [...scorersRaw.value]
    .filter(s => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10)
)

const top5 = computed(() => standingsRaw.value.slice(0, 5))

const seasonStats = computed(() => {
  const finished = matchesRaw.value.filter(m => m.status === 'FINISHED')
  const totalGoals = finished.reduce((sum, m) => {
    return sum + (m.score?.fullTime?.home ?? 0) + (m.score?.fullTime?.away ?? 0)
  }, 0)
  const played = finished.length
  const gpg = played ? (totalGoals / played).toFixed(2) : '—'
  const stageOrder = ['LEAGUE_STAGE','PLAYOFFS','LAST_16','QUARTER_FINALS','SEMI_FINALS','FINAL']
  const stageLabels = { LEAGUE_STAGE: 'League Phase', PLAYOFFS: 'Playoffs', LAST_16: 'Round of 16', QUARTER_FINALS: 'Quarter Finals', SEMI_FINALS: 'Semi Finals', FINAL: 'Final' }
  const latestFinished = [...finished].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0]
  const latestStage = latestFinished?.stage
  const hasKnockout = finished.some(m => m.stage && m.stage !== 'LEAGUE_STAGE')
  let topMatchday
  if (hasKnockout) {
    const currentStageIdx = stageOrder.indexOf(latestStage)
    const currentStage = currentStageIdx !== -1 ? stageOrder[currentStageIdx] : latestStage
    topMatchday = stageLabels[currentStage] || currentStage
  } else {
    const playedMatchdays = finished.map(m => m.matchday).filter(Boolean)
    topMatchday = playedMatchdays.length ? Math.max(...playedMatchdays) : '—'
  }
  return { totalGoals, played, gpg, topMatchday, hasKnockout }
})

// ── Knockout bracket (CL only) ────────────────────────────────────────────

const BRACKET_STAGES = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL']
const BRACKET_LABELS = { LAST_16: 'Round of 16', QUARTER_FINALS: 'Quarter Finals', SEMI_FINALS: 'Semi Finals', FINAL: 'Final' }
const BRACKET_COUNTS = { LAST_16: 8, QUARTER_FINALS: 4, SEMI_FINALS: 2, FINAL: 1 }

const knockoutBracket = computed(() => {
  if (selectedLeague.value?.code !== 'CL') return null
  const all = matchesRaw.value

  return BRACKET_STAGES.map(stage => {
    const sm = all.filter(m => m.stage === stage)

    if (stage === 'FINAL') {
      const m = sm[0]
      if (!m) return { stage, label: BRACKET_LABELS[stage], ties: [{ team1: null, team2: null, agg1: null, agg2: null, legs: [], winner: null, status: 'UPCOMING', nextDate: null }] }
      return {
        stage, label: BRACKET_LABELS[stage],
        ties: [{
          team1: m.homeTeam, team2: m.awayTeam,
          agg1: m.score?.fullTime?.home, agg2: m.score?.fullTime?.away,
          legs: m.status === 'FINISHED' ? [`${m.score.fullTime.home}–${m.score.fullTime.away}`] : [],
          winner: m.score?.winner === 'HOME_TEAM' ? 'team1' : m.score?.winner === 'AWAY_TEAM' ? 'team2' : null,
          status: m.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING',
          nextDate: m.status !== 'FINISHED' ? m.utcDate : null,
        }]
      }
    }

    const processed = new Set()
    const ties = []

    for (const m of sm) {
      if (processed.has(m.id)) continue
      processed.add(m.id)

      const returnLeg = sm.find(x =>
        !processed.has(x.id) &&
        x.homeTeam?.id && m.homeTeam?.id &&
        x.homeTeam.id === m.awayTeam.id &&
        x.awayTeam.id === m.homeTeam.id
      )
      if (returnLeg) processed.add(returnLeg.id)

      const [leg1, leg2] = !returnLeg || new Date(m.utcDate) <= new Date(returnLeg.utcDate)
        ? [m, returnLeg] : [returnLeg, m]

      const t1 = (leg1?.score?.fullTime?.home ?? 0) + (leg2?.score?.fullTime?.away ?? 0)
      const t2 = (leg1?.score?.fullTime?.away ?? 0) + (leg2?.score?.fullTime?.home ?? 0)
      const l1done = leg1?.status === 'FINISHED'
      const l2done = leg2?.status === 'FINISHED'
      const done = l1done && l2done

      const legScores = []
      if (l1done) legScores.push(`${leg1.score.fullTime.home}–${leg1.score.fullTime.away}`)
      if (l2done) legScores.push(`${leg2.score.fullTime.home}–${leg2.score.fullTime.away}`)

      ties.push({
        team1: leg1?.homeTeam || m.homeTeam,
        team2: leg1?.awayTeam || m.awayTeam,
        agg1: l1done ? t1 : null,
        agg2: l1done ? t2 : null,
        legs: legScores,
        winner: done ? (t1 > t2 ? 'team1' : t2 > t1 ? 'team2' : null) : null,
        status: done ? 'FINISHED' : l1done ? 'IN_PROGRESS' : 'UPCOMING',
        nextDate: !done ? (leg2?.utcDate || leg1?.utcDate) : null,
      })
    }

    // Fill TBD placeholders if teams aren't drawn yet
    const expected = BRACKET_COUNTS[stage] || 0
    while (ties.length < expected) {
      ties.push({ team1: null, team2: null, agg1: null, agg2: null, legs: [], winner: null, status: 'UPCOMING', nextDate: null })
    }

    return { stage, label: BRACKET_LABELS[stage], ties }
  })
})

const recentResults = computed(() =>
  matchesRaw.value
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 6)
)

const upcomingFixtures = computed(() =>
  matchesRaw.value
    .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, 6)
)

// ── Helpers ────────────────────────────────────────────────────────────────

function scorePillClass(m) {
  const h = m.score.fullTime.home, a = m.score.fullTime.away
  if (h > a) return 'win'
  if (h < a) return 'lose'
  return 'draw'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.view-container {
  max-width: 1100px;
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
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, transform 0.15s, background 0.15s;
  box-shadow: var(--shadow);
}
.league-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
  background: var(--bg-surface-2);
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

/* ─── Highlight cards ───────────────────────────────────────────────────── */
.highlight-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 800px) { .highlight-row { grid-template-columns: 1fr; } }

.highlight-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  box-shadow: var(--shadow);
}

.hc-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.85rem;
}

.hc-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hc-crest {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.hc-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #1d4ed8);
  color: #fff;
  font-size: 1.3rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scorer-avatar {
  background: linear-gradient(135deg, #10b981, #065f46);
}

.hc-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.hc-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hc-subname {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.hc-stats-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.hc-chip {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
}

.hc-pts     { background: var(--accent-muted); color: var(--accent-hover); }
.hc-wdl     { background: var(--bg-surface-2); color: var(--text-secondary); }
.hc-goals   { background: var(--win-muted);    color: var(--win); }
.hc-assists { background: var(--accent-muted); color: var(--accent-hover); }

/* Season stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-lbl {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* ─── Fixtures row ──────────────────────────────────────────────────────── */
.fixtures-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 700px) { .fixtures-row { grid-template-columns: 1fr; } }

.fixtures-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  box-shadow: var(--shadow);
}

.panel-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.see-all-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: color 0.15s;
}
.see-all-link:hover { color: var(--accent-hover); }

/* ─── Match rows ────────────────────────────────────────────────────────── */
.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--border);
}
.match-row:last-child { border-bottom: none; }

.match-md {
  font-size: 0.7rem;
  color: var(--text-muted);
  min-width: 52px;
  flex-shrink: 0;
}

.match-teams {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.match-team {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.match-team.home { justify-content: flex-end; }
.match-team.away { justify-content: flex-start; }

.match-team span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-crest-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.score-pill {
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.8rem;
  min-width: 46px;
  text-align: center;
  flex-shrink: 0;
  color: #fff;
}
.score-pill.win  { background: var(--win); }
.score-pill.lose { background: var(--lose); }
.score-pill.draw { background: var(--draw); color: #0d1117; }
.upcoming-pill   { background: var(--bg-surface-2); color: var(--text-secondary); border: 1px solid var(--border); }

/* ─── Mini table ────────────────────────────────────────────────────────── */
.mini-table-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  box-shadow: var(--shadow);
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.mini-table thead tr {
  border-bottom: 1px solid var(--border);
}

.mini-table th {
  padding: 0.5rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: center;
}

.mini-table th.col-team { text-align: left; padding-left: 0.5rem; }

.mini-row {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}
.mini-row:last-child { border-bottom: none; }
.mini-row:hover { background: var(--bg-surface-2); }
.mini-row.zone-ucl { border-left: 3px solid var(--accent); }

.mini-table td {
  padding: 0.6rem 0.6rem;
  text-align: center;
  color: var(--text-primary);
}

.col-pos  { width: 32px; }
.col-num  { width: 36px; color: var(--text-secondary); }
.col-pts  { width: 44px; }
.col-team { text-align: left; padding-left: 0.5rem !important; min-width: 140px; }

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--bg-surface-2);
  color: var(--text-muted);
}
.pos-badge.zone-ucl { background: var(--accent-muted); color: var(--accent-hover); }

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.mini-crest-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.mini-crest {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.team-name-text { font-weight: 600; white-space: nowrap; color: var(--text-primary); }

.muted     { color: var(--text-muted) !important; }
.win-text  { color: var(--win); }
.lose-text { color: var(--lose); }

.pts-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  padding: 0.12rem 0.4rem;
  background: var(--accent-muted);
  color: var(--accent-hover);
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.85rem;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4rem;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.85rem;
  padding: 1rem 0;
}

/* ─── Knockout bracket ────────────────────────────────────────────────────── */
.bracket-section {
  margin-top: 0.5rem;
}

.bracket-section-header {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-hover);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.bracket-section-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.bracket-wrap {
  overflow-x: auto;
  padding-bottom: 0.75rem;
}

.bracket-cols {
  display: flex;
  gap: 0;
  min-width: 680px;
  min-height: 440px;
  align-items: stretch;
}

.bracket-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0.4rem;
  border-right: 1px solid var(--border);
}
.bracket-col:last-child { border-right: none; }

.col-header {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.4rem;
  white-space: nowrap;
}

.col-ties {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.tie-card {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  display: flex;
  flex-direction: column;
}
.tie-card.tie-finished    { border-color: var(--accent); border-left: 2px solid var(--accent); }
.tie-card.tie-in-progress { border-left: 2px solid var(--draw); }

.tie-team {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0;
}
.tie-team.is-loser { opacity: 0.3; }
.tie-team.is-winner .tie-name { color: var(--text-primary); font-weight: 700; }

.tie-crest {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.tie-avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 0.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tie-name {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tie-agg {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-muted);
  min-width: 12px;
  text-align: right;
  flex-shrink: 0;
}
.tie-agg.agg-win  { color: var(--text-primary); }
.tie-agg.agg-lose { opacity: 0.35; }

.tie-middle {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border);
  margin: 0.1rem 0;
  padding: 0.1rem 0;
}

.tie-agg-label, .tie-vs {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  flex: 1;
  text-align: center;
}

.tie-date {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--accent);
  flex: 1;
  text-align: center;
}

.tie-legs {
  display: flex;
  gap: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--border);
  margin-top: 0.1rem;
}

.leg-chip {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
}
.leg-chip + .leg-chip::before { content: '·'; margin-right: 0.25rem; }

.leg-upcoming {
  font-size: 0.6rem;
  color: var(--accent);
  font-weight: 600;
}

.tie-tbd {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-style: italic;
  padding: 0.6rem 0;
}

/* ─── Leaderboard ────────────────────────────────────────────────────────── */
.leaderboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

@media (max-width: 640px) {
  .leaderboard-row { grid-template-columns: 1fr; }
}

.leaderboard-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.leaderboard-panel .panel-title {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
  margin: 0;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
}

.lb-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

.lb-row:last-child { border-bottom: none; }
.lb-row:hover { background: var(--bg-surface-2); }

.lb-rank {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 16px;
  text-align: right;
}

.lb-crest {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.lb-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.lb-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lb-team {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.lb-stat {
  font-size: 1rem;
  font-weight: 800;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.lb-stat--goals   { color: var(--win); }
.lb-stat--assists { color: var(--accent-hover); }
</style>
