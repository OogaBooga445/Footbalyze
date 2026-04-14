const express = require('express');
const pool = require('./db');
const { authenticate, requireAdmin } = require('./auth');

const router = express.Router();

const guard = [authenticate, requireAdmin];

// ── USERS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', guard, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT User_ID, Username, Email, Role, banned FROM users ORDER BY User_ID ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', guard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be "user" or "admin"' });
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot change your own role' });
  try {
    await pool.query('UPDATE users SET Role = ? WHERE User_ID = ?', [role, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin role update error:', err.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', guard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });
  const { banned } = req.body;
  try {
    await pool.query('UPDATE users SET banned = ? WHERE User_ID = ?', [banned ? 1 : 0, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin ban error:', err.message);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', guard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    await pool.query('DELETE FROM predictions WHERE User_ID = ?', [id]);
    await pool.query('DELETE FROM comment_reports WHERE Reporter_ID = ?', [id]);
    await pool.query('DELETE FROM comments WHERE User_ID = ?', [id]);
    await pool.query('DELETE FROM watchlist WHERE User_ID = ?', [id]);
    await pool.query('DELETE FROM favourites WHERE User_ID = ?', [id]);
    await pool.query('DELETE FROM users WHERE User_ID = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────

// GET /api/admin/reports
router.get('/reports', guard, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.Comment_ID, c.Username, c.Content, c.Match_ID, c.CreatedAt,
        COUNT(r.Report_ID) AS report_count
      FROM comments c
      JOIN comment_reports r ON r.Comment_ID = c.Comment_ID
      GROUP BY c.Comment_ID
      ORDER BY report_count DESC, c.CreatedAt DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin reports error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// DELETE /api/admin/reports/:commentId  (dismiss — clears reports without deleting comment)
router.delete('/reports/:commentId', guard, async (req, res) => {
  const id = parseInt(req.params.commentId, 10);
  try {
    await pool.query('DELETE FROM comment_reports WHERE Comment_ID = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin dismiss report error:', err.message);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
});


module.exports = router;
