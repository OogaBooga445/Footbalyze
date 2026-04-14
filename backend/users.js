const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pool = require('./db');
const { authenticate } = require('./auth');
const { validatePassword } = require('./validators');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// ── Avatar upload ─────────────────────────────────────────────────────────────

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
});

// GET /api/user/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT avatar_url FROM users WHERE User_ID = ?', [req.user.id]);
    res.json({ avatarUrl: rows[0]?.avatar_url || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/avatar
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query('UPDATE users SET avatar_url = ? WHERE User_ID = ?', [avatarUrl, req.user.id]);
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err.message);
    res.status(500).json({ message: 'Failed to save avatar' });
  }
});

// PUT /api/user/settings
router.put('/settings', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { username, currentPassword, newPassword } = req.body;
  if (!currentPassword) return res.status(400).json({ field: 'currentPassword', message: 'Current password is required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE User_ID = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const hash = user.password_hash;
    const valid = await bcrypt.compare(currentPassword, hash);
    if (!valid) return res.status(400).json({ field: 'currentPassword', message: 'Current password is incorrect.' });

    if (username && username !== user.Username) {
      if (username.length < 3 || username.length > 20)
        return res.status(400).json({ field: 'username', message: 'Username must be 3–20 characters.' });
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res.status(400).json({ field: 'username', message: 'Username can only contain letters, numbers, and underscores.' });
      const [taken] = await pool.query('SELECT User_ID FROM users WHERE Username = ? AND User_ID != ?', [username, userId]);
      if (taken.length) return res.status(400).json({ field: 'username', message: 'Username already taken.' });
    }

    const newUsername = username || user.Username;
    let newHash = hash;

    if (newPassword) {
      const pwErr = validatePassword(newPassword, 'newPassword');
      if (pwErr) return res.status(400).json(pwErr);
      newHash = await bcrypt.hash(newPassword, 10);
    }

    await pool.query(
      'UPDATE users SET Username = ?, Email = ?, password_hash = ? WHERE User_ID = ?',
      [newUsername, user.Email, newHash, userId]
    );

    const token = jwt.sign(
      { id: userId, username: newUsername, role: user.Role?.trim() },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: userId, username: newUsername, email: user.Email, role: user.Role?.trim() },
    });
  } catch (err) {
    console.error('Settings update error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
