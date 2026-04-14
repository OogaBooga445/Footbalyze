const express = require('express');
const pool = require('./db');
const { getMatch } = require('./footballApi');
const { authenticate } = require('./auth');

const router = express.Router();

// GET /api/predictions
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT Match_ID, HomeGoals, AwayGoals, CreatedAt FROM predictions WHERE User_ID = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get predictions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// POST /api/predictions — upsert a prediction
router.post('/', authenticate, async (req, res) => {
  const { matchId, homeGoals, awayGoals } = req.body;
  if (matchId == null || homeGoals == null || awayGoals == null)
    return res.status(400).json({ error: 'matchId, homeGoals, awayGoals required' });
  const hg = parseInt(homeGoals, 10);
  const ag = parseInt(awayGoals, 10);
  if (!Number.isFinite(hg) || !Number.isFinite(ag) || hg < 0 || ag < 0 || hg > 20 || ag > 20)
    return res.status(400).json({ error: 'Goals must be integers 0-20' });
  try {
    await pool.query(
      `INSERT INTO predictions (User_ID, Match_ID, HomeGoals, AwayGoals)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE HomeGoals = VALUES(HomeGoals), AwayGoals = VALUES(AwayGoals)`,
      [req.user.id, matchId, hg, ag]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save prediction error:', err.message);
    res.status(500).json({ error: 'Failed to save prediction' });
  }
});

// GET /api/predictions/leaderboard — public
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.Username,
        COUNT(*) AS total,
        SUM(CASE WHEN p.Outcome = 'exact'   THEN 3
                 WHEN p.Outcome = 'correct' THEN 1
                 ELSE 0 END)            AS points,
        SUM(p.Outcome = 'exact')        AS exact_count,
        SUM(p.Outcome = 'correct')      AS correct_count,
        SUM(p.Outcome = 'wrong')        AS wrong_count
      FROM predictions p
      JOIN users u ON p.User_ID = u.User_ID
      WHERE p.Outcome IS NOT NULL
      GROUP BY p.User_ID, u.Username
      ORDER BY points DESC, exact_count DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ── Server-side outcome resolver ─────────────────────────────────────────────

async function resolveOutcomes() {
  let conn;
  try {
    conn = await pool.getConnection();

    // All predictions without an outcome yet
    const [unresolved] = await conn.query(
      'SELECT Prediction_ID, User_ID, Match_ID, HomeGoals, AwayGoals FROM predictions WHERE Outcome IS NULL'
    );
    if (!unresolved.length) return;

    // Deduplicate match IDs
    const matchIds = [...new Set(unresolved.map(p => p.Match_ID))];

    // Fetch each match from the API — space requests to respect 10 req/min rate limit
    const results = {};
    for (const id of matchIds) {
      try {
        const data = await getMatch(id);
        results[id] = data;
      } catch {
        // Match not available — skip
      }
      // Small delay to avoid burst rate-limiting
      await new Promise(r => setTimeout(r, 700));
    }

    // Compute and persist outcomes
    for (const pred of unresolved) {
      const match = results[pred.Match_ID];
      if (!match || match.status !== 'FINISHED') continue;

      const actualHome = match.score?.fullTime?.home;
      const actualAway = match.score?.fullTime?.away;
      if (actualHome == null || actualAway == null) continue;

      let outcome;
      if (pred.HomeGoals === actualHome && pred.AwayGoals === actualAway) {
        outcome = 'exact';
      } else {
        const predResult = Math.sign(pred.HomeGoals - pred.AwayGoals);
        const actualResult = Math.sign(actualHome - actualAway);
        outcome = predResult === actualResult ? 'correct' : 'wrong';
      }

      await conn.query(
        'UPDATE predictions SET Outcome = ? WHERE Prediction_ID = ?',
        [outcome, pred.Prediction_ID]
      );
    }
  } catch (err) {
    console.error('resolveOutcomes error:', err.message);
  } finally {
    if (conn) conn.release();
  }
}


module.exports = { router, resolveOutcomes };
