<template>
  <div class="home">

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-glow hero-glow--green"></div>
      <div class="hero-glow hero-glow--blue"></div>

      <div class="hero-inner">
        <!-- Left: text -->
        <div class="hero-text">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            Live Data · Multiple Leagues
          </div>

          <h1 class="hero-title">
            Football Analytics<br />
            <span class="hero-gradient">For Every Fan</span>
          </h1>

          <p class="hero-subtitle">
            Standings, stats, scorers, and match results across Europe's top competitions —
            all in one clean, fast platform.
          </p>

          <div class="hero-ctas">
            <RouterLink to="/leagues" class="btn-primary">Explore Leagues</RouterLink>
            <RouterLink v-if="!user" to="/register" class="btn-ghost">Create Free Account &rarr;</RouterLink>
            <RouterLink v-else to="/dashboard" class="btn-ghost">My Dashboard &rarr;</RouterLink>
          </div>

          <div class="hero-chips">
            <span class="chip">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</span>
            <span class="chip">🇩🇪 Bundesliga</span>
            <span class="chip">🇪🇸 La Liga</span>
            <span class="chip">🇮🇹 Serie A</span>
            <span class="chip">🇫🇷 Ligue 1</span>
            <span class="chip chip--more">+ more</span>
          </div>
        </div>

        <!-- Right: spotlight card -->
        <div class="hero-spotlight">
          <div class="spotlight-card" v-if="topScorer">
            <div class="spotlight-label">
              <span class="spotlight-dot"></span>
              🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League · Top Scorer
            </div>

            <div class="spotlight-player">
              <img
                v-if="topScorer.team?.crest"
                :src="topScorer.team.crest"
                :alt="topScorer.team.name"
                class="spotlight-crest"
              />
              <div class="spotlight-info">
                <span class="spotlight-name">{{ topScorer.player?.name }}</span>
                <span class="spotlight-team">{{ topScorer.team?.name }}</span>
              </div>
            </div>

            <div class="spotlight-stats">
              <div class="spotlight-stat spotlight-stat--big">
                <span class="s-val">{{ topScorer.goals ?? 0 }}</span>
                <span class="s-lbl">Goals</span>
              </div>
              <div class="spotlight-divider"></div>
              <div class="spotlight-stat">
                <span class="s-val">{{ topScorer.assists ?? 0 }}</span>
                <span class="s-lbl">Assists</span>
              </div>
              <div class="spotlight-divider"></div>
              <div class="spotlight-stat">
                <span class="s-val">{{ topScorer.playedMatches ?? 0 }}</span>
                <span class="s-lbl">Apps</span>
              </div>
            </div>

            <RouterLink to="/leagues?code=PL" class="spotlight-link">View full standings &rarr;</RouterLink>
          </div>

          <!-- Skeleton while loading -->
          <div class="spotlight-card spotlight-skeleton" v-else>
            <div class="skel skel--sm"></div>
            <div class="skel skel--lg"></div>
            <div class="skel skel--md"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Numbers strip ──────────────────────────────────────────────────── -->
    <div class="numbers-strip">
      <div class="numbers-inner">
        <div class="number-item">
          <span class="number-val">{{ competitions.length || '10' }}</span>
          <span class="number-lbl">Competitions</span>
        </div>
        <div class="number-divider"></div>
        <div class="number-item">
          <span class="number-val">{{ stats.teams ?? '200' }}+</span>
          <span class="number-lbl">Clubs</span>
        </div>
        <div class="number-divider"></div>
        <div class="number-item">
          <span class="number-val">{{ stats.players ?? '5k' }}+</span>
          <span class="number-lbl">Players</span>
        </div>
        <div class="number-divider"></div>
        <div class="number-item">
          <span class="number-val">{{ stats.matches ?? '500' }}+</span>
          <span class="number-lbl">Matches logged</span>
        </div>
      </div>
    </div>

    <!-- ── Feature highlights ─────────────────────────────────────────────── -->
    <section class="section">
      <div class="section-header centered">
        <h2 class="section-title">Everything you need to follow the game</h2>
        <p class="section-desc">One platform. Every stat that matters.</p>
      </div>

      <div class="features-grid">
        <RouterLink to="/leagues" class="feature-card feature-card--accent">
          <div class="feature-icon">🌍</div>
          <h3>Multi-League Coverage</h3>
          <p>PL, Bundesliga, La Liga, Serie A, Ligue 1, Champions League and more — all under one roof.</p>
          <span class="feature-link">Browse leagues &rarr;</span>
        </RouterLink>

        <RouterLink to="/teams" class="feature-card">
          <div class="feature-icon">⚽</div>
          <h3>Clubs & Squads</h3>
          <p>Every club's full roster, coach info, and nationality breakdown — filterable by competition.</p>
          <span class="feature-link">Explore teams &rarr;</span>
        </RouterLink>

        <RouterLink to="/players" class="feature-card">
          <div class="feature-icon">👤</div>
          <h3>Player Profiles</h3>
          <p>Search players by position, age, and club. View career stats and current season performance.</p>
          <span class="feature-link">Find players &rarr;</span>
        </RouterLink>

        <RouterLink to="/matches" class="feature-card">
          <div class="feature-icon">📅</div>
          <h3>Match Results</h3>
          <p>Browse and filter every match result. Filter by team, date, or outcome in seconds.</p>
          <span class="feature-link">View matches &rarr;</span>
        </RouterLink>

        <RouterLink to="/table" class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Live Standings</h3>
          <p>Up-to-date league tables with points, goal difference, form, and promotion/relegation zones.</p>
          <span class="feature-link">See table &rarr;</span>
        </RouterLink>

        <RouterLink to="/dashboard" class="feature-card">
          <div class="feature-icon">⭐</div>
          <h3>Your Dashboard</h3>
          <p>Save favourite teams and players. Get a personalised view every time you log in.</p>
          <span class="feature-link">Go to dashboard &rarr;</span>
        </RouterLink>
      </div>
    </section>

    <!-- ── Competitions ───────────────────────────────────────────────────── -->
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Competitions we cover</h2>
          <p class="section-desc">Click any league to jump straight into its stats</p>
        </div>
        <RouterLink to="/leagues" class="section-link">All leagues &rarr;</RouterLink>
      </div>

      <div class="competitions-grid">
        <RouterLink
          v-for="comp in competitions"
          :key="comp.code"
          :to="`/leagues?code=${comp.code}`"
          class="comp-card"
        >
          <span class="comp-flag">{{ comp.flag || '🏆' }}</span>
          <div class="comp-info">
            <span class="comp-name">{{ comp.name }}</span>
            <span class="comp-country">{{ comp.country }}</span>
          </div>
          <span class="comp-arrow">&rarr;</span>
        </RouterLink>
      </div>
    </section>

    <!-- ── Bottom CTA (guests only) ─────────────────────────────────────── -->
    <section v-if="!user" class="cta-section">
      <div class="cta-glow"></div>
      <div class="cta-content">
        <h2 class="cta-title">Ready to dive in?</h2>
        <p class="cta-sub">Create a free account to save favourites and personalise your experience.</p>
        <div class="cta-btns">
          <RouterLink to="/register" class="btn-primary">Get Started — It's Free</RouterLink>
          <RouterLink to="/leagues" class="btn-ghost">Browse as Guest &rarr;</RouterLink>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStore } from 'vuex'
import api from '../services/api'

const store = useStore()
const user = computed(() => store.state.user)

const stats        = ref({})
const competitions = ref([])
const topScorer    = ref(null)

onMounted(async () => {
  try {
    const [statsRes, leaguesRes] = await Promise.all([
      api.get('/stats'),
      api.get('/leagues'),
    ])
    stats.value        = statsRes.data
    competitions.value = leaguesRes.data
  } catch (e) {
    console.error('Failed to load home data', e)
  }

  try {
    const scorersRes = await api.get('/leagues/PL/scorers')
    topScorer.value = scorersRes.data?.scorers?.[0] ?? null
  } catch (e) {
    console.error('Failed to load scorers', e)
  }
})
</script>

<style scoped>
.home {
  width: 100%;
}

.section {
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  padding: 5rem 1.5rem;
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  padding: 7rem 1.5rem 5rem;
  width: 100%;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.hero-glow--green {
  width: 500px;
  height: 400px;
  background: #10b981;
  opacity: 0.12;
  top: -5%;
  left: 10%;
}
.hero-glow--blue {
  width: 400px;
  height: 300px;
  background: #3b82f6;
  opacity: 0.08;
  top: 30%;
  right: 5%;
}

/* Split layout */
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 4rem;
  align-items: center;
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

/* Left */
.hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 9999px;
  padding: 0.35rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent-green-hover);
  margin-bottom: 1.75rem;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-green);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.75); }
}

.hero-title {
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -1.5px;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  text-align: left;
}

.hero-gradient {
  background: linear-gradient(135deg, #10b981 0%, #34d399 40%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 2.25rem;
  text-align: left;
}

.hero-ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

/* btn-primary / btn-ghost base defined in main.css — overrides only */
.btn-primary {
  padding: 0.8rem 1.75rem;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}
.btn-primary:hover {
  box-shadow: 0 6px 28px rgba(16, 185, 129, 0.45);
  transform: translateY(-1px);
}
.btn-ghost {
  padding: 0.8rem 1.75rem;
  transition: border-color 0.2s, color 0.2s, transform 0.15s;
}
.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.chip--more {
  color: var(--accent-green);
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(16, 185, 129, 0.06);
}

/* ─── Spotlight card (right side) ──────────────────────────────────────── */
.hero-spotlight {
  display: flex;
  align-items: stretch;
}

.spotlight-card {
  width: 100%;
  background: rgba(13, 20, 36, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06);
}

.spotlight-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.spotlight-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  animation: pulse-dot 2s ease-in-out infinite;
  flex-shrink: 0;
}

.spotlight-player {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spotlight-crest {
  width: 52px;
  height: 52px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}

.spotlight-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.spotlight-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spotlight-team {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.spotlight-stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius);
  overflow: hidden;
}

.spotlight-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.9rem 0.5rem;
}

.spotlight-stat--big .s-val {
  font-size: 2rem;
  color: var(--accent-green);
}

.s-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.5px;
}

.s-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spotlight-divider {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.spotlight-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-green-hover);
  text-decoration: none;
  text-align: right;
}
.spotlight-link:hover { text-decoration: underline; }

/* Skeleton */
.spotlight-skeleton {
  gap: 1rem;
}
.skel {
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  animation: shimmer 1.6s ease-in-out infinite;
}
.skel--sm  { height: 14px; width: 60%; }
.skel--lg  { height: 52px; }
.skel--md  { height: 80px; }
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ─── Numbers strip ─────────────────────────────────────────────────────── */
.numbers-strip {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 14, 26, 0.5);
  backdrop-filter: blur(8px);
}

.numbers-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}

.number-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 3rem;
}

.number-val {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -1px;
  line-height: 1;
}

.number-lbl {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.number-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .number-divider { display: none; }
  .number-item { padding: 0.5rem 1.5rem; }
}

/* ─── Section header ────────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.section-header.centered {
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.4px;
  line-height: 1.2;
}

.section-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.4rem;
}

.section-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-green-hover);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.section-link:hover { text-decoration: underline; }

/* ─── Features grid ─────────────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }

.feature-card {
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-decoration: none;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.feature-card:hover {
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.feature-card--accent {
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(8, 20, 18, 0.85);
}
.feature-card--accent:hover {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.1);
}

.feature-icon {
  font-size: 1.6rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.feature-card p {
  font-size: 0.845rem;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

.feature-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-green-hover);
  margin-top: 0.25rem;
}

/* ─── Competitions grid ─────────────────────────────────────────────────── */
.competitions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (max-width: 700px) { .competitions-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px) { .competitions-grid { grid-template-columns: 1fr; } }

.comp-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 0.9rem 1.1rem;
  text-decoration: none;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.15s;
}
.comp-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

.comp-flag {
  font-size: 1.6rem;
  line-height: 1;
  flex-shrink: 0;
}

.comp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.comp-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comp-country {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.comp-arrow {
  font-size: 0.85rem;
  color: var(--text-muted);
  transition: color 0.15s, transform 0.15s;
  flex-shrink: 0;
}
.comp-card:hover .comp-arrow {
  color: var(--accent-green-hover);
  transform: translateX(3px);
}

/* ─── Mobile ────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  /* Hero: cut the excessive padding, tighten everything */
  .hero { padding: 3.5rem 1.25rem 2.5rem; }
  .hero-inner { gap: 2rem; }

  .hero-badge { font-size: 0.68rem; padding: 0.3rem 0.85rem; margin-bottom: 1.25rem; }
  .hero-title { font-size: 2rem; letter-spacing: -0.5px; margin-bottom: 1rem; }
  .hero-subtitle { font-size: 0.9rem; margin-bottom: 1.5rem; }

  /* Buttons: stack and stretch full width */
  .hero-ctas { flex-direction: column; gap: 0.65rem; margin-bottom: 1.75rem; }
  .btn-primary,
  .btn-ghost { width: 100%; text-align: center; padding: 0.85rem 1rem; }

  /* League chips: smaller */
  .chip { font-size: 0.72rem; padding: 0.25rem 0.65rem; }

  /* Spotlight card: more compact */
  .spotlight-card { padding: 1.25rem; gap: 1rem; }
  .spotlight-crest { width: 38px; height: 38px; }
  .spotlight-name { font-size: 1rem; }
  .spotlight-stat { padding: 0.65rem 0.35rem; }
  .spotlight-stat--big .s-val { font-size: 1.6rem; }
  .s-val { font-size: 1.1rem; }
  .s-lbl { font-size: 0.62rem; }

  /* Numbers strip: wrap into 2×2 */
  .numbers-inner { flex-wrap: wrap; justify-content: center; gap: 0; }
  .number-item { width: 50%; padding: 0.75rem 0; }
  .number-divider { display: none; }
  .number-val { font-size: 1.6rem; }
  .number-lbl { font-size: 0.7rem; }

  /* Sections: cut the vertical breathing room */
  .section { padding: 3rem 1.25rem; }
  .section-title { font-size: 1.3rem; }
  .section-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }

  /* Feature cards: less padding */
  .feature-card { padding: 1.25rem 1.1rem; }

  /* CTA section */
  .cta-section { padding: 4rem 1.25rem; }
  .cta-btns { flex-direction: column; align-items: stretch; }
  .cta-btns .btn-primary,
  .cta-btns .btn-ghost { width: 100%; text-align: center; }
}

/* ─── Bottom CTA ────────────────────────────────────────────────────────── */
.cta-section {
  position: relative;
  text-align: center;
  padding: 7rem 1.5rem;
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 540px;
  margin: 0 auto;
}

.cta-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  margin-bottom: 0.75rem;
}

.cta-sub {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.cta-btns {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
