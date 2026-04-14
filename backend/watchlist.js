const express = require('express');
const pool = require('./db');
const { authenticate } = require('./auth');

const router = express.Router();

// GET /api/watchlist
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT Player_ID, Player_Name, Team_ID, Team_Name, Position, DetailedPosition, Nationality, LeagueCode FROM watchlist WHERE User_ID = ? ORDER BY CreatedAt DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Watchlist fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/watchlist
router.post('/', authenticate, async (req, res) => {
  const { playerId, playerName, teamId, teamName, position, detailedPosition, nationality, leagueCode } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  try {
    await pool.query(
      `INSERT INTO watchlist (User_ID, Player_ID, Player_Name, Team_ID, Team_Name, Position, DetailedPosition, Nationality, LeagueCode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         Player_Name = VALUES(Player_Name),
         Team_Name   = VALUES(Team_Name),
         Position    = VALUES(Position),
         DetailedPosition = VALUES(DetailedPosition),
         Nationality = VALUES(Nationality),
         LeagueCode  = VALUES(LeagueCode)`,
      [req.user.id, playerId, playerName || null, teamId || null, teamName || null,
       position || null, detailedPosition || null, nationality || null, leagueCode || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Watchlist add error:', err.message);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /api/watchlist/:playerId
router.delete('/:playerId', authenticate, async (req, res) => {
  const playerId = parseInt(req.params.playerId, 10);
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  try {
    await pool.query('DELETE FROM watchlist WHERE User_ID = ? AND Player_ID = ?', [req.user.id, playerId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Watchlist remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;
