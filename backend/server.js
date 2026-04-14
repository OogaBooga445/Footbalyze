require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./db');
const { validatePassword } = require('./validators');
const footballRouter = require('./football');
const usersRouter = require('./users');
const favouritesRouter = require('./favourites');
const { router: predictionsRouter, resolveOutcomes } = require('./predictions');
const watchlistRouter = require('./watchlist');
const adminRouter = require('./admin');
const commentsRouter = require('./comments');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET environment variable is not set');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  const role = 'user';

  if (!username || !email || !password)
    return res.status(400).json({ field: null, message: 'All fields are required.' });
  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ field: 'username', message: 'Username must be between 3 and 20 characters.' });
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return res.status(400).json({ field: 'username', message: 'Username can only contain letters, numbers, and underscores.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ field: 'email', message: 'Please enter a valid email address.' });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json(pwErr);

  try {
    const [existing] = await pool.query(
      'SELECT Username, Email FROM users WHERE Username = ? OR Email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      const taken = existing[0];
      if (taken.Username === username)
        return res.status(409).json({ field: 'username', message: 'That username is already taken.' });
      return res.status(409).json({ field: 'email', message: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (Username, Email, Password, password_hash, Role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, hashedPassword, role] // Password kept for schema NOT NULL constraint; password_hash is the authoritative column
    );

    res.status(201).json({ id: result.insertId, username, email, role });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ field: null, message: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE Email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'No account found with that email.' });

    const hash = user.password_hash;

    const match = await bcrypt.compare(password, hash);
    if (!match) return res.status(401).json({ message: 'Incorrect password.' });

    if (user.banned) return res.status(403).json({ message: 'Your account has been banned.' });

    const token = jwt.sign(
      { id: user.User_ID, username: user.Username, role: user.Role?.trim() },
      SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.User_ID, username: user.Username, email: user.Email, role: user.Role?.trim() },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────

app.use('/api', footballRouter);
app.use('/api/user', usersRouter);
app.use('/api/favourites', favouritesRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/admin', adminRouter);
app.use('/api/comments', commentsRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Startup migrations ────────────────────────────────────────────────────────
// These are safe no-ops if the DB was set up from bombo.sql.

async function runMigrations() {
  const run = async (sql, label) => {
    try { await pool.query(sql); }
    catch (err) { if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_TABLE_EXISTS_ERROR') console.error(`Migration [${label}]:`, err.message); }
  };

  await run(`CREATE TABLE IF NOT EXISTS watchlist (
    Watchlist_ID INT AUTO_INCREMENT PRIMARY KEY, User_ID INT NOT NULL, Player_ID INT NOT NULL,
    Player_Name VARCHAR(100), Team_ID INT, Team_Name VARCHAR(100), Position VARCHAR(20),
    DetailedPosition VARCHAR(50), Nationality VARCHAR(50), LeagueCode VARCHAR(10),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_user_player (User_ID, Player_ID)
  )`, 'watchlist');

  await run(`CREATE TABLE IF NOT EXISTS comments (
    Comment_ID INT AUTO_INCREMENT PRIMARY KEY, User_ID INT NOT NULL, Username VARCHAR(50) NOT NULL,
    Match_ID INT NOT NULL, Content VARCHAR(500) NOT NULL, CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match (Match_ID)
  )`, 'comments');

  await run(`CREATE TABLE IF NOT EXISTS comment_reports (
    Report_ID INT AUTO_INCREMENT PRIMARY KEY, Comment_ID INT NOT NULL, Reporter_ID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_report (Comment_ID, Reporter_ID), INDEX idx_comment (Comment_ID)
  )`, 'comment_reports');

  await run(`ALTER TABLE predictions ADD COLUMN Outcome VARCHAR(10) DEFAULT NULL`, 'predictions.Outcome');
  await run(`ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL`, 'users.avatar_url');
  await run(`ALTER TABLE favourites ADD UNIQUE KEY uq_user (User_ID)`, 'favourites.uq_user');
  await run(`ALTER TABLE users ADD COLUMN banned TINYINT(1) NOT NULL DEFAULT 0`, 'users.banned');
}

// ── Start ─────────────────────────────────────────────────────────────────────

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    await runMigrations();
    resolveOutcomes();
    setInterval(resolveOutcomes, 15 * 60 * 1000);
  });
}
