const express = require('express');
const pool = require('./db');
const { authenticate } = require('./auth');

const router = express.Router();

// GET /api/favourites
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT Team_ID, Player_ID FROM favourites WHERE User_ID = ? LIMIT 1',
      [req.user.id]
    );
    const fav = rows[0] || {};
    res.json({ team: fav.Team_ID || null, player: fav.Player_ID || null });
  } catch (err) {
    console.error('Fetch favourites error:', err.message);
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

// POST /api/favourites/team
router.post('/team', authenticate, async (req, res) => {
  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });
  try {
    await pool.query(
      'INSERT INTO favourites (User_ID, Team_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE Team_ID = VALUES(Team_ID)',
      [req.user.id, teamId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save team error:', err.message);
    res.status(500).json({ error: 'Failed to update favourite team' });
  }
});

// POST /api/favourites/player
router.post('/player', authenticate, async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  try {
    await pool.query(
      'INSERT INTO favourites (User_ID, Player_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE Player_ID = VALUES(Player_ID)',
      [req.user.id, playerId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save player error:', err.message);
    res.status(500).json({ error: 'Failed to update favourite player' });
  }
});

module.exports = router;
