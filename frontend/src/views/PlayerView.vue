<template>
  <div class="view-container">

    <button class="back-btn" @click="$router.back()">{{ $t('common.back') }}</button>

    <div v-if="loading" class="loading">{{ $t('player.loading') }}</div>
    <div v-else-if="error" class="empty-state">{{ error }}</div>

    <template v-else-if="player">

      <!-- ── Header ────────────────────────────────────────────────────────── -->
      <div class="player-header">
        <div class="player-avatar" :class="`avatar--${posClass(player.Position)}`">
          {{ initials }}
        </div>

        <div class="player-meta">
          <div class="player-name-row">
            <h1 class="player-name">{{ player.FullName }}</h1>
            <span class="pos-badge" :class="`pos--${posClass(player.Position)}`">
              {{ posAbbr(player.DetailedPosition) || player.Position }}
            </span>
          </div>

          <div class="player-chips">
            <span v-if="player.Nationality" class="chip">
              {{ nationalityFlag(player.Nationality) }} {{ player.Nationality }}
            </span>
            <span v-if="player.Age" class="chip">{{ player.Age }} {{ $t('player.yrs') }}</span>
          </div>

          <RouterLink :to="`/teams/${player.Team_ID}`" class="team-link">
            <img v-if="player.Team_Crest" :src="player.Team_Crest" class="team-crest" :alt="player.Team_Name" />
            <span>{{ player.Team_Name }}</span>
            <span class="team-link-arrow">→</span>
          </RouterLink>
        </div>
      </div>

      <!-- ── Stats ─────────────────────────────────────────────────────────── -->
      <div class="stats-section">
        <h2 class="section-title">{{ $t('player.seasonStats') }}</h2>

        <!-- Goalkeeper -->
        <div v-if="player.Position === 'Goalkeeper'" class="stats-grid">
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.cleanSheets }}</span>
            <span class="stat-lbl">{{ $t('player.cleanSheets') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.conceded }}</span>
            <span class="stat-lbl">{{ $t('player.conceded') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.played }}</span>
            <span class="stat-lbl">{{ $t('player.teamGames') }}</span>
          </div>
        </div>

        <!-- Outfield -->
        <div v-else class="stats-grid">
          <div class="stat-card stat-card--accent">
            <span class="stat-val">{{ player.stats.goals }}</span>
            <span class="stat-lbl">{{ $t('player.goals') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.assists }}</span>
            <span class="stat-lbl">{{ $t('player.assists') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.penalties }}</span>
            <span class="stat-lbl">{{ $t('player.penalties') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ player.stats.playedMatches }}</span>
            <span class="stat-lbl">{{ $t('player.appearances') }}</span>
          </div>
        </div>
      </div>

      <!-- ── Team Form ──────────────────────────────────────────────────────── -->
      <div v-if="player.recentMatches?.length" class="form-section">
        <h2 class="section-title">{{ player.Team_Name }} — Last 5</h2>
        <div class="form-matches">
          <div
            v-for="m in player.recentMatches"
            :key="m.Match_ID"
            class="form-match"
            :title="`${m.HomeTeam} ${m.Score} ${m.AwayTeam}`"
          >
            <div class="form-match-teams">
              <img v-if="m.HomeCrest" :src="m.HomeCrest" class="form-crest" />
              <span class="form-score">{{ m.Score }}</span>
              <img v-if="m.AwayCrest" :src="m.AwayCrest" class="form-crest" />
            </div>
            <span
              class="form-dot"
              :class="formResult(m)"
              :title="formResult(m) === 'dot-w' ? 'Win' : formResult(m) === 'dot-d' ? 'Draw' : 'Loss'"
            ></span>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../services/api'
import { nationalityFlag, posClass, posAbbr } from '../utils/football'

const route  = useRoute()
const { t } = useI18n()
const player  = ref(null)
const loading = ref(true)
const error   = ref(null)

onMounted(async () => {
  try {
    const res = await api.get(`/players/${route.params.id}/profile`, {
      params: {
        teamId: route.query.teamId,
        code:   route.query.code || 'PL',
      }
    })
    player.value = res.data
  } catch (e) {
    error.value = e.response?.data?.error || t('player.loadError')
  } finally {
    loading.value = false
  }
})

const initials = computed(() => {
  if (!player.value) return '?'
  const { Name, Surname } = player.value
  return `${Name?.charAt(0) ?? ''}${Surname?.charAt(0) ?? ''}`.toUpperCase()
})

function formResult(m) {
  if (!m.Score) return ''
  const [h, a] = m.Score.split('-').map(Number)
  const isHome = m.HomeTeamID === player.value?.Team_ID
  if (h === a) return 'dot-d'
  const won = isHome ? h > a : a > h
  return won ? 'dot-w' : 'dot-l'
}
</script>

<style scoped>
.view-container {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.5rem;
  transition: color 0.15s;
  display: block;
}
.back-btn:hover { color: var(--text-primary); }

.loading, .empty-state {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4rem;
  font-size: 0.9rem;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.player-header {
  display: flex;
  align-items: flex-start;
  gap: 1.75rem;
  margin-bottom: 2.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
}

.player-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 900;
  flex-shrink: 0;
  color: #fff;
  letter-spacing: -1px;
}

.avatar--gk  { background: linear-gradient(135deg, var(--pos-gk),  var(--pos-gk-muted)); }
.avatar--def { background: linear-gradient(135deg, var(--pos-def), var(--pos-def-muted)); }
.avatar--mid { background: linear-gradient(135deg, var(--pos-mid), var(--pos-mid-muted)); }
.avatar--fwd { background: linear-gradient(135deg, var(--pos-fwd), var(--pos-fwd-muted)); }

.player-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.player-name {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.pos-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  flex-shrink: 0;
}
.pos--gk  { background: var(--pos-gk-muted);  color: var(--pos-gk); }
.pos--def { background: var(--pos-def-muted); color: var(--pos-def); }
.pos--mid { background: var(--pos-mid-muted); color: var(--pos-mid); }
.pos--fwd { background: var(--pos-fwd-muted); color: var(--pos-fwd); }

.player-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.team-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--accent-green-hover);
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
  transition: opacity 0.15s;
}
.team-link:hover { opacity: 0.8; }

.team-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.team-link-arrow { font-size: 0.8rem; }

/* ─── Stats ──────────────────────────────────────────────────────────────── */
.stats-section { margin-bottom: 2rem; }

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.stat-card--accent { border-color: rgba(16,185,129,0.3); }

.stat-val {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -1px;
}

.stat-card--accent .stat-val { color: var(--accent-green); }

.stat-lbl {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ─── Form ───────────────────────────────────────────────────────────────── */
.form-section { margin-bottom: 2rem; }

.form-matches {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.form-match {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 90px;
}

.form-match-teams {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.form-crest {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.form-score {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.form-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-w { background: var(--win); }
.dot-d { background: var(--draw); }
.dot-l { background: var(--lose); }

@media (max-width: 500px) {
  .player-header { flex-direction: column; align-items: center; text-align: center; }
  .player-name-row { justify-content: center; }
  .player-chips { justify-content: center; }
  .team-link { align-self: center; }
}
</style>
