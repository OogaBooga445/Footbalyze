<template>
  <div class="home">

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <span class="eyebrow">{{ $t('home.eyebrow') }}</span>

          <h1 class="hero-title">
            {{ $t('home.heroTitle') }}<br />
            <span class="hero-accent">{{ $t('home.heroAccent') }}</span>
          </h1>

          <p class="hero-subtitle">{{ $t('home.subtitle') }}</p>

          <ul class="hero-bullets">
            <li>{{ $t('home.bullet1') }}</li>
            <li>{{ $t('home.bullet2') }}</li>
            <li>{{ $t('home.bullet3') }}</li>
          </ul>

          <div class="hero-ctas">
            <RouterLink to="/leagues" class="btn-amber">{{ $t('home.exploreLeagues') }}</RouterLink>
            <RouterLink v-if="!user" to="/register" class="btn-outline">{{ $t('home.createAccount') }} &rarr;</RouterLink>
            <RouterLink v-else to="/dashboard" class="btn-outline">{{ $t('home.myDashboard') }} &rarr;</RouterLink>
          </div>
        </div>

        <!-- Right: top scorer card -->
        <div class="scorer-wrap">
          <div class="scorer-card" v-if="topScorer">
            <div class="scorer-card__head">
              <span class="scorer-card__league">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</span>
              <span class="scorer-card__badge">{{ $t('home.topScorer') }}</span>
            </div>

            <div class="scorer-player">
              <img
                v-if="topScorer.team?.crest"
                :src="topScorer.team.crest"
                :alt="topScorer.team.name"
                class="scorer-crest"
              />
              <div class="scorer-info">
                <span class="scorer-name">{{ topScorer.player?.name }}</span>
                <span class="scorer-team">{{ topScorer.team?.name }}</span>
              </div>
            </div>

            <div class="scorer-stats">
              <div class="scorer-stat">
                <span class="sval sval--big">{{ topScorer.goals ?? 0 }}</span>
                <span class="slbl">{{ $t('home.goals') }}</span>
              </div>
              <div class="sdivider"></div>
              <div class="scorer-stat">
                <span class="sval">{{ topScorer.assists ?? 0 }}</span>
                <span class="slbl">{{ $t('home.assists') }}</span>
              </div>
              <div class="sdivider"></div>
              <div class="scorer-stat">
                <span class="sval">{{ topScorer.playedMatches ?? 0 }}</span>
                <span class="slbl">{{ $t('home.apps') }}</span>
              </div>
            </div>

            <RouterLink to="/leagues?code=PL" class="scorer-link">{{ $t('home.viewStandings') }} &rarr;</RouterLink>
          </div>

          <div class="scorer-card scorer-skeleton" v-else>
            <div class="skel skel--sm"></div>
            <div class="skel skel--lg"></div>
            <div class="skel skel--md"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Competitions marquee ────────────────────────────────────────────── -->
    <div class="comps-strip fade-section" v-fade-in>
      <div class="comps-track">
        <RouterLink
          v-for="(comp, i) in [...competitions, ...competitions]"
          :key="`${comp.code}-${i}`"
          :to="`/leagues?code=${comp.code}`"
          class="comp-chip"
        >
          <span class="comp-chip__flag">{{ comp.flag || '🏆' }}</span>
          <span class="comp-chip__name">{{ comp.name }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- ── Feature panels ────────────────────────────────────────────────── -->
    <section class="panels-section">
      <div class="panels-header fade-section" v-fade-in>
        <h2 class="panels-title">{{ $t('home.panelsTitle') }}</h2>
        <p class="panels-sub">{{ $t('home.panelsSub') }}</p>
      </div>

      <div class="panels-grid fade-section" v-fade-in>

        <!-- Leagues -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-label">{{ $t('home.panelLeagues') }}</span>
            <RouterLink to="/leagues" class="panel-link">{{ $t('home.viewAll') }}</RouterLink>
          </div>
          <div class="panel-body">
            <div class="real-list">
              <div class="real-list-head">
                <span></span><span>{{ $t('home.colLeague') }}</span><span>{{ $t('home.colCountry') }}</span><span></span>
              </div>
              <RouterLink
                v-for="comp in competitions.slice(0, 7)"
                :key="comp.code"
                :to="`/leagues?code=${comp.code}`"
                class="real-list-row"
              >
                <span class="real-list-flag">{{ comp.flag || '🏆' }}</span>
                <span class="real-list-name">{{ comp.name }}</span>
                <span class="real-list-country">{{ comp.country }}</span>
                <span class="real-list-arrow">&rarr;</span>
              </RouterLink>
              <div v-if="!competitions.length" class="real-loading">
                <div class="skel skel--sm" style="width:100%;height:28px;margin-bottom:5px" v-for="n in 7" :key="n"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Scorers -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-label">{{ $t('home.panelTopScorers') }}</span>
            <RouterLink to="/players" class="panel-link">{{ $t('home.allPlayers') }}</RouterLink>
          </div>
          <div class="panel-body">
            <div class="real-scorers">
              <div class="real-scorers-head">
                <span></span><span></span><span>{{ $t('home.colPlayer') }}</span><span>{{ $t('home.colClub') }}</span><span>G</span><span>A</span>
              </div>
              <RouterLink
                v-for="(s, i) in topScorers"
                :key="s.player?.id ?? i"
                :to="`/players/${s.player.id}?teamId=${s.team.id}&code=PL`"
                class="real-scorer-row"
              >
                <span class="real-scorer-rank">{{ i + 1 }}</span>
                <img v-if="s.team?.crest" :src="s.team.crest" :alt="s.team.name" class="real-scorer-crest" />
                <span class="real-scorer-name">{{ s.player?.name }}</span>
                <span class="real-scorer-club">{{ s.team?.shortName ?? s.team?.name }}</span>
                <span class="real-scorer-goals">{{ s.goals ?? 0 }}</span>
                <span class="real-scorer-assists">{{ s.assists ?? 0 }}</span>
              </RouterLink>
              <div v-if="!topScorers.length" class="real-loading">
                <div class="skel skel--sm" style="width:100%;height:28px;margin-bottom:5px" v-for="n in 5" :key="n"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Standings -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-label">{{ $t('home.panelStandings') }}</span>
            <RouterLink to="/table" class="panel-link">{{ $t('home.fullTable') }}</RouterLink>
          </div>
          <div class="panel-body">
            <div class="real-table" v-if="plStandings.length">
              <div class="real-table-head">
                <span>#</span><span></span><span>{{ $t('home.colClub') }}</span><span>P</span><span>W</span><span>D</span><span>L</span><span class="rt-pts-head">Pts</span>
              </div>
              <RouterLink
                v-for="(row, i) in plStandings.slice(0, 7)"
                :key="row.team.id"
                :to="`/teams/${row.team.id}`"
                class="real-table-row"
                :class="{ 'real-table-row--cl': i < 4, 'real-table-row--el': i === 4 || i === 5 }"
              >
                <span class="rt-pos">{{ row.position }}</span>
                <img v-if="row.team.crest" :src="row.team.crest" :alt="row.team.name" class="rt-crest" />
                <span class="rt-name">{{ row.team.shortName ?? row.team.name }}</span>
                <span class="rt-num">{{ row.playedGames }}</span>
                <span class="rt-num">{{ row.won }}</span>
                <span class="rt-num">{{ row.draw }}</span>
                <span class="rt-num">{{ row.lost }}</span>
                <span class="rt-pts">{{ row.points }}</span>
              </RouterLink>
            </div>
            <div class="real-loading" v-else>
              <div class="skel skel--sm" style="width:100%;height:28px;margin-bottom:5px" v-for="n in 7" :key="n"></div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── CTA (guests only) ──────────────────────────────────────────────── -->
    <section v-if="!user" class="cta-section fade-section" v-fade-in>
      <div class="cta-inner">
        <h2 class="cta-title">{{ $t('home.ctaTitle') }}</h2>
        <p class="cta-sub">{{ $t('home.ctaSub') }}</p>
        <div class="cta-btns">
          <RouterLink to="/register" class="btn-dark">{{ $t('home.ctaStart') }}</RouterLink>
          <RouterLink to="/leagues" class="btn-dark-outline">{{ $t('home.ctaGuest') }} &rarr;</RouterLink>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import api from '../services/api'

useI18n()
const store = useStore()
const user = computed(() => store.state.user)

const competitions = ref([])
const topScorer    = ref(null)
const topScorers   = ref([])
const plStandings  = ref([])

// ── Scroll fade-in directive ──────────────────────────────────────────────── //
const vFadeIn = {
  mounted(el) {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          io.unobserve(el)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
  },
}

// ── API ───────────────────────────────────────────────────────────────────── //
onMounted(async () => {
  try {
    const leaguesRes = await api.get('/leagues')
    competitions.value = leaguesRes.data
  } catch (e) {
    console.error('Failed to load home data', e)
  }

  try {
    const [scorersRes, standingsRes] = await Promise.all([
      api.get('/leagues/PL/scorers'),
      api.get('/leagues/PL/standings'),
    ])
    const scorers = scorersRes.data?.scorers ?? []
    topScorer.value   = scorers[0] ?? null
    topScorers.value  = scorers.slice(0, 5)
    plStandings.value = standingsRes.data?.standings?.[0]?.table ?? []
  } catch (e) {
    console.error('Failed to load scorers/standings', e)
  }
})
</script>

<style scoped>
/* ─── Palette ────────────────────────────────────────────────────────────── */
/* bg:      #0f1419  surface: #141c27  border: amber/15%                     */
/* accent:  #f59e0b  hover:   #d97706                                        */

.home { width: 100%; background: #0f1419; }

/* ─── Scroll fade-in ─────────────────────────────────────────────────────── */
.fade-section {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.fade-section.visible {
  opacity: 1;
  transform: translateY(0);
}


/* ─── Hero ───────────────────────────────────────────────────────────────── */
.hero {
  padding: 5rem 1.5rem 4rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
}

.hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 4rem;
  align-items: center;
}

@media (max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr; gap: 2.5rem; }
  .hero { padding: 3.5rem 1.25rem 3rem; }
}

.hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f59e0b;
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: clamp(2.6rem, 5vw, 4.2rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -1.5px;
  color: #f1f5f9;
  margin-bottom: 1.25rem;
}

.hero-accent {
  display: inline-block;
  color: #f59e0b;
}

.hero-subtitle {
  font-size: 1rem;
  line-height: 1.7;
  color: #94a3b8;
  max-width: 460px;
  margin-bottom: 1.5rem;
}

.hero-bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.hero-bullets li {
  font-size: 0.875rem;
  color: #64748b;
  padding-left: 1.1rem;
  position: relative;
}

.hero-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
}

.hero-ctas {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-amber {
  background: #f59e0b;
  color: #0f1419;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}
.btn-amber:hover { background: #d97706; }

.btn-outline {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline:hover { border-color: #f59e0b; color: #f59e0b; }


/* ─── Scorer card ────────────────────────────────────────────────────────── */
.scorer-wrap { display: flex; align-items: stretch; }

.scorer-card {
  width: 100%;
  background: #141c27;
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-left: 3px solid #f59e0b;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.scorer-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scorer-card__league {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.scorer-card__badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
}

.scorer-player {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.scorer-crest {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.scorer-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.scorer-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scorer-team {
  font-size: 0.78rem;
  color: #64748b;
}

.scorer-stats {
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.scorer-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.85rem 0.5rem;
}

.sval {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1;
  letter-spacing: -0.5px;
}

.sval--big {
  font-size: 1.85rem;
  color: #f59e0b;
}

.slbl {
  font-size: 0.63rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sdivider {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.scorer-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: #f59e0b;
  text-decoration: none;
  text-align: right;
}
.scorer-link:hover { text-decoration: underline; }

/* Skeleton */
.scorer-skeleton { gap: 1rem; }
.skel {
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  animation: shimmer 1.6s ease-in-out infinite;
}
.skel--sm { height: 12px; width: 55%; }
.skel--lg { height: 48px; }
.skel--md { height: 72px; }
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}


/* ─── Competitions marquee ───────────────────────────────────────────────── */
.comps-strip {
  border-top: 1px solid rgba(245, 158, 11, 0.12);
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
  background: #141c27;
  padding: 1.25rem 0;
  overflow: hidden;
}

.comps-track {
  display: flex;
  gap: 0.75rem;
  width: max-content;
  animation: marquee 32s linear infinite;
  padding: 0 0.375rem;
}

.comps-track:hover { animation-play-state: paused; }

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.comp-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #0f1419;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 10px;
  padding: 0.6rem 1.1rem;
  white-space: nowrap;
  text-decoration: none;
  transition: border-color 0.15s;
  flex-shrink: 0;
}
.comp-chip:hover { border-color: rgba(245, 158, 11, 0.45); }

.comp-chip__flag { font-size: 1.3rem; line-height: 1; }
.comp-chip__name { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; }

/* ─── Feature panels ─────────────────────────────────────────────────────── */
.panels-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
}

.panels-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.panels-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.5px;
  margin-bottom: 0.5rem;
}

.panels-sub {
  font-size: 0.925rem;
  color: #64748b;
}

.panels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 900px) {
  .panels-grid { grid-template-columns: 1fr; }
}

.panel {
  background: #141c27;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
}

.panel-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.panel-link {
  font-size: 0.75rem;
  font-weight: 600;
  color: #f59e0b;
  text-decoration: none;
  transition: opacity 0.15s;
}
.panel-link:hover { opacity: 0.75; }

.panel-body {
  flex: 1;
}


/* ─── CTA section ────────────────────────────────────────────────────────── */
.cta-section {
  background: #141c27;
  border-top: 1px solid rgba(245, 158, 11, 0.15);
  padding: 6rem 1.5rem;
  text-align: center;
}

.cta-inner { max-width: 540px; margin: 0 auto; }

.cta-title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.5px;
  margin-bottom: 0.75rem;
  line-height: 1.15;
}

.cta-sub {
  font-size: 1rem;
  color: #94a3b8;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.cta-btns {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-dark {
  background: #f59e0b;
  color: #0f1419;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}
.btn-dark:hover { background: #d97706; }

.btn-dark-outline {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 0.8rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: border-color 0.2s, color 0.2s;
}
.btn-dark-outline:hover { border-color: #f59e0b; color: #f59e0b; }

/* ─── Real data panels ───────────────────────────────────────────────────── */

/* Shared panel inner */
.real-list, .real-scorers, .real-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  font-size: 0.78rem;
}

/* Leagues panel */
.real-list-head {
  display: grid;
  grid-template-columns: 28px 1fr auto 20px;
  gap: 0.5rem;
  padding: 0 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  color: #64748b;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.real-list-row {
  display: grid;
  grid-template-columns: 28px 1fr auto 20px;
  gap: 0.5rem;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  text-decoration: none;
  transition: background 0.12s;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
}
.real-list-row:last-child { border-bottom: none; }
.real-list-row:hover { background: rgba(245, 158, 11, 0.08); }
.real-list-row:hover .real-list-name { color: #f59e0b; }
.real-list-row:hover .real-list-arrow { color: #f59e0b; transform: translateX(3px); }

.real-list-flag { font-size: 1.2rem; line-height: 1; }
.real-list-name { font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.real-list-country { font-size: 0.7rem; color: #64748b; white-space: nowrap; }
.real-list-arrow { color: #64748b; font-size: 0.75rem; transition: color 0.12s, transform 0.12s; }

/* Scorers panel */
.real-scorers-head {
  display: grid;
  grid-template-columns: 18px 20px 1fr 60px 28px 28px;
  gap: 0.4rem;
  padding: 0 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  color: #64748b;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.real-scorer-row {
  display: grid;
  grid-template-columns: 18px 20px 1fr 60px 28px 28px;
  gap: 0.4rem;
  padding: 0.55rem 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  text-decoration: none;
  color: #94a3b8;
  transition: background 0.12s;
  border-radius: 6px;
  cursor: pointer;
}
.real-scorer-row:last-child { border-bottom: none; }
.real-scorer-row:hover { background: rgba(245, 158, 11, 0.08); }
.real-scorer-row:hover .real-scorer-name { color: #f59e0b; }

.real-scorer-rank { color: #64748b; font-weight: 600; font-size: 0.7rem; text-align: center; }
.real-scorer-crest { width: 18px; height: 18px; object-fit: contain; }
.real-scorer-name { font-weight: 600; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.real-scorer-club { font-size: 0.68rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.real-scorer-goals { font-weight: 800; color: #f59e0b; text-align: center; }
.real-scorer-assists { font-weight: 600; color: #94a3b8; text-align: center; }

/* Standings panel */
.real-table-head {
  display: grid;
  grid-template-columns: 18px 20px 1fr 22px 22px 22px 22px 30px;
  gap: 0.35rem;
  padding: 0 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  color: #64748b;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.rt-pts-head { text-align: center; color: #f59e0b; }

.real-table-row {
  display: grid;
  grid-template-columns: 18px 20px 1fr 22px 22px 22px 22px 30px;
  gap: 0.35rem;
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  text-decoration: none;
  color: #94a3b8;
  transition: background 0.12s;
  border-radius: 6px;
  cursor: pointer;
}
.real-table-row:last-child { border-bottom: none; }
.real-table-row:hover { background: rgba(245, 158, 11, 0.08); }
.real-table-row:hover .rt-name { color: #f59e0b; }

.real-table-row--cl .rt-pos { color: #3b82f6; }
.real-table-row--el .rt-pos { color: #f59e0b; }

.rt-pos  { font-weight: 700; font-size: 0.7rem; text-align: center; }
.rt-crest { width: 18px; height: 18px; object-fit: contain; }
.rt-name { font-weight: 600; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rt-num  { text-align: center; font-size: 0.72rem; }
.rt-pts  { font-weight: 800; color: #f59e0b; text-align: center; }

.real-loading { padding: 0.75rem 0; display: flex; flex-direction: column; gap: 0.4rem; }

/* ─── Mobile ─────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .hero-title { font-size: 2.5rem; }
  .hero-ctas { flex-direction: column; }
  .btn-amber, .btn-outline { width: 100%; text-align: center; }
  .scorer-card { padding: 1.25rem; }
  .scorer-crest { width: 38px; height: 38px; }
  .scorer-name { font-size: 1rem; }
  .sval--big { font-size: 1.5rem; }
  .sval { font-size: 1.1rem; }
  .section { padding: 3rem 1.25rem; }
  .cta-btns { flex-direction: column; align-items: stretch; }
  .btn-dark, .btn-dark-outline { width: 100%; text-align: center; }
}
</style>
