<template>
  <div class="lb-page">

    <div class="page-header">
      <h1>{{ $t('leaderboard.title') }}</h1>
      <p class="page-sub">{{ $t('leaderboard.sub') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ $t('leaderboard.loading') }}</div>

    <div v-else-if="!rows.length" class="empty-state">
      <div class="empty-icon">🏆</div>
      <h2 class="empty-title">{{ $t('leaderboard.noResults') }}</h2>
      <p class="empty-sub">{{ $t('leaderboard.noResultsSub') }}</p>

      <div class="how-it-works">
        <p class="how-label">{{ $t('leaderboard.howTitle') }}</p>
        <div class="how-rows">
          <div class="how-row">
            <span class="how-icon exact">🎯</span>
            <div>
              <strong>{{ $t('leaderboard.exact') }}</strong>
              <span class="how-pts">{{ $t('leaderboard.exactPts') }}</span>
            </div>
            <p class="how-desc">{{ $t('leaderboard.exactDesc') }}</p>
          </div>
          <div class="how-row">
            <span class="how-icon correct">✓</span>
            <div>
              <strong>{{ $t('leaderboard.correct') }}</strong>
              <span class="how-pts">{{ $t('leaderboard.correctPts') }}</span>
            </div>
            <p class="how-desc">{{ $t('leaderboard.correctDesc') }}</p>
          </div>
          <div class="how-row">
            <span class="how-icon wrong">✗</span>
            <div>
              <strong>{{ $t('leaderboard.wrong') }}</strong>
              <span class="how-pts">{{ $t('leaderboard.wrongPts') }}</span>
            </div>
            <p class="how-desc">{{ $t('leaderboard.wrongDesc') }}</p>
          </div>
        </div>
      </div>

      <router-link to="/dashboard" class="cta-btn">{{ $t('leaderboard.makePredictions') }}</router-link>
    </div>

    <div v-else class="lb-card">
      <table class="lb-table">
        <thead>
          <tr>
            <th class="col-rank">#</th>
            <th>{{ $t('leaderboard.player') }}</th>
            <th class="col-num col-hide-mobile" title="Total predictions with known results">{{ $t('leaderboard.played') }}</th>
            <th class="col-num col-hide-mobile" title="Exact score">🎯 {{ $t('leaderboardCols.exact') }}</th>
            <th class="col-num col-hide-mobile" title="Correct result">✓ {{ $t('leaderboardCols.correct') }}</th>
            <th class="col-num col-hide-mobile" title="Wrong">✗ {{ $t('leaderboardCols.wrong') }}</th>
            <th class="col-pts">{{ $t('leaderboard.pts') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="row.Username"
            :class="{ 'row-top': i < 3, 'row-self': row.Username === currentUsername }"
          >
            <td class="col-rank">
              <span class="rank-badge" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
            </td>
            <td>
              <div class="col-user">
                <span class="lb-username">{{ row.Username }}</span>
                <span v-if="row.Username === currentUsername" class="you-badge">{{ $t('leaderboard.you') }}</span>
              </div>
            </td>
            <td class="col-num col-hide-mobile">{{ row.total }}</td>
            <td class="col-num col-exact col-hide-mobile">{{ row.exact_count }}</td>
            <td class="col-num col-correct col-hide-mobile">{{ row.correct_count }}</td>
            <td class="col-num col-wrong col-hide-mobile">{{ row.wrong_count }}</td>
            <td class="col-pts">
              <span class="pts-val">{{ row.points }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'

const store = useStore()
const currentUsername = computed(() => store.state.user?.username)

const rows = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/predictions/leaderboard')
    rows.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.lb-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}
.page-sub {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.9rem;
  margin-top: 2rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
}
.empty-icon { font-size: 2.5rem; }
.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.empty-sub {
  color: var(--text-muted);
  font-size: 0.875rem;
  max-width: 340px;
  line-height: 1.5;
  margin: 0;
}

.how-it-works {
  margin-top: 1.25rem;
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  text-align: left;
}
.how-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 1rem;
}
.how-rows { display: flex; flex-direction: column; gap: 0.75rem; }
.how-row {
  display: grid;
  grid-template-columns: 2rem 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.75rem;
  align-items: start;
}
.how-icon {
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 800;
  border: 1px solid;
}
.how-icon.exact   { background: rgba(16,185,129,0.12); color: var(--win);        border-color: rgba(16,185,129,0.3); }
.how-icon.correct { background: rgba(245,158,11,0.12);  color: var(--accent-hover); border-color: rgba(245,158,11,0.3); }
.how-icon.wrong   { background: rgba(239,68,68,0.12);  color: var(--lose);       border-color: rgba(239,68,68,0.3); }
.how-row > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.how-row strong { font-size: 0.875rem; color: var(--text-primary); }
.how-pts {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-hover);
  background: var(--accent-muted);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 999px;
  padding: 1px 8px;
}
.how-desc { font-size: 0.78rem; color: var(--text-muted); margin: 0; grid-column: 2; }

.cta-btn {
  margin-top: 1rem;
  display: inline-block;
  padding: 0.6rem 1.4rem;
  background: var(--accent);
  color: #0f1419;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}
.cta-btn:hover { background: var(--accent-hover); }

.lb-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.lb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.lb-table thead tr {
  background: var(--bg-surface-2);
  border-bottom: 1px solid var(--border);
}

.lb-table th {
  padding: 0.65rem 1rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.lb-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.lb-table tbody tr:last-child td { border-bottom: none; }
.lb-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
.row-self td { background: rgba(245,158,11,0.04); }

.col-rank { width: 48px; }
.col-num  { text-align: center; color: var(--text-secondary); }
.col-pts  { text-align: center; }
.col-user { display: flex; align-items: center; gap: 0.5rem; }

.col-exact   { color: var(--win) !important; font-weight: 700; }
.col-correct { color: var(--accent-hover) !important; font-weight: 600; }
.col-wrong   { color: var(--lose) !important; }

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--bg-surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.rank-1 { background: rgba(234,179,8,0.15);  color: #facc15; border-color: rgba(234,179,8,0.4); }
.rank-2 { background: rgba(148,163,184,0.15); color: #94a3b8; border-color: rgba(148,163,184,0.4); }
.rank-3 { background: rgba(180,83,9,0.15);   color: #f97316; border-color: rgba(180,83,9,0.4); }

.lb-username {
  font-weight: 600;
  color: var(--text-primary);
}

.you-badge {
  font-size: 0.62rem;
  font-weight: 700;
  background: var(--accent-muted);
  color: var(--accent-hover);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 1px 6px;
}

.pts-val {
  font-size: 1rem;
  font-weight: 800;
  color: var(--accent-hover);
}

@media (max-width: 560px) {
  .col-hide-mobile { display: none; }
}
</style>
