const express = require('express');
const fdApi = require('./footballApi');

const router = express.Router();
const SEASON = parseInt(process.env.CURRENT_SEASON, 10) || 2025;

// ── Constants ─────────────────────────────────────────────────────────────────

const DOMESTIC_LEAGUES = new Set(['PL', 'PD', 'BL1', 'SA', 'FL1', 'ELC', 'PPL', 'DED', 'BSA']);
const SUPPORTED_LEAGUES = new Set(['PL', 'PD', 'BL1', 'SA', 'FL1', 'ELC', 'PPL', 'DED', 'BSA', 'CL']);
const LEAGUE_NAMES = {
  PL: 'Premier League', PD: 'La Liga', BL1: 'Bundesliga', SA: 'Serie A',
  FL1: 'Ligue 1', ELC: 'Championship', PPL: 'Primeira Liga', DED: 'Eredivisie',
  BSA: 'Brasileirão', CL: 'Champions League',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Maps fine-grained API position strings to display labels.
const DETAILED_POSITION_MAP = {
  'goalkeeper':          'Goalkeeper',
  'centre-back':         'Centre-Back',
  'left-back':           'Left-Back',
  'right-back':          'Right-Back',
  'wing-back':           'Wing-Back',
  'defensive midfield':  'Defensive Mid',
  'central midfield':    'Central Mid',
  'attacking midfield':  'Attacking Mid',
  'left winger':         'Left Winger',
  'right winger':        'Right Winger',
  'centre-forward':      'Centre-Forward',
  'striker':             'Striker',
  'defence':             'Defender',
  'midfield':            'Midfielder',
  'offence':             'Forward',
  'offense':             'Forward',
};

// Maps detailed labels to broad categories used for filtering/sorting.
const BROAD_CATEGORY = {
  'Goalkeeper':    'Goalkeeper',
  'Centre-Back':   'Defender',
  'Left-Back':     'Defender',
  'Right-Back':    'Defender',
  'Wing-Back':     'Defender',
  'Defensive Mid': 'Midfielder',
  'Central Mid':   'Midfielder',
  'Attacking Mid': 'Midfielder',
  'Left Winger':   'Forward',
  'Right Winger':  'Forward',
  'Centre-Forward':'Forward',
  'Striker':       'Forward',
  'Defender':      'Defender',
  'Midfielder':    'Midfielder',
  'Forward':       'Forward',
};

function detailedPosition(pos) {
  if (!pos || pos === 'null') return null;
  return DETAILED_POSITION_MAP[pos.toLowerCase()] || null;
}

function mapPosition(pos) {
  if (!pos || pos === 'null') return 'Unknown';
  const detailed = detailedPosition(pos);
  if (detailed && BROAD_CATEGORY[detailed]) return BROAD_CATEGORY[detailed];
  // Fallback keyword matching for non-standard API values
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper')) return 'Goalkeeper';
  if (p.includes('back') || p.includes('defender') || p.includes('defence') || p.includes('defense')) return 'Defender';
  if (p.includes('midfield')) return 'Midfielder';
  if (p.includes('winger') || p.includes('forward') || p.includes('striker') || p.includes('attacking') || p.includes('attacker') || p.includes('offence') || p.includes('offense')) return 'Forward';
  return 'Unknown';
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function splitName(fullName) {
  if (!fullName) return { Name: 'Unknown', Surname: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { Name: parts[0], Surname: '' };
  const Surname = parts[parts.length - 1];
  const Name = parts.slice(0, -1).join(' ');
  return { Name, Surname };
}

function normalizeTeam(t) {
  return {
    Team_ID: t.id,
    Team_Name: t.name,
    Crest: t.crest || null,
    Coach_name: t.coach?.name || null,
    Coach_nationality: t.coach?.nationality || null,
    Country: t.area?.name || 'England',
  };
}

function normalizeMatch(m) {
  const ft = m.score?.fullTime;
  const Score = (ft && ft.home != null && ft.away != null) ? `${ft.home}-${ft.away}` : null;
  return {
    Match_ID:   m.id,
    MatchDate:  m.utcDate,
    Status:     m.status,
    Matchday:   m.matchday ?? null,
    Stage:      m.stage    ?? null,
    Score,
    HomeTeam:   m.homeTeam?.name,
    HomeTeamID: m.homeTeam?.id,
    HomeCrest:  m.homeTeam?.crest || null,
    AwayTeam:   m.awayTeam?.name,
    AwayTeamID: m.awayTeam?.id,
    AwayCrest:  m.awayTeam?.crest || null,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/leagues', (req, res) => {
  res.json(fdApi.getCompetitions());
});

router.get('/leagues/:code/standings', async (req, res) => {
  try {
    const data = await fdApi.getStandings(req.params.code);
    res.json(data);
  } catch (err) {
    console.error('Standings error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Failed to fetch standings' });
  }
});

router.get('/leagues/:code/matches', async (req, res) => {
  try {
    const data = await fdApi.getMatches(req.params.code, { season: req.query.season });
    res.json(data);
  } catch (err) {
    console.error('Matches error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Failed to fetch matches' });
  }
});

router.get('/leagues/:code/teams', async (req, res) => {
  try {
    const data = await fdApi.getTeams(req.params.code);
    res.json(data);
  } catch (err) {
    console.error('Teams error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Failed to fetch teams' });
  }
});

router.get('/leagues/:code/scorers', async (req, res) => {
  try {
    const data = await fdApi.getScorers(req.params.code);
    res.json(data);
  } catch (err) {
    console.error('Scorers error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Failed to fetch scorers' });
  }
});

router.get('/teams', async (req, res) => {
  try {
    const data = await fdApi.getTeams('PL');
    res.json((data.teams || []).map(normalizeTeam));
  } catch (err) {
    console.error('Teams error:', err.message);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/teams/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const teamData = await fdApi.getTeamDetail(id);
    const comps = teamData.runningCompetitions || [];
    const leagueCode = (comps.find(c => DOMESTIC_LEAGUES.has(c.code)) || comps.find(c => SUPPORTED_LEAGUES.has(c.code)))?.code || 'PL';

    const [matchData, standingsData] = await Promise.all([
      fdApi.getMatches(leagueCode, { season: SEASON }),
      fdApi.getStandings(leagueCode).catch(() => null),
    ]);

    const team = normalizeTeam(teamData);
    const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
    const players = (teamData.squad || [])
      .map(p => {
        const { Name, Surname } = splitName(p.name);
        return {
          Player_ID: p.id,
          Name, Surname,
          Position: mapPosition(p.position),
          DetailedPosition: detailedPosition(p.position),
          Nationality: p.nationality || null,
          Age: calcAge(p.dateOfBirth),
          Team_ID: id,
        };
      })
      .filter(p => p.Position !== 'Unknown')
      .sort((a, b) => posOrder.indexOf(a.Position) - posOrder.indexOf(b.Position));

    const recentMatches = (matchData.matches || [])
      .filter(m => m.status === 'FINISHED' && (m.homeTeam?.id === id || m.awayTeam?.id === id))
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5)
      .map(normalizeMatch);

    let tableRow = null;
    if (standingsData) {
      const total = (standingsData.standings || []).find(s => s.type === 'TOTAL');
      const row = total?.table?.find(r => r.team.id === id);
      if (row) tableRow = {
        Position: row.position,
        P: row.playedGames, W: row.won, D: row.draw, L: row.lost,
        GF: row.goalsFor, GA: row.goalsAgainst, GD: row.goalDifference, Pts: row.points,
      };
    }

    res.json({ ...team, players, recentMatches, leagueCode, leagueName: LEAGUE_NAMES[leagueCode] || leagueCode, tableRow });
  } catch (err) {
    console.error('Team detail error:', err.response?.status, err.message);
    if (err.response?.status === 404) return res.status(404).json({ error: 'Team not found' });
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

router.get('/fd/teams/:id', async (req, res) => {
  try {
    const data = await fdApi.getTeamDetail(req.params.id);
    res.json(data);
  } catch (err) {
    console.error('Team detail error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Failed to fetch team' });
  }
});

router.get('/players', async (req, res) => {
  const code = req.query.code || 'PL';
  try {
    const data = await fdApi.getTeams(code);
    const players = [];
    for (const t of (data.teams || [])) {
      for (const p of (t.squad || [])) {
        const { Name, Surname } = splitName(p.name);
        players.push({
          Player_ID: p.id,
          Name, Surname,
          Position: mapPosition(p.position),
          DetailedPosition: detailedPosition(p.position),
          Age: calcAge(p.dateOfBirth),
          Nationality: p.nationality || null,
          Team_ID: t.id,
          Team_Name: t.name,
        });
      }
    }
    res.json(players.filter(p => p.Position !== 'Unknown'));
  } catch (err) {
    console.error('Players error:', err.message);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

router.get('/players/:id/profile', async (req, res) => {
  const playerId = parseInt(req.params.id, 10);
  const teamId   = parseInt(req.query.teamId, 10);
  const code     = req.query.code || 'PL';
  if (!teamId) return res.status(400).json({ error: 'teamId required' });
  try {
    const [teamData, matchData] = await Promise.all([
      fdApi.getTeamDetail(teamId),
      fdApi.getMatches(code, { season: SEASON }),
    ]);

    const rawPlayer = (teamData.squad || []).find(p => p.id === playerId);
    if (!rawPlayer) return res.status(404).json({ error: 'Player not found in squad' });

    const position = mapPosition(rawPlayer.position);
    if (position === 'Unknown') return res.status(404).json({ error: 'Player position unknown' });

    const { Name, Surname } = splitName(rawPlayer.name);
    const teamMatches = (matchData.matches || []).filter(m =>
      m.status === 'FINISHED' && (m.homeTeam.id === teamId || m.awayTeam.id === teamId)
    );

    let stats = {};
    if (position === 'Goalkeeper') {
      let cleanSheets = 0, conceded = 0;
      for (const m of teamMatches) {
        const ft = m.score?.fullTime;
        if (ft == null || ft.home == null || ft.away == null) continue;
        const ga = m.homeTeam.id === teamId ? ft.away : ft.home;
        conceded += ga;
        if (ga === 0) cleanSheets++;
      }
      stats = { cleanSheets, conceded, played: teamMatches.length };
    } else {
      const scorersData = await fdApi.getScorers(code, 100);
      const entry = (scorersData.scorers || []).find(s => s.player.id === playerId);
      stats = {
        goals: entry?.goals ?? 0,
        assists: entry?.assists ?? 0,
        penalties: entry?.penalties ?? 0,
        playedMatches: entry?.playedMatches ?? 0,
      };
    }

    const recentMatches = [...teamMatches]
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5)
      .map(normalizeMatch);

    res.json({
      Player_ID: playerId,
      Name, Surname,
      FullName:         rawPlayer.name,
      Position:         position,
      DetailedPosition: detailedPosition(rawPlayer.position),
      Nationality:      rawPlayer.nationality || null,
      Age:              calcAge(rawPlayer.dateOfBirth),
      Team_ID:          teamId,
      Team_Name:        teamData.name,
      Team_Crest:       teamData.crest || null,
      leagueCode:       code,
      stats,
      recentMatches,
    });
  } catch (err) {
    console.error('Player profile error:', err.response?.status, err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch player profile' });
  }
});

router.get('/players/stats/bulk', async (req, res) => {
  let players;
  try {
    players = JSON.parse(req.query.players);
  } catch {
    return res.status(400).json({ error: 'Invalid players param' });
  }

  const byLeague = {};
  for (const p of players) {
    if (!byLeague[p.code]) byLeague[p.code] = [];
    byLeague[p.code].push(p);
  }

  const result = {};

  await Promise.all(
    Object.entries(byLeague).map(async ([code, leaguePlayers]) => {
      const gks = leaguePlayers.filter(p => p.position === 'goalkeeper');
      const outfield = leaguePlayers.filter(p => p.position !== 'goalkeeper');

      if (outfield.length) {
        try {
          const data = await fdApi.getScorers(code, 400);
          const scorers = data.scorers || [];
          for (const p of outfield) {
            const entry = scorers.find(s => s.player.id === p.id);
            result[p.id] = {
              goals: entry?.goals ?? null,
              assists: entry?.assists ?? null,
              penalties: entry?.penalties ?? null,
              playedMatches: entry?.playedMatches ?? null,
            };
          }
        } catch {
          for (const p of outfield) {
            result[p.id] = { goals: null, assists: null, penalties: null, playedMatches: null };
          }
        }
      }

      if (gks.length) {
        try {
          const matchData = await fdApi.getMatches(code, { season: SEASON });
          const matches = matchData.matches || [];
          for (const p of gks) {
            const teamMatches = matches.filter(m =>
              m.status === 'FINISHED' && (m.homeTeam.id === p.teamId || m.awayTeam.id === p.teamId)
            );
            let cleanSheets = 0, conceded = 0;
            for (const m of teamMatches) {
              const ft = m.score?.fullTime;
              if (!ft || ft.home == null || ft.away == null) continue;
              const ga = m.homeTeam.id === p.teamId ? ft.away : ft.home;
              conceded += ga;
              if (ga === 0) cleanSheets++;
            }
            result[p.id] = { cleanSheets, conceded, played: teamMatches.length };
          }
        } catch {
          for (const p of gks) {
            result[p.id] = { cleanSheets: 0, conceded: 0, played: 0 };
          }
        }
      }
    })
  );

  res.json(result);
});

router.get('/players/:id/stats', async (req, res) => {
  const playerId = parseInt(req.params.id, 10);
  const code = req.query.code || 'PL';
  const position = (req.query.position || '').toLowerCase();
  try {
    if (position === 'goalkeeper') {
      const teamId = parseInt(req.query.teamId, 10);
      const data = await fdApi.getMatches(code, { season: SEASON });
      const matches = (data.matches || []).filter(m =>
        m.status === 'FINISHED' && (m.homeTeam.id === teamId || m.awayTeam.id === teamId)
      );
      let cleanSheets = 0, conceded = 0;
      for (const m of matches) {
        const ft = m.score?.fullTime;
        if (ft == null || ft.home == null || ft.away == null) continue;
        const goalsAgainst = m.homeTeam.id === teamId ? ft.away : ft.home;
        conceded += goalsAgainst;
        if (goalsAgainst === 0) cleanSheets++;
      }
      return res.json({ cleanSheets, conceded, played: matches.length });
    }
    const data = await fdApi.getScorers(code, 100);
    const entry = (data.scorers || []).find(s => s.player.id === playerId);
    res.json({
      goals: entry?.goals ?? 0,
      assists: entry?.assists ?? 0,
      penalties: entry?.penalties ?? 0,
      playedMatches: entry?.playedMatches ?? null,
    });
  } catch (err) {
    console.error('Player stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

router.get('/matches', async (req, res) => {
  const code     = req.query.code   || 'PL';
  const upcoming = req.query.status === 'upcoming';
  try {
    const data = await fdApi.getMatches(code, { season: SEASON });
    const matches = (data.matches || [])
      .filter(m => upcoming
        ? (m.status === 'SCHEDULED' || m.status === 'TIMED')
        : m.status === 'FINISHED')
      .map(normalizeMatch);
    res.json(matches);
  } catch (err) {
    console.error('Matches error:', err.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/h2h', async (req, res) => {
  const code    = req.query.code || 'PL';
  const team1Id = parseInt(req.query.team1Id, 10);
  const team2Id = parseInt(req.query.team2Id, 10);
  if (!team1Id || !team2Id) return res.status(400).json({ error: 'team1Id and team2Id required' });
  try {
    const data = await fdApi.getMatches(code, { season: SEASON });
    const meetings = (data.matches || []).filter(m =>
      m.status === 'FINISHED' &&
      ((m.homeTeam.id === team1Id && m.awayTeam.id === team2Id) ||
       (m.homeTeam.id === team2Id && m.awayTeam.id === team1Id))
    ).sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

    let team1Wins = 0, team2Wins = 0, draws = 0, team1Goals = 0, team2Goals = 0;
    for (const m of meetings) {
      const ft = m.score?.fullTime;
      if (!ft || ft.home == null) continue;
      const isTeam1Home = m.homeTeam.id === team1Id;
      const t1g = isTeam1Home ? ft.home : ft.away;
      const t2g = isTeam1Home ? ft.away : ft.home;
      team1Goals += t1g;
      team2Goals += t2g;
      if (t1g > t2g) team1Wins++;
      else if (t2g > t1g) team2Wins++;
      else draws++;
    }

    res.json({
      meetings: meetings.map(normalizeMatch),
      record: { team1Wins, team2Wins, draws, team1Goals, team2Goals },
    });
  } catch (err) {
    console.error('H2H error:', err.message);
    res.status(500).json({ error: 'Failed to fetch head-to-head data' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [teamsData, matchData] = await Promise.all([
      fdApi.getTeams('PL'),
      fdApi.getMatches('PL', { season: SEASON }),
    ]);
    const teams = teamsData.teams?.length || 0;
    const players = (teamsData.teams || []).reduce((sum, t) => sum + (t.squad?.length || 0), 0);
    const matches = (matchData.matches || []).filter(m => m.status === 'FINISHED').length;
    res.json({ teams, players, matches });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/all-teams', async (req, res) => {
  const codes = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'ELC', 'PPL', 'DED', 'BSA'];
  const settled = await Promise.allSettled(codes.map(code => fdApi.getTeams(code).then(data => ({ code, data }))));
  const results = [];
  for (const outcome of settled) {
    if (outcome.status === 'rejected') { console.error('teams/all:', outcome.reason?.message); continue; }
    const { code, data } = outcome.value;
    for (const t of (data.teams || [])) {
      results.push({ ...normalizeTeam(t), leagueCode: code, leagueName: LEAGUE_NAMES[code] || code });
    }
  }
  const seen = new Set();
  res.json(results.filter(t => { if (seen.has(t.Team_ID)) return false; seen.add(t.Team_ID); return true; }));
});

module.exports = router;
