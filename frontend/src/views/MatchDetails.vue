<template>
  <div class="view-container">

    <!-- ── Phase 1: League picker ─────────────────────────────────────────── -->
    <template v-if="!selectedLeague">
      <div class="page-header">
        <h1>{{ $t('matches.title') }}</h1>
        <p class="page-sub">{{ $t('matches.sub') }}</p>
      </div>

      <div v-if="leaguesLoading" class="loading">{{ $t('matches.loadingComps') }}</div>
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

    </template>

    <!-- ── Phase 2: League selected ──────────────────────────────────────── -->
    <template v-else>

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" @click="clearLeague">{{ $t('common.allLeagues') }}</button>
        <h1>
          <span class="header-flag">{{ selectedLeague.flag }}</span>
          {{ selectedLeague.name }}
        </h1>
        <p class="page-sub">
          <template v-if="activeTab === 'results'">
            {{ $t('matches.ofResults', { n: filteredMatches.length, total: allResults.length }) }}
          </template>
          <template v-else>
            {{ $t('matches.upcomingCount', { n: upcomingFiltered.length }) }}
          </template>
        </p>
      </div>

      <!-- Mode tabs -->
      <div class="mode-tabs">
        <button class="mode-tab" :class="{ active: activeTab === 'results' }" @click="activeTab = 'results'">
          {{ $t('matches.results') }}
          <span class="mode-count">{{ allResults.length }}</span>
        </button>
        <button class="mode-tab" :class="{ active: activeTab === 'fixtures' }" @click="activeTab = 'fixtures'">
          {{ $t('matches.fixtures') }}
          <span class="mode-count">{{ allUpcoming.length }}</span>
        </button>
      </div>

      <div v-if="loading" class="loading">{{ $t('matches.loadingMatches') }}</div>

      <template v-else>

        <!-- ── Results tab ────────────────────────────────────────────────── -->
        <template v-if="activeTab === 'results'">

          <!-- Stats bar -->
          <div v-if="allResults.length" class="stats-bar">
            <div class="stat-pill">
              <span class="stat-val">{{ stats.totalGoals }}</span>
              <span class="stat-lbl">{{ $t('matches.totalGoals') }}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-val">{{ stats.avgGoals }}</span>
              <span class="stat-lbl">{{ $t('matches.avgGame') }}</span>
            </div>
            <div class="stat-pill stat-pill--win">
              <span class="stat-val">{{ stats.homeWins }}</span>
              <span class="stat-lbl">{{ $t('matches.homeWins') }}</span>
            </div>
            <div class="stat-pill stat-pill--draw">
              <span class="stat-val">{{ stats.draws }}</span>
              <span class="stat-lbl">{{ $t('matches.draws') }}</span>
            </div>
            <div class="stat-pill stat-pill--lose">
              <span class="stat-val">{{ stats.awayWins }}</span>
              <span class="stat-lbl">{{ $t('matches.awayWins') }}</span>
            </div>
          </div>

          <!-- Biggest win card -->
          <div v-if="stats.biggestWin" class="biggest-win-card">
            <span class="biggest-win-label">{{ $t('matches.biggestWin') }}</span>
            <div class="biggest-win-match">
              <div class="bw-team">
                <span class="bw-name">{{ stats.biggestWin.HomeTeam }}</span>
                <img v-if="stats.biggestWin.HomeCrest" :src="stats.biggestWin.HomeCrest" class="bw-crest" :alt="stats.biggestWin.HomeTeam" />
              </div>
              <span class="bw-score">{{ stats.biggestWin.Score }}</span>
              <div class="bw-team bw-team--away">
                <img v-if="stats.biggestWin.AwayCrest" :src="stats.biggestWin.AwayCrest" class="bw-crest" :alt="stats.biggestWin.AwayTeam" />
                <span class="bw-name">{{ stats.biggestWin.AwayTeam }}</span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="controls">
            <input v-model="searchTerm" type="text" class="search-input" :placeholder="'🔍  ' + $t('matches.searchPlaceholder')" />
            <select v-model="sortOption">
              <option value="date-desc">{{ $t('matches.newestFirst') }}</option>
              <option value="date-asc">{{ $t('matches.oldestFirst') }}</option>
            </select>
          </div>

          <!-- Result filter tabs -->
          <div class="result-filters">
            <button
              v-for="f in resultFilters"
              :key="f.value"
              class="result-tab"
              :class="[`tab--${f.value}`, { active: resultFilter === f.value }]"
              @click="resultFilter = f.value"
            >
              {{ f.label }}
              <span class="tab-count">{{ counts[f.value] }}</span>
            </button>
          </div>

          <!-- Team chips -->
          <div v-if="teamOptions.length" class="team-filter-section">
            <div class="team-chips-scroll">
              <button class="team-chip" :class="{ active: teamFilter === '' }" @click="teamFilter = ''">{{ $t('matches.allTeams') }}</button>
              <button
                v-for="team in teamOptions"
                :key="team"
                class="team-chip"
                :class="{ active: teamFilter === team }"
                @click="teamFilter = team"
              >{{ team }}</button>
            </div>
          </div>

          <p v-if="teamFilter" class="team-filter-summary">
            {{ $t('matches.matchesInvolving') }} <strong>{{ teamFilter }}</strong>
            <span class="summary-count">({{ filteredMatches.length }})</span>
            <button class="clear-filter" @click="teamFilter = ''">{{ $t('matches.clearFilter') }}</button>
          </p>

          <!-- Grouped results -->
          <template v-if="groupedResults.length">
            <div v-for="group in groupedResults" :key="group.label" class="matchday-group">
              <div class="group-header">
                <span class="group-label">{{ group.label }}</span>
                <span class="group-dates">{{ group.dateRange }}</span>
              </div>
              <ul class="match-list">
                <template v-for="match in group.matches" :key="match.Match_ID">
                  <li
                    class="match-row"
                    :class="[rowClass(match.Score), { 'match-row--expanded': expandedMatchId === match.Match_ID }]"
                    @click="toggleComments(match.Match_ID)"
                  >
                    <span class="match-date">{{ formatDate(match.MatchDate) }}</span>
                    <div class="match-teams">
                      <span class="team-name home">{{ match.HomeTeam }}</span>
                      <img v-if="match.HomeCrest" :src="match.HomeCrest" class="match-crest" :alt="match.HomeTeam" />
                      <span class="score-pill" :class="scoreClass(match.Score)">{{ match.Score }}</span>
                      <img v-if="match.AwayCrest" :src="match.AwayCrest" class="match-crest" :alt="match.AwayTeam" />
                      <span class="team-name away">{{ match.AwayTeam }}</span>
                    </div>
                    <div class="match-row-right">
                      <span class="result-label" :class="scoreClass(match.Score)">{{ resultLabel(match.Score) }}</span>
                      <span class="comment-toggle" :class="{ active: expandedMatchId === match.Match_ID }">
                        💬 <span v-if="getCommentCount(match.Match_ID) > 0" class="comment-count">{{ getCommentCount(match.Match_ID) }}</span>
                      </span>
                    </div>
                  </li>
                  <!-- Comments panel -->
                  <li v-if="expandedMatchId === match.Match_ID" class="comments-panel-row" @click.stop>
                    <div class="comments-panel">
                      <div v-if="commentsLoading[match.Match_ID]" class="comments-loading">{{ $t('matches.loadingComments') }}</div>
                      <template v-else>
                        <div v-if="commentsCache[match.Match_ID]?.length" class="comments-list">
                          <div v-for="c in commentsCache[match.Match_ID]" :key="c.Comment_ID" class="comment-item">
                            <div class="comment-header">
                              <span class="comment-username">{{ c.Username }}</span>
                              <span class="comment-time">{{ formatCommentTime(c.CreatedAt) }}</span>
                              <button
                                v-if="currentUser && currentUser.id !== c.User_ID && currentUser.role?.toLowerCase() !== 'admin'"
                                class="comment-report"
                                :class="{ reported: reportedComments.has(c.Comment_ID) }"
                                :disabled="reportedComments.has(c.Comment_ID) || reportingComment.has(c.Comment_ID)"
                                :title="reportedComments.has(c.Comment_ID) ? 'Reported' : 'Report comment'"
                                @click.stop="reportComment(c.Comment_ID)"
                              >{{ reportedComments.has(c.Comment_ID) ? $t('matches.reported') : '🚩' }}</button>
                              <button
                                v-if="currentUser && (currentUser.id === c.User_ID || currentUser.role?.toLowerCase() === 'admin')"
                                class="comment-delete"
                                @click="deleteComment(match.Match_ID, c.Comment_ID)"
                              >×</button>
                            </div>
                            <p class="comment-content">{{ c.Content }}</p>
                          </div>
                        </div>
                        <p v-else class="comments-empty">{{ $t('matches.noComments') }}</p>

                        <div v-if="currentUser" class="comment-form">
                          <input
                            v-model="commentDraft[match.Match_ID]"
                            class="comment-input"
                            type="text"
                            :placeholder="$t('matches.commentPlaceholder')"
                            maxlength="500"
                            @keydown.enter.prevent="postComment(match.Match_ID)"
                          />
                          <button
                            class="comment-submit"
                            :disabled="!commentDraft[match.Match_ID]?.trim() || postingComment[match.Match_ID]"
                            @click="postComment(match.Match_ID)"
                          >{{ postingComment[match.Match_ID] ? '...' : $t('matches.post') }}</button>
                        </div>
                        <p v-else class="comments-login-prompt">
                          <RouterLink to="/login">{{ $t('matches.login') }}</RouterLink> {{ $t('matches.toComment') }}
                        </p>
                      </template>
                    </div>
                  </li>
                </template>
              </ul>
            </div>
          </template>
          <p v-else class="empty-state">
            {{ allResults.length === 0 ? $t('matches.noResults') : $t('matches.noMatches') }}
          </p>

        </template>

        <!-- ── Fixtures tab ───────────────────────────────────────────────── -->
        <template v-else>

          <div class="controls">
            <input v-model="fixtureSearch" type="text" class="search-input" :placeholder="'🔍  ' + $t('matches.searchPlaceholder')" />
          </div>

          <template v-if="groupedFixtures.length">
            <div v-for="group in groupedFixtures" :key="group.label" class="matchday-group">
              <div class="group-header">
                <span class="group-label">{{ group.label }}</span>
                <span class="group-dates">{{ group.dateRange }}</span>
              </div>
              <ul class="match-list">
                <li
                  v-for="match in group.matches"
                  :key="match.Match_ID"
                  class="match-row match-row--fixture"
                >
                  <div class="fixture-time-col">
                    <span class="match-date">{{ formatDate(match.MatchDate) }}</span>
                    <span class="fixture-time">{{ formatTime(match.MatchDate) }}</span>
                  </div>
                  <div class="match-teams">
                    <span class="team-name home">{{ match.HomeTeam }}</span>
                    <img v-if="match.HomeCrest" :src="match.HomeCrest" class="match-crest" :alt="match.HomeTeam" />
                    <span class="fixture-vs">vs</span>
                    <img v-if="match.AwayCrest" :src="match.AwayCrest" class="match-crest" :alt="match.AwayTeam" />
                    <span class="team-name away">{{ match.AwayTeam }}</span>
                  </div>
                  <span class="fixture-badge">{{ $t('matches.upcoming') }}</span>
                </li>
              </ul>
            </div>
          </template>
          <p v-else class="empty-state">{{ $t('matches.noFixtures') }}</p>

        </template>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import api from '../services/api'

const { t } = useI18n()

// ── Leagues ───────────────────────────────────────────────────────────────────
const store = useStore()
const currentUser = computed(() => store.state.user)

// ── Comments ──────────────────────────────────────────────────────────────────
const expandedMatchId = ref(null)
const commentsCache = ref({})
const commentsLoading = ref({})
const commentDraft = ref({})
const postingComment = ref({})
const commentCounts = ref({})
const reportingComment = ref(new Set())

// Persist reported comment IDs in localStorage, keyed by user ID
function reportedKey() {
  return `reportedComments_${currentUser.value?.id ?? 'guest'}`
}
function loadReported() {
  try { return new Set(JSON.parse(localStorage.getItem(reportedKey()) || '[]')) }
  catch { return new Set() }
}
function saveReported(set) {
  localStorage.setItem(reportedKey(), JSON.stringify([...set]))
}

const reportedComments = ref(loadReported())

async function reportComment(commentId) {
  if (reportedComments.value.has(commentId) || reportingComment.value.has(commentId)) return
  reportingComment.value = new Set([...reportingComment.value, commentId])
  try {
    await api.post(`/comments/${commentId}/report`)
    const updated = new Set([...reportedComments.value, commentId])
    reportedComments.value = updated
    saveReported(updated)
  } catch (e) {
    console.error('Report error:', e)
  } finally {
    const s = new Set(reportingComment.value)
    s.delete(commentId)
    reportingComment.value = s
  }
}

async function fetchCommentCounts(matches) {
  if (!matches.length) return
  const ids = matches.map(m => m.Match_ID).join(',')
  try {
    const res = await api.get('/comments/counts', { params: { matchIds: ids } })
    commentCounts.value = { ...commentCounts.value, ...res.data }
  } catch { /* non-critical */ }
}

function getCommentCount(matchId) {
  if (commentsCache.value[matchId]) return commentsCache.value[matchId].length
  return commentCounts.value[matchId] ?? null
}

async function toggleComments(matchId) {
  if (expandedMatchId.value === matchId) {
    expandedMatchId.value = null
    return
  }
  expandedMatchId.value = matchId
  if (!commentsCache.value[matchId]) {
    commentsLoading.value = { ...commentsLoading.value, [matchId]: true }
    try {
      const res = await api.get('/comments', { params: { matchId } })
      commentsCache.value = { ...commentsCache.value, [matchId]: res.data }
    } catch {
      commentsCache.value = { ...commentsCache.value, [matchId]: [] }
    } finally {
      const copy = { ...commentsLoading.value }
      delete copy[matchId]
      commentsLoading.value = copy
    }
  }
}

async function postComment(matchId) {
  const text = commentDraft.value[matchId]?.trim()
  if (!text) return
  postingComment.value = { ...postingComment.value, [matchId]: true }
  try {
    const res = await api.post('/comments', { matchId, content: text })
    commentsCache.value = {
      ...commentsCache.value,
      [matchId]: [...(commentsCache.value[matchId] || []), res.data],
    }
    commentDraft.value = { ...commentDraft.value, [matchId]: '' }
  } catch (e) {
    console.error('Post comment error:', e)
  } finally {
    const copy = { ...postingComment.value }
    delete copy[matchId]
    postingComment.value = copy
  }
}

async function deleteComment(matchId, commentId) {
  try {
    await api.delete(`/comments/${commentId}`)
    commentsCache.value = {
      ...commentsCache.value,
      [matchId]: commentsCache.value[matchId].filter(c => c.Comment_ID !== commentId),
    }
  } catch (e) {
    console.error('Delete comment error:', e)
  }
}

const formatCommentTime = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// ── Leagues ───────────────────────────────────────────────────────────────────
const leagues = ref([])
const leaguesLoading = ref(false)
const selectedLeague = ref(null)

// ── Match data ────────────────────────────────────────────────────────────────
const allResults = ref([])
const allUpcoming = ref([])
const loading = ref(false)

// ── UI state ──────────────────────────────────────────────────────────────────
const activeTab    = ref('results')
const searchTerm   = ref('')
const sortOption   = ref('date-desc')
const resultFilter = ref('all')
const teamFilter   = ref('')
const fixtureSearch = ref('')

const resultFilters = computed(() => [
  { value: 'all',  label: t('matches.all') },
  { value: 'win',  label: t('matches.homeWin') },
  { value: 'draw', label: t('matches.draw') },
  { value: 'lose', label: t('matches.awayWin') },
])

// ── Stage config (for CL and other knockout comps) ────────────────────────────
const STAGE_ORDER = ['LEAGUE_STAGE', 'LEAGUE_PHASE', 'GROUP_STAGE', 'PLAYOFFS', 'PLAYOFF_ROUND', 'LAST_16', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']
const STAGE_LABELS = {
  LEAGUE_STAGE:    'League Phase',
  LEAGUE_PHASE:    'League Phase',
  GROUP_STAGE:     'Group Stage',
  PLAYOFFS:        'Play-offs',
  PLAYOFF_ROUND:   'Play-off',
  LAST_16:         'Round of 16',
  ROUND_OF_16:     'Round of 16',
  QUARTER_FINALS:  'Quarter Finals',
  SEMI_FINALS:     'Semi Finals',
  THIRD_PLACE:     '3rd Place',
  FINAL:           'Final',
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  leaguesLoading.value = true
  try {
    const res = await api.get('/leagues')
    leagues.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    leaguesLoading.value = false
  }
})

// ── Actions ───────────────────────────────────────────────────────────────────
async function pickLeague(league) {
  selectedLeague.value = league
  allResults.value = []
  allUpcoming.value = []
  activeTab.value = 'results'
  searchTerm.value = ''
  resultFilter.value = 'all'
  teamFilter.value = ''
  fixtureSearch.value = ''
  loading.value = true
  try {
    const [resData, upData] = await Promise.all([
      api.get('/matches', { params: { code: league.code } }),
      api.get('/matches', { params: { code: league.code, status: 'upcoming' } }),
    ])
    allResults.value  = resData.data.filter(m => m.HomeTeam && m.AwayTeam)
    allUpcoming.value = upData.data.filter(m => m.HomeTeam && m.AwayTeam)
    fetchCommentCounts(allResults.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function clearLeague() {
  selectedLeague.value = null
  allResults.value = []
  allUpcoming.value = []
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })


function getResult(score) {
  if (!score || !score.includes('-')) return null
  const [h, a] = score.split('-').map(Number)
  if (h > a) return 'win'
  if (h < a) return 'lose'
  return 'draw'
}

function scoreClass(score)  { return getResult(score) || '' }
function rowClass(score)    { return `border-${getResult(score) || 'none'}` }
function resultLabel(score) {
  const r = getResult(score)
  if (r === 'win')  return 'H'
  if (r === 'lose') return 'A'
  if (r === 'draw') return 'D'
  return ''
}

// ── Grouping ──────────────────────────────────────────────────────────────────
const REGULAR_STAGES = new Set(['REGULAR_SEASON', 'LEAGUE_PHASE', 'GROUP_STAGE'])

function getGroupInfo(match) {
  // For knockout/cup stages, group by stage name even if Matchday is set
  if (match.Stage && !REGULAR_STAGES.has(match.Stage)) {
    const idx = STAGE_ORDER.indexOf(match.Stage)
    return { key: `st_${match.Stage}`, sortVal: idx !== -1 ? idx : 999, type: 'stage' }
  }
  if (match.Matchday != null) {
    return { key: `md_${match.Matchday}`, sortVal: match.Matchday, type: 'matchday' }
  }
  if (match.Stage) {
    const idx = STAGE_ORDER.indexOf(match.Stage)
    return { key: `st_${match.Stage}`, sortVal: idx !== -1 ? idx : 999, type: 'stage' }
  }
  // Fallback: weekly bucket
  const d = new Date(match.MatchDate)
  const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))
  return { key: `wk_${weekNum}`, sortVal: d.getTime(), type: 'date' }
}

function buildGroups(matchList, ascending) {
  const map = new Map()

  for (const m of matchList) {
    const { key, sortVal, type } = getGroupInfo(m)
    if (!map.has(key)) map.set(key, { matches: [], sortVal, key, type })
    map.get(key).matches.push(m)
  }

  return [...map.values()]
    .map(({ matches, sortVal, key, type }) => {
      const dates = matches.map(m => new Date(m.MatchDate)).sort((a, b) => a - b)
      const first = dates[0]
      const last  = dates[dates.length - 1]
      const opts  = { month: 'short', day: 'numeric' }
      const sameDay = first.toDateString() === last.toDateString()
      const dateRange = sameDay
        ? first.toLocaleDateString(undefined, opts)
        : `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}`

      let label
      if (type === 'matchday') {
        label = t('matches.matchday', { n: key.replace('md_', '') })
      } else if (type === 'stage') {
        const stage = key.replace('st_', '')
        label = STAGE_LABELS[stage] || stage.replace(/_/g, ' ')
      } else {
        label = dateRange
      }

      const sortedMatches = [...matches].sort((a, b) => {
        const diff = new Date(a.MatchDate) - new Date(b.MatchDate)
        return ascending ? diff : -diff
      })

      return { label, dateRange, matches: sortedMatches, sortVal }
    })
    .sort((a, b) => ascending ? a.sortVal - b.sortVal : b.sortVal - a.sortVal)
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const r = allResults.value
  let goals = 0, homeWins = 0, draws = 0, awayWins = 0
  let biggestWin = null, biggestDiff = 0

  for (const m of r) {
    if (!m.Score || !m.Score.includes('-')) continue
    const [h, a] = m.Score.split('-').map(Number)
    goals += h + a
    if (h > a) {
      homeWins++
      const diff = h - a
      if (diff > biggestDiff || (diff === biggestDiff && biggestWin && h + a > biggestWin.Score.split('-').map(Number).reduce((s, n) => s + n, 0))) {
        biggestDiff = diff
        biggestWin = m
      }
    } else if (a > h) {
      awayWins++
      const diff = a - h
      if (diff > biggestDiff || (diff === biggestDiff && biggestWin && a + h > biggestWin.Score.split('-').map(Number).reduce((s, n) => s + n, 0))) {
        biggestDiff = diff
        biggestWin = m
      }
    } else {
      draws++
    }
  }

  const played = r.filter(m => m.Score && m.Score.includes('-')).length

  return {
    totalGoals: goals,
    avgGoals: played ? (goals / played).toFixed(1) : '0.0',
    homeWins,
    draws,
    awayWins,
    biggestWin,
  }
})

// ── Results computed pipeline ─────────────────────────────────────────────────
const sorted = computed(() => {
  const arr = [...allResults.value]
  return arr.sort((a, b) => {
    const dA = new Date(a.MatchDate), dB = new Date(b.MatchDate)
    return sortOption.value === 'date-asc' ? dA - dB : dB - dA
  })
})

const afterSearch = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term) return sorted.value
  return sorted.value.filter(m =>
    (m.HomeTeam || '').toLowerCase().includes(term) ||
    (m.AwayTeam || '').toLowerCase().includes(term)
  )
})

const afterTeamFilter = computed(() => {
  if (!teamFilter.value) return afterSearch.value
  const team = teamFilter.value
  return afterSearch.value.filter(m => m.HomeTeam === team || m.AwayTeam === team)
})

const filteredMatches = computed(() => {
  if (resultFilter.value === 'all') return afterTeamFilter.value
  return afterTeamFilter.value.filter(m => getResult(m.Score) === resultFilter.value)
})

const counts = computed(() => ({
  all:  afterTeamFilter.value.length,
  win:  afterTeamFilter.value.filter(m => getResult(m.Score) === 'win').length,
  draw: afterTeamFilter.value.filter(m => getResult(m.Score) === 'draw').length,
  lose: afterTeamFilter.value.filter(m => getResult(m.Score) === 'lose').length,
}))

const teamOptions = computed(() => {
  const names = new Set()
  for (const m of allResults.value) {
    if (m.HomeTeam) names.add(m.HomeTeam)
    if (m.AwayTeam) names.add(m.AwayTeam)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
})

const groupedResults = computed(() =>
  buildGroups(filteredMatches.value, sortOption.value === 'date-asc')
)

// ── Fixtures computed ─────────────────────────────────────────────────────────
const upcomingFiltered = computed(() => {
  const term = fixtureSearch.value.toLowerCase()
  if (!term) return allUpcoming.value
  return allUpcoming.value.filter(m =>
    (m.HomeTeam || '').toLowerCase().includes(term) ||
    (m.AwayTeam || '').toLowerCase().includes(term)
  )
})

const groupedFixtures = computed(() => buildGroups(upcomingFiltered.value, true))
</script>

<style scoped>
.view-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* ─── Page header ────────────────────────────────────────────────────────────── */
.page-header { margin-bottom: 1.75rem; }

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.header-flag { font-size: 1.6rem; }

.page-sub {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* ─── Back button ────────────────────────────────────────────────────────────── */
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

/* ─── League picker grid ─────────────────────────────────────────────────────── */
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

/* ─── Season selector ───────────────────────────────────────────────────── */
.season-bar {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.season-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.season-btn:hover { border-color: rgba(245,158,11,0.4); color: var(--text-primary); }
.season-btn.active { background: rgba(245,158,11,0.1); border-color: var(--accent-green); color: var(--accent-green-hover); }

/* ─── Mode tabs (Results / Fixtures) ─────────────────────────────────────────── */
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.mode-tab:hover { color: var(--text-secondary); }
.mode-tab.active { color: var(--accent-hover); border-bottom-color: var(--accent); }

.mode-count {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 7px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
}
.mode-tab.active .mode-count {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent-hover);
}

/* ─── Stats bar ──────────────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
}
.stats-bar::-webkit-scrollbar { display: none; }

.stat-pill {
  flex-shrink: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 72px;
}

.stat-pill--win  { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.06); }
.stat-pill--draw { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.06); }
.stat-pill--lose { border-color: rgba(239,68,68,0.3);  background: rgba(239,68,68,0.06); }
.stat-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-pill--win  .stat-val { color: var(--win); }
.stat-pill--draw .stat-val { color: var(--draw); }
.stat-pill--lose .stat-val { color: var(--lose); }

/* ─── Biggest win card ───────────────────────────────────────────────────────── */
.biggest-win-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.65rem 1.25rem 0.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.biggest-win-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.biggest-win-match {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.85rem;
}

.bw-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  min-width: 0;
}
.bw-team--away {
  justify-content: flex-start;
}

.bw-crest {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.3));
}

.bw-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bw-score {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  background: var(--win);
  border-radius: 999px;
  padding: 0.2rem 0.85rem;
  flex-shrink: 0;
}

.stat-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ─── Controls ───────────────────────────────────────────────────────────────── */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  min-width: 220px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { outline: none; border-color: var(--accent); }

select {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.6rem 0.85rem;
  font-size: 0.875rem;
  cursor: pointer;
}
select:focus { outline: none; border-color: var(--accent); }
select option {
  background: var(--bg-surface, #0f1117);
  color: var(--text-primary, #f1f5f9);
}

/* ─── Result filter tabs ─────────────────────────────────────────────────────── */
.result-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.result-tab {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: all 0.15s;
}
.result-tab:hover { color: var(--text-primary); border-color: var(--border-hover); }

.tab-count {
  background: var(--bg-surface-2);
  border-radius: 999px;
  padding: 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
}

.tab--all.active  { background: var(--accent-muted); color: var(--accent-hover); border-color: var(--accent); }
.tab--all.active .tab-count { background: var(--accent); color: #fff; }

.tab--win.active  { background: var(--win-muted); color: var(--win); border-color: var(--win); }
.tab--win.active .tab-count { background: var(--win); color: #fff; }

.tab--draw.active { background: var(--draw-muted); color: var(--draw); border-color: var(--draw); }
.tab--draw.active .tab-count { background: var(--draw); color: #0d1117; }

.tab--lose.active { background: var(--lose-muted); color: var(--lose); border-color: var(--lose); }
.tab--lose.active .tab-count { background: var(--lose); color: #fff; }

/* ─── Team filter chips ──────────────────────────────────────────────────────── */
.team-filter-section { margin-bottom: 1rem; }

.team-chips-scroll {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.team-chip {
  flex-shrink: 0;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: all 0.15s;
  white-space: nowrap;
}
.team-chip:hover { border-color: var(--border-hover); color: var(--text-primary); }
.team-chip.active { background: var(--accent-muted); color: var(--accent-hover); border-color: var(--accent); }

/* ─── Active team filter summary ─────────────────────────────────────────────── */
.team-filter-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.team-filter-summary strong { color: var(--accent-hover); font-weight: 700; }
.summary-count { color: var(--text-muted); }

.clear-filter {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.15rem 0.55rem;
  transition: all 0.15s;
  margin-left: 0.25rem;
}
.clear-filter:hover { border-color: var(--lose); color: var(--lose); }

/* ─── Matchday groups ────────────────────────────────────────────────────────── */
.matchday-group {
  margin-bottom: 1.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.group-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.group-dates {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* ─── Match list ─────────────────────────────────────────────────────────────── */
.match-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.match-row {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-left-color: var(--border);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.1rem;
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s, border-color 0.15s;
}
.match-row:hover { box-shadow: var(--shadow-lg); }
.match-row--fixture { grid-template-columns: 100px 1fr auto; border-left-color: var(--border); }

.border-win  { border-left-color: var(--win); }
.border-lose { border-left-color: var(--lose); }
.border-draw { border-left-color: var(--draw); }

.match-date {
  font-size: 0.76rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* fixture time col */
.fixture-time-col {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.fixture-time { font-size: 0.7rem; color: var(--text-muted); }

/* teams row */
.match-teams {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  justify-content: center;
  min-width: 0;
}

.team-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.team-name.home { text-align: right; }
.team-name.away { text-align: left; }

.match-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
}

/* Score pill */
.score-pill {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.875rem;
  min-width: 52px;
  text-align: center;
  flex-shrink: 0;
  color: #fff;
}
.score-pill.win  { background: var(--win); }
.score-pill.lose { background: var(--lose); }
.score-pill.draw { background: var(--draw); color: #0d1117; }

/* Fixture vs badge */
.fixture-vs {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
}

/* Result label (H/A/D) */
.result-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 4px;
  min-width: 22px;
  text-align: center;
}
.result-label.win  { background: var(--win-muted);  color: var(--win); }
.result-label.lose { background: var(--lose-muted); color: var(--lose); }
.result-label.draw { background: var(--draw-muted); color: var(--draw); }

/* Fixture badge */
.fixture-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent-hover);
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}

/* ─── Loading / empty ────────────────────────────────────────────────────────── */
.loading {
  text-align: center;
  color: var(--text-muted);
  margin-top: 3rem;
  font-size: 0.9rem;
  font-style: italic;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 4rem;
}

/* ─── Comments ───────────────────────────────────────────────────────────────── */
.match-row { cursor: pointer; }
.match-row--expanded { border-bottom: none; }

.match-row-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.comment-toggle {
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.comment-toggle.active { color: var(--accent-hover); border-color: var(--accent); background: var(--accent-muted); }

.comments-panel-row {
  list-style: none;
  background: var(--bg-surface-2);
  border-bottom: 1px solid var(--border);
}

.comments-panel {
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.comments-loading { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

.comments-list { display: flex; flex-direction: column; gap: 0.5rem; }

.comment-item {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.comment-username { font-size: 0.75rem; font-weight: 700; color: var(--accent-hover); }
.comment-time { font-size: 0.68rem; color: var(--text-muted); flex: 1; }

.comment-report {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.7rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.15s;
  margin-left: auto;
}
.comment-report:hover:not(:disabled) { color: #f97316; }
.comment-report.reported { color: #f97316; cursor: default; font-size: 0.65rem; font-weight: 600; }
.comment-report:disabled { opacity: 0.5; }

.comment-delete {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.15s;
}
.comment-delete:hover { color: var(--lose); }

.comment-content { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin: 0; }

.comments-empty { font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin: 0; }

.comment-form { display: flex; gap: 0.5rem; }

.comment-input {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.4rem 0.7rem;
  font-size: 0.82rem;
  transition: border-color 0.2s;
  min-width: 0;
}
.comment-input:focus { outline: none; border-color: var(--accent); }
.comment-input::placeholder { color: var(--text-muted); }

.comment-submit {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.comment-submit:hover:not(:disabled) { background: var(--accent-hover); }
.comment-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.comments-login-prompt { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
.comments-login-prompt a { color: var(--accent-hover); text-decoration: none; }
.comments-login-prompt a:hover { text-decoration: underline; }

/* ─── Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 580px) {
  /* Search input: remove min-width so it fills available space */
  .search-input { min-width: 0; width: 100%; }

  /* Match result rows: narrow date col, keep right col wide enough for comment toggle */
  .match-row {
    grid-template-columns: 46px 1fr auto;
    gap: 0.4rem;
    padding: 0.6rem 0.65rem;
  }
  /* Fixture rows: no right col */
  .match-row--fixture { grid-template-columns: 46px 1fr; }
  .fixture-badge { display: none; }

  /* Date text smaller */
  .match-date { font-size: 0.65rem; }
  .fixture-time { font-size: 0.62rem; }

  /* Teams: tighter gap, smaller crests and font */
  .match-teams { gap: 0.3rem; }
  .match-crest { width: 14px; height: 14px; }
  .team-name { font-size: 0.76rem; }

  /* Score pill: slightly smaller */
  .score-pill { min-width: 38px; font-size: 0.76rem; padding: 0.12rem 0.35rem; }

  /* Right col: hide result label chip, keep comment toggle */
  .result-label { display: none; }
  .match-row-right { gap: 0; }
  .comment-toggle { padding: 0.1rem 0.35rem; font-size: 0.65rem; }

  /* Comments panel: prevent overflow, let header wrap */
  .comments-panel { padding: 0.65rem 0.75rem; gap: 0.5rem; }
  .comment-header { flex-wrap: wrap; gap: 0.3rem; }
  .comment-time { flex: none; }
  .comment-report { margin-left: 0; }
  .comment-content { font-size: 0.8rem; word-break: break-word; }
  /* Comment form: stack on very narrow screens */
  .comment-form { flex-wrap: wrap; }
  .comment-input { min-width: 0; }
  .comment-submit { width: 100%; }
}
</style>
