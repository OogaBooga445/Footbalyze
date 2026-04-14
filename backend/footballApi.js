const axios = require('axios');

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY;

// Simple in-memory cache — { key: { data, expiresAt } }
const cache = {};
// In-flight deduplication — prevents simultaneous cold-cache requests from hitting the API twice
const inflight = {};

function cached(key, ttlMs, fetcher) {
  const now = Date.now();
  if (cache[key] && cache[key].expiresAt > now) {
    return Promise.resolve(cache[key].data);
  }
  if (inflight[key]) return inflight[key];
  inflight[key] = fetcher().then(data => {
    cache[key] = { data, expiresAt: now + ttlMs };
    delete inflight[key];
    return data;
  }).catch(err => {
    delete inflight[key];
    throw err;
  });
  return inflight[key];
}

const http = axios.create({
  baseURL: BASE,
  headers: { 'X-Auth-Token': KEY },
});

const MIN  = 60_000;
const HOUR = 60 * MIN;
const DAY  = 24 * HOUR;

// Available competitions on the free tier
const COMPETITIONS = [
  { code: 'PL',  name: 'Premier League',       country: 'England',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',              country: 'Spain',    flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',           country: 'Germany',  flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',              country: 'Italy',    flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1',              country: 'France',   flag: '🇫🇷' },
  { code: 'ELC', name: 'Championship',         country: 'England',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PPL', name: 'Primeira Liga',        country: 'Portugal', flag: '🇵🇹' },
  { code: 'DED', name: 'Eredivisie',           country: 'Netherlands', flag: '🇳🇱' },
  { code: 'BSA', name: 'Brasileirão Série A',  country: 'Brazil',   flag: '🇧🇷' },
  { code: 'CL',  name: 'UEFA Champions League',country: 'Europe',   flag: '🏆' },
];

function getCompetitions() {
  return COMPETITIONS;
}

function getStandings(code) {
  return cached(`standings:${code}`, 6 * HOUR, async () => { // 6h: standings only change after each round
    const res = await http.get(`/competitions/${code}/standings`);
    return res.data;
  });
}

function getMatches(code, options = {}) {
  const params = {};
  if (options.season) params.season = options.season;
  if (options.status) params.status = options.status;
  const cacheKey = `matches:${code}:${JSON.stringify(params)}`;
  return cached(cacheKey, 30 * MIN, async () => { // 30min: match statuses update frequently on matchdays
    const res = await http.get(`/competitions/${code}/matches`, { params });
    return res.data;
  });
}

function getTeams(code) {
  return cached(`teams:${code}`, DAY, async () => { // 1 day: squad data rarely changes mid-season
    const res = await http.get(`/competitions/${code}/teams`);
    return res.data;
  });
}

function getScorers(code, limit = 50) {
  return cached(`scorers:${code}:${limit}`, 6 * HOUR, async () => { // 6h: scorer tables update after each round
    const res = await http.get(`/competitions/${code}/scorers`, { params: { limit } });
    return res.data;
  });
}

function getTeamDetail(teamId) {
  return cached(`team:${teamId}`, DAY, async () => { // 1 day: team/squad detail rarely changes
    const res = await http.get(`/teams/${teamId}`);
    return res.data;
  });
}

function getMatch(matchId) {
  return cached(`match:${matchId}`, 5 * MIN, async () => { // 5min: needs fresh status for outcome resolution
    const res = await http.get(`/matches/${matchId}`);
    return res.data;
  });
}

module.exports = { getCompetitions, getStandings, getMatches, getTeams, getScorers, getTeamDetail, getMatch };
