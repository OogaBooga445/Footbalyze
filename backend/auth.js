const jwt = require('jsonwebtoken');
const pool = require('./db');

function getSecret() {
  return process.env.JWT_SECRET;
}

async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), getSecret());
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const [rows] = await pool.query('SELECT banned FROM users WHERE User_ID = ?', [req.user.id]);
    if (rows[0]?.banned) return res.status(403).json({ error: 'Account banned' });
  } catch {
    // banned column may not exist yet — allow through
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role?.toLowerCase() !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { getSecret, authenticate, requireAdmin };
