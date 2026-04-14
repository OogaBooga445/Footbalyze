const express = require('express');
const sanitizeHtml = require('sanitize-html');
const pool = require('./db');
const { authenticate } = require('./auth');

const router = express.Router();

// GET /api/comments/counts?matchIds=1,2,3
router.get('/counts', async (req, res) => {
  const ids = (req.query.matchIds || '').split(',').map(n => parseInt(n, 10)).filter(Boolean);
  if (!ids.length) return res.json({});
  try {
    const [rows] = await pool.query(
      `SELECT Match_ID, COUNT(*) AS cnt FROM comments WHERE Match_ID IN (${ids.map(() => '?').join(',')}) GROUP BY Match_ID`,
      ids
    );
    const result = {};
    for (const r of rows) result[r.Match_ID] = r.cnt;
    res.json(result);
  } catch (err) {
    console.error('Comment counts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

// GET /api/comments?matchId=X
router.get('/', async (req, res) => {
  const matchId = parseInt(req.query.matchId, 10);
  if (!matchId) return res.status(400).json({ error: 'matchId required' });
  try {
    const [rows] = await pool.query(
      'SELECT Comment_ID, User_ID, Username, Content, CreatedAt FROM comments WHERE Match_ID = ? ORDER BY CreatedAt ASC',
      [matchId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get comments error:', err.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments
router.post('/', authenticate, async (req, res) => {
  const { matchId, content } = req.body;
  if (!matchId || !content?.trim()) return res.status(400).json({ error: 'matchId and content required' });
  const clean = sanitizeHtml(content.trim(), { allowedTags: [], allowedAttributes: {} }); // strip all HTML tags to prevent XSS
  if (!clean) return res.status(400).json({ error: 'Comment content is empty after sanitization' });
  if (clean.length > 500) return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (User_ID, Username, Match_ID, Content) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.username, matchId, clean]
    );
    res.status(201).json({
      Comment_ID: result.insertId,
      User_ID: req.user.id,
      Username: req.user.username,
      Match_ID: matchId,
      Content: clean,
      CreatedAt: new Date(),
    });
  } catch (err) {
    console.error('Post comment error:', err.message);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// POST /api/comments/:id/report
router.post('/:id/report', authenticate, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.query('SELECT User_ID FROM comments WHERE Comment_ID = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].User_ID === req.user.id) return res.status(400).json({ error: 'Cannot report your own comment' });
    await pool.query(
      'INSERT IGNORE INTO comment_reports (Comment_ID, Reporter_ID) VALUES (?, ?)',
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Report comment error:', err.message);
    res.status(500).json({ error: 'Failed to report comment' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.query('SELECT User_ID FROM comments WHERE Comment_ID = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].User_ID !== req.user.id && req.user.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM comment_reports WHERE Comment_ID = ?', [id]);
    await pool.query('DELETE FROM comments WHERE Comment_ID = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete comment error:', err.message);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
