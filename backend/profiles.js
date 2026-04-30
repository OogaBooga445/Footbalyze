const express = require('express');
const pool = require('./db');

const router = express.Router();

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [users] = await pool.query(
      'SELECT User_ID, Username, avatar_url FROM users WHERE Username = ?',
      [username]
    );
    if (!users.length) return res.status(404).json({ error: 'User not found' });

    const user = users[0];

    const [[favRows], [watchlist]] = await Promise.all([
      pool.query(
        'SELECT Team_ID, Player_ID, Player_Name, Player_Team_ID, Player_Team_Name, Position, DetailedPosition, Nationality, LeagueCode FROM favourites WHERE User_ID = ? LIMIT 1',
        [user.User_ID]
      ),
      pool.query(
        'SELECT Player_ID, Player_Name, Team_ID, Team_Name, Position, DetailedPosition, Nationality, LeagueCode FROM watchlist WHERE User_ID = ? ORDER BY CreatedAt DESC',
        [user.User_ID]
      ),
    ]);

    const fav = favRows[0] || {};
    const favTeamId = fav.Team_ID || null;
    const favPlayerId = fav.Player_ID || null;

    let favPlayerMeta = null;
    if (favPlayerId) {
      if (fav.Player_Name) {
        // Metadata stored at save time — use it directly
        favPlayerMeta = {
          Player_ID: favPlayerId,
          Player_Name: fav.Player_Name,
          Team_ID: fav.Player_Team_ID,
          Team_Name: fav.Player_Team_Name,
          Position: fav.Position,
          DetailedPosition: fav.DetailedPosition,
          Nationality: fav.Nationality,
          LeagueCode: fav.LeagueCode,
        };
      } else {
        // Fallback for existing rows: check this user's watchlist first,
        // then any other user's watchlist entry for the same player
        const ownEntry = watchlist.find(w => w.Player_ID === favPlayerId);
        if (ownEntry) {
          favPlayerMeta = ownEntry;
        } else {
          const [anyRows] = await pool.query(
            'SELECT Player_ID, Player_Name, Team_ID AS Team_ID, Team_Name, Position, DetailedPosition, Nationality, LeagueCode FROM watchlist WHERE Player_ID = ? LIMIT 1',
            [favPlayerId]
          );
          favPlayerMeta = anyRows[0] || null;
        }
      }
    }

    res.json({
      username: user.Username,
      avatarUrl: user.avatar_url || null,
      favTeamId,
      favPlayerId,
      favPlayerMeta,
      watchlist,
    });
  } catch (err) {
    console.error('Public profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
