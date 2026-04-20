<template>
  <div class="view-container">

    <!-- Back link -->
    <RouterLink to="/teams" class="back-link">{{ $t('common.allTeams') }}</RouterLink>

    <!-- Loading -->
    <div v-if="loading" class="loading">{{ $t('teamDetails.loading') }}</div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else-if="team">
      <!-- Team header -->
      <div class="team-header">
        <div class="header-banner">
          <img v-if="team.Crest" :src="team.Crest" class="header-crest-img" :alt="team.Team_Name" />
          <div v-else class="header-crest">{{ team.Team_Name.charAt(0).toUpperCase() }}</div>
        </div>
        <div class="header-info">
          <h1>{{ team.Team_Name }}</h1>
          <div class="header-meta">
            <span class="meta-pill"><span class="meta-icon">👤</span><span>{{ team.Coach_name || '—' }}</span><span v-if="team.Coach_nationality" class="pill-flag">{{ nationalityFlag(team.Coach_nationality) }}</span></span>
            <span class="meta-pill"><span class="meta-icon">🌍</span> {{ team.Country || '—' }}</span>
            <span class="meta-pill accent-pill"><span class="meta-icon">👥</span> {{ team.players.length }} players</span>
          </div>

          <!-- Recent form -->
          <div v-if="team.recentMatches && team.recentMatches.length" class="form-row">
            <span class="form-label">{{ $t('common.form') }}</span>
            <div class="form-pills">
              <span
                v-for="m in [...team.recentMatches].reverse()"
                :key="m.Match_ID"
                class="form-pill"
                :class="`form-${matchResult(m)}`"
                :title="`${m.HomeTeam} ${m.Score} ${m.AwayTeam}`"
              >{{ matchResult(m).toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Top-level Squad / Stats tabs ───────────────────────────────── -->
      <div class="main-tabs">
        <button
          class="main-tab"
          :class="{ active: mainTab === 'squad' }"
          @click="mainTab = 'squad'"
        >{{ $t('teamDetails.squad') }}</button>
        <button
          class="main-tab"
          :class="{ active: mainTab === 'stats' }"
          @click="mainTab = 'stats'"
        >{{ $t('teamDetails.stats') }}</button>
      </div>

      <!-- ══════════ SQUAD TAB ══════════════════════════════════════════════ -->
      <template v-if="mainTab === 'squad'">

        <!-- Recent matches -->
        <div v-if="team.recentMatches && team.recentMatches.length" class="recent-section">
          <h2 class="recent-title">{{ $t('teamDetails.recentMatches') }}</h2>
          <div class="recent-list">
            <div
              v-for="m in team.recentMatches"
              :key="m.Match_ID"
              class="recent-row"
              :class="`border-${matchResult(m)}`"
            >
              <span class="recent-date">{{ formatDate(m.MatchDate) }}</span>
              <div class="recent-teams">
                <span class="recent-team" :class="{ 'is-this-team': m.HomeTeamID === team.Team_ID }">{{ m.HomeTeam }}</span>
                <span class="recent-score" :class="matchResult(m)">{{ m.Score }}</span>
                <span class="recent-team away" :class="{ 'is-this-team': m.AwayTeamID === team.Team_ID }">{{ m.AwayTeam }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Position group tabs -->
        <div class="pos-tabs">
          <button
            v-for="g in positionGroups"
            :key="g.value"
            class="pos-tab"
            :class="[`tab--${g.cls}`, { active: activePos === g.value }]"
            @click="activePos = g.value"
          >
            {{ g.label }}
            <span class="tab-count">{{ groupCount(g.value) }}</span>
          </button>
        </div>

        <!-- Player roster -->
        <div
          v-for="group in visibleGroups"
          :key="group.pos"
          class="position-section"
        >
          <h2 class="section-title" :class="`title-${group.cls}`">
            <span class="section-dot" :class="`dot-${group.cls}`"></span>
            {{ group.label }}
          </h2>
          <div class="player-row-list">
            <div
              v-for="player in group.players"
              :key="player.Player_ID"
              class="player-row"
              :class="`row-${group.cls}`"
              style="cursor:pointer"
              @click="$router.push(`/players/${player.Player_ID}?teamId=${team.Team_ID}&code=${team.leagueCode}`)"
            >
              <div class="row-avatar" :class="`avatar-${group.cls}`">
                {{ player.Name.charAt(0).toUpperCase() }}
              </div>
              <div class="row-info">
                <span class="row-name">{{ player.Name }} {{ player.Surname }}</span>
              </div>
              <span class="pos-badge pos-badge--sm" :class="`pos-badge--${posClass(player.Position)}`">{{ posAbbr(player.DetailedPosition) }}</span>
              <span class="row-age"><span v-if="player.Nationality" class="row-flag">{{ nationalityFlag(player.Nationality) }}</span>{{ player.Age }}</span>
            </div>
          </div>
        </div>

      </template>

      <!-- ══════════ STATS TAB ══════════════════════════════════════════════ -->
      <template v-else-if="mainTab === 'stats'">

        <p v-if="!team.tableRow && (!team.recentMatches || !team.recentMatches.length)" class="no-stats">
          {{ $t('teamDetails.noData') }}
        </p>

        <template v-else>

          <!-- Season stats from league table -->
          <template v-if="team.tableRow">
            <h2 class="stats-section-title">2025/26 Season — {{ team.leagueName }}</h2>
            <div class="stat-grid">
              <div class="stat-card stat-card--played">
                <span class="stat-value">{{ team.tableRow.P }}</span>
                <span class="stat-label">{{ $t('teamDetails.played') }}</span>
              </div>
              <div class="stat-card stat-card--win">
                <span class="stat-value">{{ team.tableRow.W }}</span>
                <span class="stat-label">{{ $t('teamDetails.wins') }}</span>
              </div>
              <div class="stat-card stat-card--draw">
                <span class="stat-value">{{ team.tableRow.D }}</span>
                <span class="stat-label">{{ $t('teamDetails.draws') }}</span>
              </div>
              <div class="stat-card stat-card--loss">
                <span class="stat-value">{{ team.tableRow.L }}</span>
                <span class="stat-label">{{ $t('teamDetails.losses') }}</span>
              </div>
              <div class="stat-card stat-card--gf">
                <span class="stat-value">{{ team.tableRow.GF }}</span>
                <span class="stat-label">{{ $t('teamDetails.goalsScored') }}</span>
              </div>
              <div class="stat-card stat-card--ga">
                <span class="stat-value">{{ team.tableRow.GA }}</span>
                <span class="stat-label">{{ $t('teamDetails.goalsConceded') }}</span>
              </div>
            </div>

            <!-- Points + GD highlight row -->
            <div class="highlight-row">
              <div class="highlight-card">
                <span class="highlight-value">{{ team.tableRow.Pts }}</span>
                <span class="highlight-label">{{ $t('teamDetails.points') }}</span>
              </div>
              <div class="highlight-card highlight-card--gd" :class="team.tableRow.GD > 0 ? 'positive' : team.tableRow.GD < 0 ? 'negative' : ''">
                <span class="highlight-value">{{ team.tableRow.GD > 0 ? '+' : '' }}{{ team.tableRow.GD }}</span>
                <span class="highlight-label">{{ $t('teamDetails.goalDiff') }}</span>
              </div>
            </div>
          </template>

          <!-- Last 5 form bar -->
          <div v-if="last5.length" class="form-section">
            <h2 class="stats-section-title">{{ $t('teamDetails.last5', { n: last5.length }) }}</h2>
            <div class="form-bar">
              <div
                v-for="(m, i) in last5"
                :key="i"
                class="form-block"
                :class="`form-block--${matchResult(m)}`"
                :title="`${m.HomeTeam} ${m.Score} ${m.AwayTeam} (${formatDate(m.MatchDate)})`"
              >
                {{ matchResult(m).toUpperCase() }}
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
import { useI18n } from 'vue-i18n'
import api from '../services/api'
import { nationalityFlag, posClass, posAbbr } from '../utils/football'

const route = useRoute()
const { t } = useI18n()
const team = ref(null)
const loading = ref(true)
const error = ref('')
const activePos = ref('all')
const mainTab = ref('squad')

const positionGroups = computed(() => [
  { value: 'all',        label: t('teamDetails.all'),        cls: 'all' },
  { value: 'Goalkeeper', label: t('teamDetails.goalkeepers'), cls: 'gk' },
  { value: 'Defender',   label: t('teamDetails.defenders'),   cls: 'def' },
  { value: 'Midfielder', label: t('teamDetails.midfielders'), cls: 'mid' },
  { value: 'Forward',    label: t('teamDetails.forwards'),    cls: 'fwd' },
])

onMounted(async () => {
  try {
    const res = await api.get(`/teams/${route.params.id}`)
    team.value = res.data
  } catch (e) {
    error.value = e.response?.status === 404 ? t('teamDetails.notFound') : t('teamDetails.loadError')
  } finally {
    loading.value = false
  }
})

function matchResult(m) {
  if (!m.Score || !m.Score.includes('-')) return 'd'
  const [hg, ag] = m.Score.split('-').map(Number)
  const isHome = m.HomeTeamID === team.value?.Team_ID
  if (hg === ag) return 'd'
  const homeWon = hg > ag
  return (isHome ? homeWon : !homeWon) ? 'w' : 'l'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupCount(posValue) {
  if (!team.value) return 0
  if (posValue === 'all') return team.value.players.length
  return team.value.players.filter(p => p.Position === posValue).length
}


const visibleGroups = computed(() => {
  if (!team.value) return []
  const groups = positionGroups.value.filter(g => g.value !== 'all')
  return groups
    .map(g => ({
      ...g,
      players: team.value.players.filter(p => p.Position === g.value),
    }))
    .filter(g => {
      if (activePos.value === 'all') return g.players.length > 0
      return g.value === activePos.value && g.players.length > 0
    })
})

// Last 5 most recent (recentMatches is already DESC from the API, newest first)
const last5 = computed(() => {
  const matches = team.value?.recentMatches ?? []
  return matches.slice(0, 5)
})
</script>

<style scoped>
.view-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1.75rem;
  transition: color 0.15s;
}
.back-link:hover { color: var(--accent-hover); }

.loading, .error-state {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4rem;
  font-size: 0.95rem;
}

/* ─── Team header ─────────────────────────────────────────────────────────── */
.team-header {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  margin-bottom: 2rem;
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.header-banner {
  width: 120px;
  min-height: 110px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0c1e3d 0%, #152033 60%, #1e3050 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.header-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 40% 50%, rgba(59,130,246,0.15) 0%, transparent 70%);
}

.header-crest-img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.5));
}

.header-crest {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 1.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(59,130,246,0.45);
  position: relative;
  z-index: 1;
}

.header-info {
  padding: 1.25rem 1.5rem 1.25rem 0;
  flex: 1;
}

.header-info h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 0.65rem;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.accent-pill {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent-hover);
}

.meta-icon { font-size: 0.7rem; }

/* ─── Main Squad / Stats tabs ─────────────────────────────────────────────── */
.main-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.75rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: fit-content;
}

.main-tab {
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
  border-right: 1px solid var(--border);
}
.main-tab:last-child { border-right: none; }
.main-tab:hover { background: var(--bg-surface-2); color: var(--text-primary); }
.main-tab.active {
  background: var(--accent-muted);
  color: var(--accent-hover);
}

/* ─── Position tabs ───────────────────────────────────────────────────────── */
.pos-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.pos-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
.pos-tab:hover { color: var(--text-primary); border-color: var(--border-hover); }

.tab-count {
  background: var(--bg-surface-2);
  border-radius: 999px;
  padding: 0 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
}

.tab--all.active  { background: var(--accent-muted); color: var(--accent-hover); border-color: var(--accent); }
.tab--gk.active   { background: var(--pos-gk-muted);  color: var(--pos-gk);  border-color: var(--pos-gk); }
.tab--def.active  { background: var(--pos-def-muted); color: var(--pos-def); border-color: var(--pos-def); }
.tab--mid.active  { background: var(--pos-mid-muted); color: var(--pos-mid); border-color: var(--pos-mid); }
.tab--fwd.active  { background: var(--pos-fwd-muted); color: var(--pos-fwd); border-color: var(--pos-fwd); }

/* ─── Position section ────────────────────────────────────────────────────── */
.position-section { margin-bottom: 1.5rem; }

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-gk  { background: var(--pos-gk); }
.dot-def { background: var(--pos-def); }
.dot-mid { background: var(--pos-mid); }
.dot-fwd { background: var(--pos-fwd); }

/* ─── Player rows ─────────────────────────────────────────────────────────── */
.player-row-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
  transition: border-color 0.15s, background 0.15s;
}
.player-row:hover { background: rgba(12, 20, 35, 0.9); }

.row-gk:hover  { border-color: var(--pos-gk); }
.row-def:hover { border-color: var(--pos-def); }
.row-mid:hover { border-color: var(--pos-mid); }
.row-fwd:hover { border-color: var(--pos-fwd); }

.row-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.avatar-gk  { background: linear-gradient(135deg, var(--pos-gk),  #b45309); }
.avatar-def { background: linear-gradient(135deg, var(--pos-def), #1d4ed8); }
.avatar-mid { background: linear-gradient(135deg, var(--pos-mid), #059669); }
.avatar-fwd { background: linear-gradient(135deg, var(--pos-fwd), #b91c1c); }

.row-info { flex: 1; }

.row-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.row-age {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
.row-flag { font-size: 1rem; line-height: 1; }
.pill-flag { font-size: 1rem; line-height: 1; margin-left: 0.1rem; }

.pos-badge { border-radius: 4px; padding: 2px 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em; flex-shrink: 0; }
.pos-badge--sm { font-size: 0.6rem; padding: 1px 5px; }
.pos-badge--gk  { background: var(--pos-gk-muted);  color: var(--pos-gk);  border: 1px solid var(--pos-gk); }
.pos-badge--def { background: var(--pos-def-muted); color: var(--pos-def); border: 1px solid var(--pos-def); }
.pos-badge--mid { background: var(--pos-mid-muted); color: var(--pos-mid); border: 1px solid var(--pos-mid); }
.pos-badge--fwd { background: var(--pos-fwd-muted); color: var(--pos-fwd); border: 1px solid var(--pos-fwd); }
.pos-badge--unknown { background: var(--bg-surface-2); color: var(--text-muted); border: 1px solid var(--border); }

/* ─── Form row ─────────────────────────────────────────────────────────────── */
.form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.form-pills { display: flex; gap: 4px; }

.form-pill {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: default;
}
.form-w { background: var(--win); }
.form-d { background: var(--draw); color: #0d1117; }
.form-l { background: var(--lose); }

/* ─── Recent matches section ──────────────────────────────────────────────── */
.recent-section {
  margin-bottom: 2rem;
}

.recent-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.65rem;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius);
  padding: 0.6rem 0.75rem;
}

.border-w { border-left-color: var(--win); }
.border-d { border-left-color: var(--draw); }
.border-l { border-left-color: var(--lose); }

.recent-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 50px;
  flex-shrink: 0;
}

.recent-teams {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.recent-team {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-team.away { text-align: right; }
.recent-team.is-this-team { color: var(--text-primary); font-weight: 700; }

.recent-score {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.8rem;
  min-width: 44px;
  text-align: center;
  flex-shrink: 0;
  color: #fff;
}
.recent-score.w { background: var(--win); }
.recent-score.d { background: var(--draw); color: #0d1117; }
.recent-score.l { background: var(--lose); }

/* ─── Stats tab ───────────────────────────────────────────────────────────── */
.no-stats {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 2rem;
}

.stats-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

/* 2x3 or auto grid of stat cards */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
  margin-bottom: 2rem;
}
@media (max-width: 560px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  border-top-width: 3px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-card--win    { border-top-color: var(--win); }
.stat-card--win .stat-value { color: var(--win); }

.stat-card--draw   { border-top-color: var(--draw); }
.stat-card--draw .stat-value { color: var(--draw); }

.stat-card--loss   { border-top-color: var(--lose); }
.stat-card--loss .stat-value { color: var(--lose); }

.stat-card--played { border-top-color: var(--accent); }
.stat-card--played .stat-value { color: var(--accent-hover); }

.stat-card--gf     { border-top-color: var(--win); }
.stat-card--ga     { border-top-color: var(--lose); }

/* ─── Points + GD highlight row ───────────────────────────────────────────── */
.highlight-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-bottom: 2rem;
}

.highlight-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  border-top-width: 3px;
  border-top-color: var(--accent);
}

.highlight-value {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  color: var(--accent-hover);
}

.highlight-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.highlight-card--gd.positive .highlight-value { color: var(--win); }
.highlight-card--gd.positive { border-top-color: var(--win); }
.highlight-card--gd.negative .highlight-value { color: var(--lose); }
.highlight-card--gd.negative { border-top-color: var(--lose); }

/* Form bar */
.form-section { margin-bottom: 1.5rem; }

.form-bar {
  display: flex;
  gap: 0.5rem;
}

.form-block {
  flex: 1;
  max-width: 64px;
  height: 40px;
  border-radius: var(--radius);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: default;
  letter-spacing: 0.03em;
}
.form-block--w { background: var(--win); }
.form-block--d { background: var(--draw); color: #0d1117; }
.form-block--l { background: var(--lose); }
</style>
