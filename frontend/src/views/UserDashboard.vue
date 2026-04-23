<template>
  <!-- Not logged in -->
  <div v-if="!user" class="auth-prompt">
    <div class="auth-prompt-card">
      <span class="prompt-icon">⭐</span>
      <h2>Your Dashboard</h2>
      <p>{{ $t('dashboard.noAuth') }}</p>
      <RouterLink to="/login" class="btn-primary">{{ $t('dashboard.toLogin') }}</RouterLink>
    </div>
  </div>

  <!-- Logged in -->
  <div v-else class="dashboard">

    <div class="dashboard-header">
      <h1>{{ $t('dashboard.welcome', { name: user.username }) }}</h1>
      <p class="dashboard-sub">{{ $t('dashboard.sub') }}</p>
    </div>

    <!-- ── Tabs ──────────────────────────────────────────────────────────── -->
    <div class="dash-tabs">
      <button class="dash-tab" :class="{ active: dashTab === 'overview' }" @click="dashTab = 'overview'">{{ $t('dashboard.overview') }}</button>
      <button class="dash-tab" :class="{ active: dashTab === 'predictions' }" @click="dashTab = 'predictions'">
        {{ $t('dashboard.predictions') }}
        <span v-if="pastPredictions.length || upcomingFixtures.length" class="dash-tab-count">{{ upcomingFixtures.length + pastPredictions.length }}</span>
      </button>
      <button class="dash-tab" :class="{ active: dashTab === 'watchlist' }" @click="dashTab = 'watchlist'">
        {{ $t('dashboard.watchlist') }}
        <span v-if="watchlist.length" class="dash-tab-count">{{ watchlist.length }}</span>
      </button>
    </div>

    <!-- ── Overview tab ──────────────────────────────────────────────────── -->
    <template v-if="dashTab === 'overview'">

    <!-- ── Favourites row ─────────────────────────────────────────────────── -->
    <div class="fav-row">

      <!-- ── Favourite Team ──────────────────────────────────────────────── -->
      <div class="fav-card">
        <div class="fav-card-header">
          <h2 class="section-title">{{ $t('dashboard.favTeam') }}</h2>
          <button
            v-if="currentFavTeam"
            class="change-btn"
            @click="showTeamPicker = !showTeamPicker"
          >{{ showTeamPicker ? $t('dashboard.cancel') : $t('dashboard.change') }}</button>
        </div>

        <!-- Team display -->
        <div v-if="currentFavTeam && !showTeamPicker" class="fav-team-display">
          <div class="team-display-top">
            <div class="team-crest-wrap">
              <img v-if="currentFavTeam.Crest" :src="currentFavTeam.Crest" class="team-crest-img" :alt="currentFavTeam.Team_Name" />
              <div v-else class="team-crest-letter">{{ currentFavTeam.Team_Name.charAt(0) }}</div>
            </div>
            <div class="team-display-info">
              <span class="team-display-name">{{ currentFavTeam.Team_Name }}</span>
              <div class="team-meta-row">
                <span v-if="currentFavTeam.leagueName" class="meta-chip">{{ currentFavTeam.leagueName }}</span>
                <span v-if="currentFavTeam.tableRow" class="meta-chip meta-chip--pos">
                  <span v-if="currentFavTeam.leagueCode" class="chip-flag">{{ leagueFlagMap[currentFavTeam.leagueCode] || '🏆' }}</span>{{ ordinal(currentFavTeam.tableRow.Position) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Season stat strip -->
          <div v-if="currentFavTeam.tableRow" class="stat-strip">
            <div class="strip-item">
              <span class="strip-val strip-val--pts">{{ currentFavTeam.tableRow.Pts }}</span>
              <span class="strip-lbl">Pts</span>
            </div>
            <div class="strip-divider"></div>
            <div class="strip-item">
              <span class="strip-val strip-val--win">{{ currentFavTeam.tableRow.W }}</span>
              <span class="strip-lbl">W</span>
            </div>
            <div class="strip-item">
              <span class="strip-val strip-val--draw">{{ currentFavTeam.tableRow.D }}</span>
              <span class="strip-lbl">D</span>
            </div>
            <div class="strip-item">
              <span class="strip-val strip-val--lose">{{ currentFavTeam.tableRow.L }}</span>
              <span class="strip-lbl">L</span>
            </div>
            <div class="strip-divider"></div>
            <div class="strip-item">
              <span class="strip-val" :class="currentFavTeam.tableRow.GD > 0 ? 'strip-val--win' : currentFavTeam.tableRow.GD < 0 ? 'strip-val--lose' : ''">
                {{ currentFavTeam.tableRow.GD > 0 ? '+' : '' }}{{ currentFavTeam.tableRow.GD }}
              </span>
              <span class="strip-lbl">GD</span>
            </div>
          </div>

          <!-- Form dots -->
          <div v-if="teamForm.length" class="form-row">
            <span class="form-label">{{ $t('dashboard.form') }}</span>
            <div class="form-dots">
              <span
                v-for="(r, i) in teamForm"
                :key="i"
                class="form-dot"
                :class="`form-dot--${r}`"
                :title="r === 'win' ? 'W' : r === 'draw' ? 'D' : 'L'"
              ></span>
            </div>
          </div>

          <RouterLink :to="`/teams/${currentFavTeam.Team_ID}`" class="view-link">{{ $t('dashboard.viewSquad') }}</RouterLink>
        </div>

        <p v-else-if="!showTeamPicker" class="no-fav">{{ $t('dashboard.noFavTeam') }}</p>

        <!-- Team picker -->
        <div v-if="showTeamPicker || !currentFavTeam" class="picker-section">
          <input
            v-model="teamPickerSearch"
            class="picker-search"
            type="text"
            :placeholder="$t('dashboard.searchTeams')"
          />
          <div v-if="teamsLoading" class="picker-loading">{{ $t('dashboard.loadingTeams') }}</div>
          <div v-else class="team-picker-list">
            <div v-for="group in teamPickerGroups" :key="group.leagueCode" class="picker-club-group">
              <div class="picker-club-header">
                <span class="picker-league-flag">{{ group.flag }}</span>
                <span class="picker-club-name">{{ group.leagueName }}</span>
                <span class="picker-club-count">{{ group.teams.length }}</span>
              </div>
              <div class="team-picker-grid">
                <button
                  v-for="team in group.teams"
                  :key="team.Team_ID"
                  class="picker-team-card"
                  :class="{ selected: pendingTeamId === team.Team_ID }"
                  @click="pendingTeamId = team.Team_ID"
                >
                  <img v-if="team.Crest" :src="team.Crest" class="picker-crest" :alt="team.Team_Name" />
                  <div v-else class="picker-crest-letter">{{ team.Team_Name.charAt(0) }}</div>
                  <span class="picker-team-name">{{ team.Team_Name }}</span>
                  <span v-if="pendingTeamId === team.Team_ID" class="picker-check">✓</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="pendingTeamId" class="picker-actions">
            <button class="btn-primary" :disabled="savingTeam" @click="saveTeam">
              {{ savingTeam ? $t('dashboard.saving') : $t('dashboard.saveTeam', { name: pendingTeamName }) }}
            </button>
            <span v-if="teamError" class="error-msg">{{ teamError }}</span>
          </div>
          <p v-if="teamSuccess" class="success-msg">{{ $t('dashboard.teamSaved') }}</p>
        </div>

      </div>

      <!-- ── Favourite Player ─────────────────────────────────────────────── -->
      <div class="fav-card">
        <div class="fav-card-header">
          <h2 class="section-title">{{ $t('dashboard.favPlayer') }}</h2>
          <button
            v-if="currentFavPlayer"
            class="change-btn"
            @click="showPlayerPicker = !showPlayerPicker"
          >{{ showPlayerPicker ? $t('dashboard.cancel') : $t('dashboard.change') }}</button>
        </div>

        <!-- Player display -->
        <div v-if="currentFavPlayer && !showPlayerPicker" class="fav-player-display" style="cursor:pointer" @click="$router.push(`/players/${currentFavPlayer.Player_ID}?teamId=${currentFavPlayer.Team_ID}&code=${currentFavPlayer.leagueCode || 'PL'}`)">
          <div class="player-display-top">
            <div class="player-avatar" :class="`avatar-${posClass(currentFavPlayer.Position)}`">
              {{ currentFavPlayer.Name.charAt(0) }}
            </div>
            <div class="player-display-info">
              <div class="player-name-row">
                <span class="player-display-name">{{ currentFavPlayer.Name }} {{ currentFavPlayer.Surname }}</span>
                <span class="saved-badge">{{ $t('dashboard.savedBtn') }}</span>
              </div>
              <div class="player-meta-row">
                <span class="pos-badge" :class="`pos-badge--${posClass(currentFavPlayer.Position)}`">
                  {{ posAbbr(currentFavPlayer.DetailedPosition) }}
                </span>
                <span class="meta-chip">{{ currentFavPlayer.Team_Name }}</span>
                <span v-if="currentFavPlayer.Nationality" class="meta-chip nat-chip">{{ nationalityFlag(currentFavPlayer.Nationality) }} {{ currentFavPlayer.Nationality }}</span>
                <span class="meta-chip">Age {{ currentFavPlayer.Age }}</span>
              </div>
            </div>
          </div>

          <!-- Season stats strip -->
          <div v-if="playerStatsLoading" class="player-stats-loading">{{ $t('dashboard.loadingStats') }}</div>
          <template v-else-if="playerStats">
            <!-- GK stats -->
            <div v-if="currentFavPlayer.Position === 'Goalkeeper'" class="stat-strip">
              <div class="strip-item">
                <span class="strip-val strip-val--win">{{ playerStats.cleanSheets }}</span>
                <span class="strip-lbl">{{ $t('dashboard.cleanSheets') }}</span>
              </div>
              <div class="strip-divider"></div>
              <div class="strip-item">
                <span class="strip-val strip-val--lose">{{ playerStats.conceded }}</span>
                <span class="strip-lbl">{{ $t('dashboard.conceded') }}</span>
              </div>
              <div class="strip-divider"></div>
              <div class="strip-item">
                <span class="strip-val">{{ playerStats.played }}</span>
                <span class="strip-lbl">{{ $t('dashboard.games') }}</span>
              </div>
            </div>
            <!-- Outfield stats -->
            <div v-else class="stat-strip">
              <div class="strip-item">
                <span class="strip-val strip-val--fwd">{{ playerStats.goals }}</span>
                <span class="strip-lbl">{{ $t('dashboard.goals') }}</span>
              </div>
              <div class="strip-divider"></div>
              <div class="strip-item">
                <span class="strip-val strip-val--mid">{{ playerStats.assists }}</span>
                <span class="strip-lbl">{{ $t('dashboard.assists') }}</span>
              </div>
              <div class="strip-divider"></div>
              <div class="strip-item">
                <span class="strip-val">{{ playerStats.penalties }}</span>
                <span class="strip-lbl">{{ $t('dashboard.pens') }}</span>
              </div>
              <div class="strip-divider"></div>
              <div class="strip-item">
                <span class="strip-val">{{ playerStats.playedMatches ?? '—' }}</span>
                <span class="strip-lbl">{{ $t('dashboard.apps') }}</span>
              </div>
            </div>
          </template>

          <!-- Team form -->
          <div v-if="playerTeamForm.length" class="form-row">
            <span class="form-label">{{ $t('dashboard.form') }}</span>
            <div class="form-dots">
              <span
                v-for="(r, i) in playerTeamForm"
                :key="i"
                class="form-dot"
                :class="`form-dot--${r}`"
                :title="r === 'win' ? 'W' : r === 'draw' ? 'D' : 'L'"
              ></span>
            </div>
          </div>

          <RouterLink :to="`/teams/${currentFavPlayer.Team_ID}`" class="view-link">{{ $t('dashboard.viewSquad') }}</RouterLink>
        </div>

        <p v-else-if="!showPlayerPicker" class="no-fav">{{ $t('dashboard.noFavPlayer') }}</p>

        <!-- Player picker -->
        <div v-if="showPlayerPicker || !currentFavPlayer" class="picker-section">
          <!-- League tabs -->
          <div class="picker-league-tabs">
            <button
              v-for="lg in playerLeagues"
              :key="lg.code"
              class="picker-league-tab"
              :class="{ active: playerLeague === lg.code }"
              @click="selectPlayerLeague(lg.code)"
            >{{ lg.flag }} {{ lg.short }}</button>
          </div>
          <input
            v-model="playerPickerSearch"
            class="picker-search"
            type="text"
            :placeholder="$t('dashboard.searchPlayers')"
          />
          <div v-if="playersLoading" class="picker-loading">{{ $t('dashboard.loadingPlayers') }}</div>
          <div v-else class="player-picker-list">
            <div v-for="group in playerPickerGroups" :key="group.teamId" class="picker-club-group">
              <div class="picker-club-header">
                <img v-if="group.crest" :src="group.crest" class="picker-club-crest" :alt="group.teamName" />
                <div v-else class="picker-club-crest-letter">{{ group.teamName.charAt(0) }}</div>
                <span class="picker-club-name">{{ group.teamName }}</span>
                <span v-if="group.country" class="picker-club-flag">{{ nationalityFlag(group.country) }}</span>
                <span class="picker-club-count">{{ group.players.length }}</span>
              </div>
              <div class="picker-club-players">
                <button
                  v-for="player in group.players"
                  :key="player.Player_ID"
                  class="picker-player-card"
                  :class="{ selected: pendingPlayerId === player.Player_ID }"
                  @click="pendingPlayerId = player.Player_ID"
                >
                  <div class="picker-player-avatar" :class="`avatar-${posClass(player.Position)}`">
                    {{ player.Name.charAt(0) }}
                  </div>
                  <span class="picker-player-name">{{ player.Name }} {{ player.Surname }}</span>
                  <span class="pos-badge pos-badge--sm" :class="`pos-badge--${posClass(player.Position)}`">
                    {{ posAbbr(player.DetailedPosition) }}
                  </span>
                  <span v-if="pendingPlayerId === player.Player_ID" class="picker-check">✓</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="pendingPlayerId" class="picker-actions">
            <button class="btn-primary" :disabled="savingPlayer" @click="savePlayer">
              {{ savingPlayer ? $t('dashboard.saving') : $t('dashboard.savePlayer') }}
            </button>
            <span v-if="playerError" class="error-msg">{{ playerError }}</span>
          </div>
          <p v-if="playerSuccess" class="success-msg">{{ $t('dashboard.playerSaved') }}</p>
        </div>

      </div>
    </div>

    <!-- ── Recent Results ─────────────────────────────────────────────────── -->
    <div v-if="recentResults.length" class="full-card">
      <h2 class="section-title">{{ $t('dashboard.recentResults') }}
        <span class="section-sub-inline">{{ currentFavTeam?.Team_Name }}</span>
      </h2>
      <div class="results-list">
        <div
          v-for="match in recentResults"
          :key="match.Match_ID"
          class="result-row"
          :class="`border-${getMatchResult(match)}`"
        >
          <span class="result-badge" :class="`result-badge--${getMatchResult(match)}`">
            {{ getMatchResult(match) === 'win' ? 'W' : getMatchResult(match) === 'draw' ? 'D' : 'L' }}
          </span>
          <span class="result-date">{{ formatDate(match.MatchDate) }}</span>
          <div class="result-teams">
            <span class="result-team" :class="{ 'our-team': match.HomeTeamID === savedTeamId }">
              {{ match.HomeTeam }}
            </span>
            <img v-if="match.HomeCrest" :src="match.HomeCrest" class="result-crest" :alt="match.HomeTeam" />
            <span class="result-score" :class="scoreClass(match, savedTeamId)">{{ match.Score }}</span>
            <img v-if="match.AwayCrest" :src="match.AwayCrest" class="result-crest" :alt="match.AwayTeam" />
            <span class="result-team result-team--away" :class="{ 'our-team': match.AwayTeamID === savedTeamId }">
              {{ match.AwayTeam }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Upcoming Fixtures ──────────────────────────────────────────────── -->
    <div v-if="currentFavTeam" class="full-card">
      <h2 class="section-title">{{ $t('dashboard.upcomingFixtures') }}
        <span class="section-sub-inline">{{ currentFavTeam.Team_Name }}</span>
      </h2>
      <div v-if="fixturesLoading" class="loading-text">{{ $t('dashboard.loadingFixtures') }}</div>
      <div v-else-if="upcomingFixtures.length" class="fixtures-list">
        <div
          v-for="(fix, i) in upcomingFixtures"
          :key="fix.Match_ID || i"
          class="fixture-row"
        >
          <div class="fixture-date-col">
            <span class="fixture-date">{{ formatDate(fix.MatchDate) }}</span>
            <span class="fixture-time">{{ formatTime(fix.MatchDate) }}</span>
          </div>
          <div class="fixture-teams">
            <span class="fixture-team" :class="{ 'our-team': fix.HomeTeamID === savedTeamId }">
              {{ fix.HomeTeam }}
            </span>
            <img v-if="fix.HomeCrest" :src="fix.HomeCrest" class="result-crest" :alt="fix.HomeTeam" />
            <span class="fixture-vs">vs</span>
            <img v-if="fix.AwayCrest" :src="fix.AwayCrest" class="result-crest" :alt="fix.AwayTeam" />
            <span class="fixture-team fixture-team--away" :class="{ 'our-team': fix.AwayTeamID === savedTeamId }">
              {{ fix.AwayTeam }}
            </span>
          </div>
          <span class="fixture-badge">{{ $t('dashboard.upcoming') }}</span>
        </div>
      </div>
      <p v-else class="no-fav">{{ $t('dashboard.noFixtures') }}</p>
    </div>

    </template>
    <!-- ── /Overview tab ─────────────────────────────────────────────────── -->

    <!-- ── Predictions tab ───────────────────────────────────────────────── -->
    <template v-if="dashTab === 'predictions'">
    <div v-if="currentFavTeam && (upcomingFixtures.length || pastPredictions.length)" class="full-card">
      <h2 class="section-title">{{ $t('dashboard.matchPredictions') }}
        <span class="section-sub-inline">{{ $t('dashboard.predictSub') }}</span>
      </h2>

      <!-- Upcoming: prediction inputs -->
      <div v-if="upcomingFixtures.length" class="predictions-list">
        <div v-for="fix in upcomingFixtures" :key="fix.Match_ID" class="pred-row">
          <div class="pred-teams">
            <div class="pred-side">
              <img v-if="fix.HomeCrest" :src="fix.HomeCrest" class="pred-crest" :alt="fix.HomeTeam" />
              <span class="pred-team-name" :class="{ 'our-team': fix.HomeTeamID === savedTeamId }">{{ fix.HomeTeam }}</span>
            </div>
            <div class="pred-score-inputs">
              <div class="score-stepper">
                <button class="step-btn" @click="decrementGoal(fix.Match_ID, 'home')">−</button>
                <span class="step-val">{{ getPredInput(fix.Match_ID).home }}</span>
                <button class="step-btn" @click="incrementGoal(fix.Match_ID, 'home')">+</button>
              </div>
              <span class="pred-colon">:</span>
              <div class="score-stepper">
                <button class="step-btn" @click="decrementGoal(fix.Match_ID, 'away')">−</button>
                <span class="step-val">{{ getPredInput(fix.Match_ID).away }}</span>
                <button class="step-btn" @click="incrementGoal(fix.Match_ID, 'away')">+</button>
              </div>
            </div>
            <div class="pred-side pred-side--right">
              <span class="pred-team-name pred-team-name--right" :class="{ 'our-team': fix.AwayTeamID === savedTeamId }">{{ fix.AwayTeam }}</span>
              <img v-if="fix.AwayCrest" :src="fix.AwayCrest" class="pred-crest" :alt="fix.AwayTeam" />
            </div>
          </div>
          <div class="pred-footer">
            <span class="pred-date">{{ formatDate(fix.MatchDate) }} · {{ formatTime(fix.MatchDate) }}</span>
            <button
              class="pred-save-btn"
              :class="{ 'pred-save-btn--saved': savedPredictions[fix.Match_ID] }"
              :disabled="savingPredId === fix.Match_ID"
              @click="savePrediction(fix.Match_ID)"
            >{{ savingPredId === fix.Match_ID ? '...' : savedPredictions[fix.Match_ID] ? $t('dashboard.savedBtn') : $t('dashboard.predict') }}</button>
          </div>
        </div>
      </div>

      <!-- Past predictions -->
      <template v-if="pastPredictions.length">
        <h3 class="pred-past-header">{{ $t('dashboard.pastPredictions') }}</h3>
        <div class="predictions-list">
          <div v-for="p in pastPredictions" :key="`past-${p.Match_ID}`" class="pred-row pred-row--past">
            <div class="pred-teams">
              <div class="pred-side">
                <img v-if="p.HomeCrest" :src="p.HomeCrest" class="pred-crest" :alt="p.HomeTeam" />
                <span class="pred-team-name" :class="{ 'our-team': p.HomeTeamID === savedTeamId }">{{ p.HomeTeam }}</span>
              </div>
              <div class="pred-score-display">
                <span class="pred-actual-score">{{ p.Score }}</span>
                <span class="pred-vs-sep">·</span>
                <span class="pred-your-score">{{ p.predHome }}-{{ p.predAway }}</span>
              </div>
              <div class="pred-side pred-side--right">
                <span class="pred-team-name pred-team-name--right" :class="{ 'our-team': p.AwayTeamID === savedTeamId }">{{ p.AwayTeam }}</span>
                <img v-if="p.AwayCrest" :src="p.AwayCrest" class="pred-crest" :alt="p.AwayTeam" />
              </div>
            </div>
            <div class="pred-footer">
              <span class="pred-date">{{ formatDate(p.MatchDate) }}</span>
              <span class="pred-outcome" :class="`pred-outcome--${p.outcome}`">
                {{ p.outcome === 'exact' ? $t('predOutcome.exact') : p.outcome === 'correct' ? $t('predOutcome.correct') : $t('predOutcome.wrong') }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else-if="!currentFavTeam" class="empty-tab-state">
      <i18n-t keypath="dashboard.setFavTeam" tag="p">
        <template #tab>
          <button class="inline-link" @click="dashTab = 'overview'">{{ $t('dashboard.overviewTab') }}</button>
        </template>
      </i18n-t>
    </div>
    <div v-else class="empty-tab-state">
      <p>{{ $t('dashboard.noPredictions') }}</p>
    </div>
    </template>
    <!-- ── /Predictions tab ──────────────────────────────────────────────── -->

    <!-- ── Watchlist tab ─────────────────────────────────────────────────── -->
    <template v-if="dashTab === 'watchlist'">
    <div class="full-card">
      <div class="fav-card-header">
        <h2 class="section-title">
          {{ $t('dashboard.watchlist') }}
          <span v-if="watchlist.length" class="section-sub-inline">{{ watchlist.length }} player{{ watchlist.length !== 1 ? 's' : '' }}</span>
        </h2>
        <button class="change-btn" @click="toggleWatchlistPicker">
          {{ showWatchlistPicker ? $t('dashboard.cancel') : $t('dashboard.addPlayer') }}
        </button>
      </div>

      <!-- Watchlist grid -->
      <div v-if="watchlist.length && !showWatchlistPicker" class="watchlist-grid">
        <div v-for="p in watchlist" :key="p.Player_ID" class="watchlist-card">
          <div class="watchlist-card-top">
            <div class="player-avatar player-avatar--sm" :class="`avatar-${posClass(p.Position)}`">
              {{ (p.Player_Name || '?').charAt(0) }}
            </div>
            <div class="watchlist-card-info">
              <span class="watchlist-player-name">{{ p.Player_Name }}</span>
              <span class="watchlist-team-name">{{ p.Team_Name }}</span>
            </div>
            <button class="watchlist-remove-btn" @click="removeFromWatchlist(p.Player_ID)" title="Remove">×</button>
          </div>
          <div class="watchlist-card-meta">
            <span class="pos-badge pos-badge--sm" :class="`pos-badge--${posClass(p.Position)}`">{{ posAbbr(p.DetailedPosition) }}</span>
            <span v-if="p.Nationality" class="meta-chip">{{ nationalityFlag(p.Nationality) }}</span>
            <span v-if="p.LeagueCode" class="meta-chip">{{ leagueFlagMap[p.LeagueCode] || '🏆' }} {{ p.LeagueCode }}</span>
          </div>
          <!-- Stat strip -->
          <div v-if="watchlistStats[p.Player_ID]" class="watchlist-stat-strip">
            <template v-if="p.Position === 'Goalkeeper'">
              <div class="wl-stat"><span class="wl-val wl-val--win">{{ watchlistStats[p.Player_ID].cleanSheets }}</span><span class="wl-lbl">CS</span></div>
              <div class="wl-divider"></div>
              <div class="wl-stat"><span class="wl-val wl-val--lose">{{ watchlistStats[p.Player_ID].conceded }}</span><span class="wl-lbl">GA</span></div>
              <div class="wl-divider"></div>
              <div class="wl-stat"><span class="wl-val">{{ watchlistStats[p.Player_ID].played }}</span><span class="wl-lbl">MP</span></div>
            </template>
            <template v-else>
              <div class="wl-stat"><span class="wl-val wl-val--fwd">{{ watchlistStats[p.Player_ID].goals ?? '—' }}</span><span class="wl-lbl">G</span></div>
              <div class="wl-divider"></div>
              <div class="wl-stat"><span class="wl-val wl-val--mid">{{ watchlistStats[p.Player_ID].assists ?? '—' }}</span><span class="wl-lbl">A</span></div>
              <div class="wl-divider"></div>
              <div class="wl-stat"><span class="wl-val">{{ watchlistStats[p.Player_ID].penalties ?? '—' }}</span><span class="wl-lbl">Pen</span></div>
              <div class="wl-divider"></div>
              <div class="wl-stat"><span class="wl-val">{{ watchlistStats[p.Player_ID].playedMatches ?? '—' }}</span><span class="wl-lbl">Apps</span></div>
            </template>
          </div>
          <div v-else-if="watchlistStatsLoading" class="watchlist-stats-loading">{{ $t('dashboard.loadingStats') }}</div>
        </div>
      </div>


      <!-- Watchlist picker -->
      <div v-if="showWatchlistPicker" class="picker-section">
        <div class="picker-league-tabs">
          <button
            v-for="lg in playerLeagues"
            :key="lg.code"
            class="picker-league-tab"
            :class="{ active: watchlistPickerLeague === lg.code }"
            @click="selectWatchlistLeague(lg.code)"
          >{{ lg.flag }} {{ lg.short }}</button>
        </div>
        <input
          v-model="watchlistPickerSearch"
          class="picker-search"
          type="text"
          :placeholder="$t('dashboard.searchPlayers')"
        />
        <div v-if="watchlistPlayersLoading" class="picker-loading">{{ $t('dashboard.loadingPlayers') }}</div>
        <div v-else class="player-picker-list">
          <div v-for="group in watchlistPickerGroups" :key="group.teamId" class="picker-club-group">
            <div class="picker-club-header">
              <img v-if="group.crest" :src="group.crest" class="picker-club-crest" :alt="group.teamName" />
              <div v-else class="picker-club-crest-letter">{{ group.teamName.charAt(0) }}</div>
              <span class="picker-club-name">{{ group.teamName }}</span>
              <span v-if="group.country" class="picker-club-flag">{{ nationalityFlag(group.country) }}</span>
              <span class="picker-club-count">{{ group.players.length }}</span>
            </div>
            <div class="picker-club-players">
              <button
                v-for="player in group.players"
                :key="player.Player_ID"
                class="picker-player-card"
                :class="{ selected: pendingWatchlistPlayerId === player.Player_ID, 'already-watched': isWatched(player.Player_ID) }"
                @click="pendingWatchlistPlayerId = player.Player_ID"
              >
                <div class="picker-player-avatar" :class="`avatar-${posClass(player.Position)}`">
                  {{ player.Name.charAt(0) }}
                </div>
                <span class="picker-player-name">{{ player.Name }} {{ player.Surname }}</span>
                <span class="pos-badge pos-badge--sm" :class="`pos-badge--${posClass(player.Position)}`">
                  {{ posAbbr(player.DetailedPosition) }}
                </span>
                <span v-if="isWatched(player.Player_ID)" class="picker-watched-star">★</span>
                <span v-else-if="pendingWatchlistPlayerId === player.Player_ID" class="picker-check">✓</span>
              </button>
            </div>
          </div>
        </div>
        <div v-if="pendingWatchlistPlayerId" class="picker-actions">
          <button class="btn-primary" :disabled="addingToWatchlist" @click="addToWatchlist">
            {{ addingToWatchlist ? $t('dashboard.adding') : isWatched(pendingWatchlistPlayerId) ? $t('dashboard.alreadyWatched') : $t('dashboard.addToWatchlist') }}
          </button>
        </div>
        <p v-if="watchlistAddSuccess" class="success-msg">{{ $t('dashboard.addedToWatchlist') }}</p>
      </div>
    </div>
    </template>
    <!-- ── /Watchlist tab ────────────────────────────────────────────────── -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../services/api'
import { nationalityFlag, posClass, posAbbr } from '../utils/football'

const store = useStore()
const { t } = useI18n()
const dashTab = ref('overview')
const user = computed(() => store.state.user)

// ── Data ──────────────────────────────────────────────────────────────────────
const teams = ref([])
const players = ref([])
const teamsLoading = ref(false)
const playersLoading = ref(false)

const savedTeamId = ref(null)
const savedPlayerId = ref(null)
const teamDetail = ref(null)

const fixturesLoading = ref(false)
const upcomingFixtures = ref([])

// ── Picker state ──────────────────────────────────────────────────────────────
const showTeamPicker = ref(false)
const showPlayerPicker = ref(false)

const playerLeagues = [
  { code: 'PL',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', short: 'PL'  },
  { code: 'PD',  flag: '🇪🇸', short: 'LaLiga' },
  { code: 'BL1', flag: '🇩🇪', short: 'Bund.'  },
  { code: 'SA',  flag: '🇮🇹', short: 'Serie A' },
  { code: 'FL1', flag: '🇫🇷', short: 'Ligue 1' },
  { code: 'ELC', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', short: 'Champ.' },
  { code: 'PPL', flag: '🇵🇹', short: 'PPL'    },
  { code: 'DED', flag: '🇳🇱', short: 'Erediv.' },
  { code: 'BSA', flag: '🇧🇷', short: 'BraSér.' },
]
const playerLeague = ref('PL')
const teamPickerSearch = ref('')
const playerPickerSearch = ref('')
const pendingTeamId = ref(null)
const pendingPlayerId = ref(null)

// ── Player stats & form ───────────────────────────────────────────────────────
const playerStats = ref(null)
const playerStatsLoading = ref(true)
const playerTeamDetail = ref(null)

// ── Watchlist ─────────────────────────────────────────────────────────────────
const watchlist = ref([])
const watchlistStats = ref({})
const watchlistStatsLoading = ref(false)
const showWatchlistPicker = ref(false)
const watchlistPickerLeague = ref('PL')
const watchlistPickerSearch = ref('')
const watchlistPlayers = ref([])
const watchlistPlayersLoading = ref(false)
const pendingWatchlistPlayerId = ref(null)
const addingToWatchlist = ref(false)
const watchlistAddSuccess = ref(false)

// ── Predictions ───────────────────────────────────────────────────────────────
const savedPredictions = ref({})  // { [matchId]: { home, away } }
const predictionInputs = ref({})  // { [matchId]: { home, away } } — current form state
const savingPredId = ref(null)

// ── Save state ────────────────────────────────────────────────────────────────
const savingTeam = ref(false)
const savingPlayer = ref(false)
const teamSuccess = ref(false)
const playerSuccess = ref(false)
const teamError = ref('')
const playerError = ref('')

// ── Derived ───────────────────────────────────────────────────────────────────
const currentFavTeam = computed(() => teamDetail.value)

const currentFavPlayer = computed(() =>
  savedPlayerId.value ? players.value.find(p => p.Player_ID === savedPlayerId.value) ?? null : null
)

const pendingTeamName = computed(() => {
  const t = teams.value.find(t => t.Team_ID === pendingTeamId.value)
  return t?.Team_Name || ''
})

const filteredPickerTeams = computed(() => {
  const s = teamPickerSearch.value.toLowerCase()
  if (!s) return teams.value
  return teams.value.filter(t => t.Team_Name.toLowerCase().includes(s))
})

const leagueFlagMap = Object.fromEntries(playerLeagues.map(l => [l.code, l.flag]))

const teamPickerGroups = computed(() => {
  const groups = []
  const map = {}
  for (const t of filteredPickerTeams.value) {
    const key = t.leagueCode || 'Other'
    if (!map[key]) {
      map[key] = { leagueCode: key, leagueName: t.leagueName || key, flag: leagueFlagMap[key] || '🏆', teams: [] }
      groups.push(map[key])
    }
    map[key].teams.push(t)
  }
  return groups
})

const playerPickerGroups = computed(() => {
  const groups = []
  const map = {}
  for (const p of filteredPickerPlayers.value) {
    if (!map[p.Team_ID]) {
      const t = teams.value.find(t => t.Team_ID === p.Team_ID)
      map[p.Team_ID] = { teamId: p.Team_ID, teamName: p.Team_Name, crest: t?.Crest || null, country: t?.Country || null, players: [] }
      groups.push(map[p.Team_ID])
    }
    map[p.Team_ID].players.push(p)
  }
  return groups
})

const playerTeamForm = computed(() => {
  if (!playerTeamDetail.value?.recentMatches || !currentFavPlayer.value) return []
  const teamId = currentFavPlayer.value.Team_ID
  return [...playerTeamDetail.value.recentMatches]
    .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
    .slice(0, 5)
    .map(m => {
      if (!m.Score || !m.Score.includes('-')) return 'draw'
      const [h, a] = m.Score.split('-').map(Number)
      if (m.HomeTeamID === teamId) return h > a ? 'win' : h < a ? 'lose' : 'draw'
      return a > h ? 'win' : a < h ? 'lose' : 'draw'
    })
})

const filteredPickerPlayers = computed(() => {
  const s = playerPickerSearch.value.toLowerCase()
  if (!s) return players.value
  return players.value.filter(p =>
    `${p.Name} ${p.Surname}`.toLowerCase().includes(s) ||
    (p.Team_Name || '').toLowerCase().includes(s)
  )
})

const teamForm = computed(() => {
  if (!teamDetail.value?.recentMatches || !savedTeamId.value) return []
  return [...teamDetail.value.recentMatches]
    .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
    .slice(0, 5)
    .map(m => getMatchResult(m))
})

const recentResults = computed(() => {
  if (!teamDetail.value?.recentMatches) return []
  return [...teamDetail.value.recentMatches]
    .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
    .slice(0, 5)
})

const pastPredictions = computed(() => {
  return recentResults.value
    .filter(m => savedPredictions.value[m.Match_ID])
    .map(m => {
      const pred = savedPredictions.value[m.Match_ID]
      let outcome = 'wrong'
      if (m.Score && m.Score.includes('-')) {
        const [ah, aa] = m.Score.split('-').map(Number)
        if (ah === pred.home && aa === pred.away) {
          outcome = 'exact'
        } else {
          const actualWinner = ah > aa ? 'home' : aa > ah ? 'away' : 'draw'
          const predWinner = pred.home > pred.away ? 'home' : pred.away > pred.home ? 'away' : 'draw'
          if (actualWinner === predWinner) outcome = 'correct'
        }
      }
      return { ...m, predHome: pred.home, predAway: pred.away, outcome }
    })
})

const watchlistFilteredPlayers = computed(() => {
  const s = watchlistPickerSearch.value.toLowerCase()
  if (!s) return watchlistPlayers.value
  return watchlistPlayers.value.filter(p =>
    `${p.Name} ${p.Surname}`.toLowerCase().includes(s) ||
    (p.Team_Name || '').toLowerCase().includes(s)
  )
})

const watchlistPickerGroups = computed(() => {
  const groups = []
  const map = {}
  for (const p of watchlistFilteredPlayers.value) {
    if (!map[p.Team_ID]) {
      const t = teams.value.find(t => t.Team_ID === p.Team_ID)
      map[p.Team_ID] = { teamId: p.Team_ID, teamName: p.Team_Name, crest: t?.Crest || null, country: t?.Country || null, players: [] }
      groups.push(map[p.Team_ID])
    }
    map[p.Team_ID].players.push(p)
  }
  return groups
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n) {
  if (!n) return ''
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getMatchResult(match) {
  if (!match.Score || !match.Score.includes('-')) return 'draw'
  const [h, a] = match.Score.split('-').map(Number)
  if (match.HomeTeamID === savedTeamId.value) return h > a ? 'win' : h < a ? 'lose' : 'draw'
  if (match.AwayTeamID === savedTeamId.value) return a > h ? 'win' : a < h ? 'lose' : 'draw'
  return 'draw'
}

function scoreClass(match) {
  const r = getMatchResult(match)
  return r === 'win' ? 'score-win' : r === 'lose' ? 'score-lose' : 'score-draw'
}


const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

// ── Prediction helpers ────────────────────────────────────────────────────────
function getPredInput(matchId) {
  if (!predictionInputs.value[matchId]) {
    const saved = savedPredictions.value[matchId]
    predictionInputs.value[matchId] = { home: saved?.home ?? 0, away: saved?.away ?? 0 }
  }
  return predictionInputs.value[matchId]
}

function incrementGoal(matchId, side) {
  if (getPredInput(matchId)[side] < 20) getPredInput(matchId)[side]++
}

function decrementGoal(matchId, side) {
  if (getPredInput(matchId)[side] > 0) getPredInput(matchId)[side]--
}

async function savePrediction(matchId) {
  const input = getPredInput(matchId)
  savingPredId.value = matchId
  try {
    await api.post('/predictions', { matchId, homeGoals: input.home, awayGoals: input.away })
    savedPredictions.value = { ...savedPredictions.value, [matchId]: { home: input.home, away: input.away } }
  } catch (e) {
    console.error('Save prediction error:', e)
  } finally {
    savingPredId.value = null
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchTeams() {
  teamsLoading.value = true
  try {
    const res = await api.get('/all-teams')
    teams.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    teamsLoading.value = false
  }
}

async function fetchPlayers(code = playerLeague.value) {
  playersLoading.value = true
  try {
    const res = await api.get('/players', { params: { code } })
    players.value = (res.data || []).map(p => ({ ...p, leagueCode: code }))
  } catch (e) {
    console.error(e)
  } finally {
    playersLoading.value = false
  }
}

async function selectPlayerLeague(code) {
  playerLeague.value = code
  pendingPlayerId.value = null
  playerPickerSearch.value = ''
  await fetchPlayers(code)
}

async function fetchFavourites() {
  try {
    const res = await api.get('/favourites')
    savedTeamId.value   = res.data.team   ?? null
    savedPlayerId.value = res.data.player ?? null
  } catch (e) {
    console.error(e)
  }
}

async function fetchTeamDetail(teamId) {
  if (!teamId) { teamDetail.value = null; return }
  try {
    const res = await api.get(`/teams/${teamId}`)
    teamDetail.value = res.data
  } catch (e) {
    console.error(e)
    teamDetail.value = null
  }
}

async function fetchUpcomingFixtures() {
  if (!teamDetail.value) return
  const code   = teamDetail.value.leagueCode || 'PL'
  const teamId = teamDetail.value.Team_ID
  fixturesLoading.value = true
  try {
    const res = await api.get('/matches', { params: { code, status: 'upcoming' } })
    upcomingFixtures.value = res.data
      .filter(m => m.HomeTeamID === teamId || m.AwayTeamID === teamId)
      .slice(0, 5)
  } catch (e) {
    upcomingFixtures.value = []
  } finally {
    fixturesLoading.value = false
  }
}

async function fetchPlayerTeamDetail(teamId) {
  if (!teamId) { playerTeamDetail.value = null; return }
  try {
    const res = await api.get(`/teams/${teamId}`)
    playerTeamDetail.value = res.data
  } catch {
    playerTeamDetail.value = null
  }
}

async function fetchPlayerStats(playerId) {
  if (!playerId) { playerStats.value = null; playerStatsLoading.value = false; return }
  playerStatsLoading.value = true
  playerStats.value = null
  try {
    const player = players.value.find(p => p.Player_ID === playerId)
    const code = playerLeague.value || 'PL'
    const params = { code, position: player?.Position || '' }
    if (player?.Position === 'Goalkeeper') params.teamId = player.Team_ID
    const res = await api.get(`/players/${playerId}/stats`, { params })
    playerStats.value = res.data
  } catch {
    playerStats.value = null
  } finally {
    playerStatsLoading.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(savedTeamId, (newId) => {
  fetchTeamDetail(newId)
})

watch(savedPlayerId, async (newId) => {
  if (!newId) {
    fetchPlayerStats(null)
    fetchPlayerTeamDetail(null)
    return
  }
  // If saved player isn't in current league's list, try their stored league
  let player = players.value.find(p => p.Player_ID === newId)
  if (!player) {
    const favLeague = localStorage.getItem('favPlayerLeague')
    if (favLeague && favLeague !== playerLeague.value) {
      playerLeague.value = favLeague
      await fetchPlayers(favLeague)
      player = players.value.find(p => p.Player_ID === newId)
    }
  }
  fetchPlayerStats(newId)
  fetchPlayerTeamDetail(player?.Team_ID || null)
})

watch(teamDetail, (detail) => {
  if (detail) fetchUpcomingFixtures()
  else upcomingFixtures.value = []
})

// ── Save handlers ─────────────────────────────────────────────────────────────
async function saveTeam() {
  if (!pendingTeamId.value) return
  savingTeam.value = true
  teamError.value = ''
  try {
    await api.post('/favourites/team', { teamId: pendingTeamId.value })
    savedTeamId.value = pendingTeamId.value
    showTeamPicker.value = false
    pendingTeamId.value = null
    teamPickerSearch.value = ''
    teamSuccess.value = true
    setTimeout(() => { teamSuccess.value = false }, 3000)
  } catch (e) {
    teamError.value = e.response?.data?.error || 'Failed to save. Please try again.'
    setTimeout(() => { teamError.value = '' }, 6000)
  } finally {
    savingTeam.value = false
  }
}

async function savePlayer() {
  if (!pendingPlayerId.value) return
  savingPlayer.value = true
  playerError.value = ''
  try {
    await api.post('/favourites/player', { playerId: pendingPlayerId.value })
    localStorage.setItem('favPlayerLeague', playerLeague.value)
    savedPlayerId.value = pendingPlayerId.value
    showPlayerPicker.value = false
    pendingPlayerId.value = null
    playerPickerSearch.value = ''
    playerSuccess.value = true
    setTimeout(() => { playerSuccess.value = false }, 3000)
  } catch (e) {
    playerError.value = e.response?.data?.error || 'Failed to save. Please try again.'
    setTimeout(() => { playerError.value = '' }, 6000)
  } finally {
    savingPlayer.value = false
  }
}

function isWatched(playerId) {
  return watchlist.value.some(w => w.Player_ID === playerId)
}

async function fetchWatchlist() {
  try {
    const res = await api.get('/watchlist')
    watchlist.value = res.data
    if (res.data.length) fetchWatchlistStats(res.data)
  } catch {
    // silent fail
  }
}

async function fetchWatchlistStats(players) {
  watchlistStatsLoading.value = true
  try {
    const payload = players.map(p => ({
      id: p.Player_ID,
      code: p.LeagueCode || 'PL',
      position: (p.Position || '').toLowerCase(),
      teamId: p.Team_ID || null,
    }))
    const res = await api.get('/players/stats/bulk', {
      params: { players: JSON.stringify(payload) },
    })
    watchlistStats.value = { ...watchlistStats.value, ...res.data }
  } catch {
    const fallback = {}
    for (const p of players) {
      fallback[p.Player_ID] = p.Position === 'Goalkeeper'
        ? { cleanSheets: 0, conceded: 0, played: 0 }
        : { goals: null, assists: null, penalties: null, playedMatches: null }
    }
    watchlistStats.value = { ...watchlistStats.value, ...fallback }
  } finally {
    watchlistStatsLoading.value = false
  }
}

async function fetchWatchlistPlayers(code = watchlistPickerLeague.value) {
  watchlistPlayersLoading.value = true
  try {
    const res = await api.get('/players', { params: { code } })
    watchlistPlayers.value = (res.data || []).map(p => ({ ...p, leagueCode: code }))
  } catch (e) {
    console.error(e)
  } finally {
    watchlistPlayersLoading.value = false
  }
}

async function selectWatchlistLeague(code) {
  watchlistPickerLeague.value = code
  pendingWatchlistPlayerId.value = null
  watchlistPickerSearch.value = ''
  await fetchWatchlistPlayers(code)
}

function toggleWatchlistPicker() {
  showWatchlistPicker.value = !showWatchlistPicker.value
  if (showWatchlistPicker.value && watchlistPlayers.value.length === 0) {
    fetchWatchlistPlayers()
  }
}

async function addToWatchlist() {
  const player = watchlistPlayers.value.find(p => p.Player_ID === pendingWatchlistPlayerId.value)
  if (!player || isWatched(player.Player_ID)) return
  addingToWatchlist.value = true
  try {
    await api.post('/watchlist', {
      playerId: player.Player_ID,
      playerName: `${player.Name} ${player.Surname}`.trim(),
      teamId: player.Team_ID,
      teamName: player.Team_Name,
      position: player.Position,
      detailedPosition: player.DetailedPosition,
      nationality: player.Nationality,
      leagueCode: player.leagueCode,
    })
    const entry = {
      Player_ID: player.Player_ID,
      Player_Name: `${player.Name} ${player.Surname}`.trim(),
      Team_ID: player.Team_ID,
      Team_Name: player.Team_Name,
      Position: player.Position,
      DetailedPosition: player.DetailedPosition,
      Nationality: player.Nationality,
      LeagueCode: player.leagueCode,
    }
    watchlist.value.unshift(entry)
    fetchWatchlistStats([entry])
    pendingWatchlistPlayerId.value = null
    watchlistAddSuccess.value = true
    setTimeout(() => { watchlistAddSuccess.value = false }, 3000)
  } catch (e) {
    console.error('Add to watchlist error:', e)
  } finally {
    addingToWatchlist.value = false
  }
}

async function removeFromWatchlist(playerId) {
  try {
    await api.delete(`/watchlist/${playerId}`)
    watchlist.value = watchlist.value.filter(w => w.Player_ID !== playerId)
  } catch (e) {
    console.error('Remove from watchlist error:', e)
  }
}

async function fetchPredictions() {
  try {
    const res = await api.get('/predictions')
    const map = {}
    for (const p of res.data) {
      map[p.Match_ID] = { home: p.HomeGoals, away: p.AwayGoals }
    }
    savedPredictions.value = map
    predictionInputs.value = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, { ...v }]))
  } catch {
    // DB may be offline — silent fail
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!user.value) return

  // Load favourites first so the cards show immediately
  await fetchFavourites()
  fetchTeamDetail(savedTeamId.value)

  if (savedPlayerId.value) {
    const favLeague = localStorage.getItem('favPlayerLeague')
    if (favLeague) playerLeague.value = favLeague
    fetchPlayerStats(savedPlayerId.value)
    // Fetch player's team detail via their stored league
    fetchPlayers(favLeague || playerLeague.value).then(() => {
      const player = players.value.find(p => p.Player_ID === savedPlayerId.value)
      fetchPlayerTeamDetail(player?.Team_ID || null)
    })
  } else {
    fetchPlayerStats(null)
    fetchPlayerTeamDetail(null)
  }

  // Load picker data and predictions in the background
  fetchTeams()
  fetchPredictions()
  fetchWatchlist()
})
</script>

<style scoped>
/* ─── Auth prompt ────────────────────────────────────────────────────────────── */
.auth-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
}
.auth-prompt-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  max-width: 380px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.prompt-icon { font-size: 2.5rem; line-height: 1; }
.auth-prompt-card h2 { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
.auth-prompt-card p  { color: var(--text-secondary); font-size: 0.95rem; }

/* ─── Dashboard layout ────────────────────────────────────────────────────────── */
.dashboard {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.dash-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
}

.dash-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.5rem 1.1rem;
  margin-bottom: -1px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.dash-tab:hover { color: var(--text-primary); }
.dash-tab.active { color: var(--accent-hover); border-bottom-color: var(--accent-hover); }

.dash-tab-count {
  font-size: 0.62rem;
  font-weight: 700;
  background: var(--accent-muted);
  color: var(--accent-hover);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 999px;
  padding: 1px 6px;
}

.empty-tab-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.inline-link {
  background: none;
  border: none;
  color: var(--accent-hover);
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
}

.dashboard-header h1 {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--text-primary);
}
.username-highlight { color: var(--accent-hover); }
.dashboard-sub { color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.95rem; }

/* ─── Two-col fav row ─────────────────────────────────────────────────────────── */
.fav-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 680px) { .fav-row { grid-template-columns: 1fr; } }

/* ─── Fav card shell ─────────────────────────────────────────────────────────── */
.fav-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fav-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-sub-inline {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
}

.change-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.change-btn:hover { color: var(--accent-hover); border-color: var(--accent); }

/* ─── Team display ────────────────────────────────────────────────────────────── */
.fav-team-display {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.team-display-top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-crest-wrap {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c1e3d 0%, #152033 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}
.team-crest-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
}
.team-crest-letter {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent-hover);
}

.team-display-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.team-display-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.team-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  white-space: nowrap;
}
.chip-flag { font-size: 1rem; line-height: 1; }
.nat-chip { gap: 0.3rem; }
.meta-chip--pos {
  color: var(--accent-hover);
  background: var(--accent-muted);
  border-color: var(--accent);
}

/* ─── Stat strip ──────────────────────────────────────────────────────────────── */
.stat-strip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.6rem 0.85rem;
}
.strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  flex: 1;
}
.strip-val {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.strip-val--pts  { color: var(--accent-hover); }
.strip-val--win  { color: var(--win); }
.strip-val--draw { color: var(--draw); }
.strip-val--lose { color: var(--lose); }
.strip-val--fwd  { color: var(--pos-fwd); }
.strip-val--mid  { color: var(--pos-mid); }
.strip-lbl {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.strip-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

/* ─── Form dots ───────────────────────────────────────────────────────────────── */
.form-row { display: flex; align-items: center; gap: 0.6rem; }
.form-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.form-dots { display: flex; gap: 0.3rem; }
.form-dot {
  width: 11px; height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
}
.form-dot--win  { background: var(--win); }
.form-dot--lose { background: var(--lose); }
.form-dot--draw { background: var(--draw); }

.view-link {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-hover);
  text-decoration: none;
  transition: color 0.15s;
  width: fit-content;
}
.view-link:hover { color: #fff; text-decoration: underline; }

.player-stats-loading {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 0.4rem 0;
}

/* ─── Player display ──────────────────────────────────────────────────────────── */
.fav-player-display { display: flex; flex-direction: column; gap: 0.85rem; }
.player-display-top { display: flex; align-items: flex-start; gap: 0.85rem; }

.player-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  font-size: 1.3rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.avatar-gk      { background: linear-gradient(135deg, var(--pos-gk),  #b45309); box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
.avatar-def     { background: linear-gradient(135deg, var(--pos-def), #1d4ed8); box-shadow: 0 4px 14px rgba(59,130,246,0.3); }
.avatar-mid     { background: linear-gradient(135deg, var(--pos-mid), #059669); box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
.avatar-fwd     { background: linear-gradient(135deg, var(--pos-fwd), #b91c1c); box-shadow: 0 4px 14px rgba(239,68,68,0.3); }
.avatar-unknown { background: var(--bg-surface-2); color: var(--text-muted); }

.player-display-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.player-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.player-display-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.saved-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--win);
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 999px;
  padding: 2px 7px;
  flex-shrink: 0;
}
.player-meta-row { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }

.pos-badge {
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.pos-badge--sm { font-size: 0.62rem; padding: 1px 5px; }
.pos-badge--gk      { background: var(--pos-gk-muted);  color: var(--pos-gk);  border: 1px solid var(--pos-gk); }
.pos-badge--def     { background: var(--pos-def-muted); color: var(--pos-def); border: 1px solid var(--pos-def); }
.pos-badge--mid     { background: var(--pos-mid-muted); color: var(--pos-mid); border: 1px solid var(--pos-mid); }
.pos-badge--fwd     { background: var(--pos-fwd-muted); color: var(--pos-fwd); border: 1px solid var(--pos-fwd); }
.pos-badge--unknown { background: var(--bg-surface-2);  color: var(--text-muted); border: 1px solid var(--border); }

/* ─── Pickers ─────────────────────────────────────────────────────────────────── */
.picker-section {
  border-top: 1px solid var(--border);
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.picker-search {
  width: 100%;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.5rem 0.85rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}
.picker-search::placeholder { color: var(--text-muted); }
.picker-search:focus { outline: none; border-color: var(--accent); }

.picker-loading {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

/* Team picker */
.team-picker-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.team-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}
@media (max-width: 480px) { .team-picker-grid { grid-template-columns: repeat(3, 1fr); } }
.picker-league-flag { font-size: 1.1rem; line-height: 1; flex-shrink: 0; }
.picker-club-flag   { font-size: 1rem;   line-height: 1; flex-shrink: 0; margin-left: auto; margin-right: 0.25rem; }

.picker-team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.4rem;
  background: var(--bg-surface-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.picker-team-card:hover { border-color: var(--accent); background: var(--bg-surface); }
.picker-team-card.selected { border-color: var(--accent); background: var(--accent-muted); }

.picker-crest {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.3));
}
.picker-crest-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #1d4ed8);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-team-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.picker-team-card.selected .picker-team-name { color: var(--accent-hover); }

.picker-team-league {
  font-size: 0.58rem;
  font-weight: 500;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Player picker list */
.player-picker-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.picker-club-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.picker-club-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.2rem;
  border-bottom: 1px solid var(--border);
}
.picker-club-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}
.picker-club-crest-letter {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-muted);
  color: var(--accent-hover);
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.picker-club-name {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.picker-club-count {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 6px;
}

.picker-club-players {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem;
}

.picker-player-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  background: var(--bg-surface-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  min-width: 0;
}
.picker-player-card:hover { border-color: var(--accent); background: var(--bg-surface); }
.picker-player-card.selected { border-color: var(--accent); background: var(--accent-muted); }

.picker-player-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.picker-player-name {
  flex: 1;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-check {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--accent-hover);
  flex-shrink: 0;
}

.picker-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ─── Full-width cards ────────────────────────────────────────────────────────── */
.full-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

/* ─── Results list ────────────────────────────────────────────────────────────── */
.results-list { display: flex; flex-direction: column; gap: 0.45rem; }

.result-row {
  display: grid;
  grid-template-columns: 26px 80px 1fr;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius);
  padding: 0.55rem 0.85rem;
}
.border-win  { border-left-color: var(--win); }
.border-lose { border-left-color: var(--lose); }
.border-draw { border-left-color: var(--draw); }

.result-badge {
  width: 20px; height: 20px;
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.result-badge--win  { background: var(--win); }
.result-badge--lose { background: var(--lose); }
.result-badge--draw { background: var(--draw); color: #0d1117; }

.result-date { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; }

.result-teams {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  min-width: 0;
}
.result-team {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-team--away { text-align: left; }
.result-team.our-team { color: var(--text-primary); font-weight: 800; }

.result-crest {
  width: 18px; height: 18px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
}

.result-score {
  font-size: 0.78rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  flex-shrink: 0;
  color: #fff;
}
.score-win  { background: var(--win); }
.score-lose { background: var(--lose); }
.score-draw { background: var(--draw); color: #0d1117; }

/* ─── Fixtures list ───────────────────────────────────────────────────────────── */
.fixtures-list { display: flex; flex-direction: column; gap: 0.45rem; }

.fixture-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.55rem 0.85rem;
}

.fixture-date-col { display: flex; flex-direction: column; gap: 0.1rem; }
.fixture-date { font-size: 0.74rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
.fixture-time { font-size: 0.68rem; color: var(--text-muted); }

.fixture-teams {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  min-width: 0;
}
.fixture-team {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fixture-team--away { text-align: left; }
.fixture-team.our-team { color: var(--accent-hover); font-weight: 800; }

.fixture-vs {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  flex-shrink: 0;
}

.fixture-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--accent-hover);
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}

@media (max-width: 520px) {
  /* Result rows: shrink date col, crests, fonts */
  .result-row {
    grid-template-columns: 22px 52px 1fr;
    gap: 0.45rem;
    padding: 0.5rem 0.65rem;
  }
  .result-date { font-size: 0.64rem; }
  .result-teams { gap: 0.3rem; }
  .result-team { font-size: 0.76rem; }
  .result-crest { width: 14px; height: 14px; }
  .result-score { font-size: 0.72rem; padding: 0.1rem 0.4rem; }

  /* Fixture rows: drop badge, shrink date col */
  .fixture-row {
    grid-template-columns: 52px 1fr;
    gap: 0.45rem;
    padding: 0.5rem 0.65rem;
  }
  .fixture-badge { display: none; }
  .fixture-date { font-size: 0.66rem; }
  .fixture-time { font-size: 0.6rem; }
  .fixture-team { font-size: 0.76rem; }
  .fixture-teams { gap: 0.3rem; }
}

/* ─── Shared ──────────────────────────────────────────────────────────────────── */
.btn-primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.no-fav { font-size: 0.875rem; color: var(--text-muted); font-style: italic; }

.success-msg { font-size: 0.82rem; color: var(--win); font-weight: 600; }
.error-msg   { font-size: 0.82rem; color: var(--lose); }

.loading-text { color: var(--text-muted); font-style: italic; font-size: 0.875rem; }

/* ─── Player league tabs ──────────────────────────────────────────────────────── */
.picker-league-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.4rem;
}

.picker-league-tab {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
}
.picker-league-tab:hover { border-color: var(--accent); color: var(--text-secondary); }
.picker-league-tab.active {
  border-color: var(--accent);
  background: var(--accent-muted);
  color: var(--accent-hover);
}

/* ─── Predictions ─────────────────────────────────────────────────────────── */
.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.pred-row {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
}

.pred-row--past {
  opacity: 0.85;
}

.pred-teams {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  min-width: 0;
}

.pred-side {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
}

.pred-side--right {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.pred-crest {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.pred-team-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.pred-team-name.our-team {
  color: var(--text-primary);
  font-weight: 600;
}

.pred-team-name--right {
  text-align: right;
}

.pred-score-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.pred-colon {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.score-stepper {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.15rem 0.4rem;
}

.step-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.2rem;
  transition: color 0.15s;
}
.step-btn:hover { color: var(--accent-hover); }

.step-val {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 1.2ch;
  text-align: center;
}

.pred-score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pred-actual-score {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.pred-vs-sep {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.pred-your-score {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.1rem 0.45rem;
}

.pred-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pred-date {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pred-save-btn {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  border: 1.5px solid var(--accent);
  background: none;
  color: var(--accent-hover);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pred-save-btn:hover:not(:disabled) { background: var(--accent-muted); }
.pred-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pred-save-btn--saved {
  background: var(--accent-muted);
  border-color: var(--accent-green);
  color: var(--accent-green-hover);
}

.pred-outcome {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}
.pred-outcome--exact  { background: rgba(16,185,129,0.15); color: var(--accent-green-hover); border: 1px solid var(--accent-green); }
.pred-outcome--correct { background: rgba(245,158,11,0.1); color: var(--accent-hover); border: 1px solid rgba(245,158,11,0.3); }
.pred-outcome--wrong  { background: rgba(239,68,68,0.1); color: var(--lose); border: 1px solid rgba(239,68,68,0.25); }

.pred-past-header {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0.5rem 0 0.6rem;
}

/* ─── Watchlist ───────────────────────────────────────────────────────────── */
.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.6rem;
}

.watchlist-card {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.15s;
}
.watchlist-card:hover { border-color: var(--accent); }

.watchlist-card-top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.player-avatar--sm {
  width: 34px;
  height: 34px;
  font-size: 0.85rem;
}

.watchlist-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.watchlist-player-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.watchlist-team-name {
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.watchlist-remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.1rem;
  flex-shrink: 0;
  transition: color 0.15s;
}
.watchlist-remove-btn:hover { color: var(--lose); }

.watchlist-card-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.watchlist-stat-strip {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.45rem 0.6rem;
}

.wl-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  flex: 1;
}

.wl-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.wl-val--fwd  { color: var(--pos-fwd); }
.wl-val--mid  { color: var(--pos-mid); }
.wl-val--win  { color: var(--win); }
.wl-val--lose { color: var(--lose); }

.wl-lbl {
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.wl-divider {
  width: 1px;
  height: 22px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 0.1rem;
}

.watchlist-stats-loading {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-style: italic;
}

.picker-player-card.already-watched {
  border-color: rgba(245,158,11,0.35);
  background: rgba(245,158,11,0.06);
}

.picker-watched-star {
  font-size: 0.75rem;
  color: var(--win);
  flex-shrink: 0;
}
</style>
