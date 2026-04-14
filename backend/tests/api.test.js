// Must be set before requiring the app so JWT_SECRET check passes
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mocks (declared before app is required) ───────────────────────────────────

jest.mock('../db', () => ({ query: jest.fn(), getConnection: jest.fn() }));

jest.mock('../footballApi', () => ({
  getCompetitions: jest.fn(() => []),
  getStandings:    jest.fn(),
  getMatches:      jest.fn(),
  getTeams:        jest.fn(),
  getScorers:      jest.fn(),
  getTeamDetail:   jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

const pool   = require('../db');
const bcrypt = require('bcryptjs');
const app    = require('../server');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(overrides = {}) {
  return jwt.sign(
    { id: 1, username: 'testuser', role: 'user', ...overrides },
    'test-secret',
    { expiresIn: '1h' }
  );
}

// Stub the ban-check query that authenticate() always runs first
function allowAuth() {
  pool.query.mockResolvedValueOnce([[{ banned: 0 }]]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/register', () => {
  const valid = { username: 'Alice99', email: 'alice@test.com', password: 'Password1' };

  test('201 on valid registration', async () => {
    pool.query
      .mockResolvedValueOnce([[]])               // no existing user
      .mockResolvedValueOnce([{ insertId: 42 }]); // INSERT

    const res = await request(app).post('/api/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ username: 'Alice99', email: 'alice@test.com', role: 'user' });
  });

  test('409 when username already taken', async () => {
    pool.query.mockResolvedValueOnce([[{ Username: 'Alice99', Email: 'other@test.com' }]]);

    const res = await request(app).post('/api/register').send(valid);

    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 when email already registered', async () => {
    pool.query.mockResolvedValueOnce([[{ Username: 'OtherUser', Email: 'alice@test.com' }]]);

    const res = await request(app).post('/api/register').send(valid);

    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
  });

  test('400 when password is too short', async () => {
    const res = await request(app).post('/api/register').send({ ...valid, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
  });

  test('400 when password has no uppercase letter', async () => {
    const res = await request(app).post('/api/register').send({ ...valid, password: 'password1' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
  });

  test('400 when password has no number', async () => {
    const res = await request(app).post('/api/register').send({ ...valid, password: 'PasswordOnly' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
  });

  test('400 when username is too short', async () => {
    const res = await request(app).post('/api/register').send({ ...valid, username: 'ab' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('username');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  const dbUser = {
    User_ID: 1, Username: 'Alice99', Email: 'alice@test.com',
    Password: '$2b$10$hashedpassword', password_hash: '$2b$10$hashedpassword',
    Role: 'user', banned: 0,
  };

  test('200 and returns token on valid credentials', async () => {
    pool.query.mockResolvedValueOnce([[dbUser]]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app).post('/api/login').send({ email: 'alice@test.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username: 'Alice99', role: 'user' });
  });

  test('401 when email not found', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no user

    const res = await request(app).post('/api/login').send({ email: 'nobody@test.com', password: 'Password1' });

    expect(res.status).toBe(401);
  });

  test('401 when password is wrong', async () => {
    pool.query.mockResolvedValueOnce([[dbUser]]);
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app).post('/api/login').send({ email: 'alice@test.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
  });

  test('403 when account is banned', async () => {
    pool.query.mockResolvedValueOnce([[{ ...dbUser, banned: 1 }]]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app).post('/api/login').send({ email: 'alice@test.com', password: 'Password1' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/banned/i);
  });

  test('400 when fields are missing', async () => {
    const res = await request(app).post('/api/login').send({ email: 'alice@test.com' });
    expect(res.status).toBe(400);
  });
});

// ── Auth middleware ───────────────────────────────────────────────────────────

describe('Auth middleware', () => {
  test('401 when no token provided on protected route', async () => {
    const res = await request(app).post('/api/predictions').send({ matchId: 1, homeGoals: 2, awayGoals: 1 });
    expect(res.status).toBe(401);
  });

  test('401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', 'Bearer notavalidtoken')
      .send({ matchId: 1, homeGoals: 2, awayGoals: 1 });
    expect(res.status).toBe(401);
  });
});

// ── Predictions ───────────────────────────────────────────────────────────────

describe('POST /api/predictions', () => {
  test('200 on valid prediction', async () => {
    allowAuth();
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT

    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 123, homeGoals: 2, awayGoals: 1 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('400 when goals exceed 20', async () => {
    allowAuth();

    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 123, homeGoals: 21, awayGoals: 0 });

    expect(res.status).toBe(400);
  });

  test('400 when goals are negative', async () => {
    allowAuth();

    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 123, homeGoals: -1, awayGoals: 0 });

    expect(res.status).toBe(400);
  });

  test('400 when fields are missing', async () => {
    allowAuth();

    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 123 });

    expect(res.status).toBe(400);
  });
});

// ── Comments ──────────────────────────────────────────────────────────────────

describe('POST /api/comments', () => {
  test('201 on valid comment', async () => {
    allowAuth();
    pool.query.mockResolvedValueOnce([{ insertId: 7 }]);

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 456, content: 'Great match!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ Comment_ID: 7, Content: 'Great match!' });
  });

  test('400 when comment exceeds 500 characters', async () => {
    allowAuth();

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 456, content: 'x'.repeat(501) });

    expect(res.status).toBe(400);
  });

  test('400 when content is missing', async () => {
    allowAuth();

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ matchId: 456 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/comments', () => {
  test('200 returns comments for a match', async () => {
    pool.query.mockResolvedValueOnce([[
      { Comment_ID: 1, Username: 'Alice99', Content: 'Nice goal!', CreatedAt: new Date() },
    ]]);

    const res = await request(app).get('/api/comments?matchId=456');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].Content).toBe('Nice goal!');
  });

  test('400 when matchId is missing', async () => {
    const res = await request(app).get('/api/comments');
    expect(res.status).toBe(400);
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('PUT /api/user/settings', () => {
  const dbUser = {
    User_ID: 1, Username: 'testuser', Email: 'test@test.com',
    Password: '$2b$10$hashedpassword', password_hash: '$2b$10$hashedpassword',
    Role: 'user', banned: 0,
  };

  test('400 when current password is wrong', async () => {
    allowAuth();
    pool.query.mockResolvedValueOnce([[dbUser]]); // SELECT user
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'testuser', currentPassword: 'wrongpass' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('currentPassword');
  });

  test('400 when new password is too weak', async () => {
    allowAuth();
    pool.query.mockResolvedValueOnce([[dbUser]]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'testuser', currentPassword: 'Password1', newPassword: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('newPassword');
  });

  test('200 on valid settings update', async () => {
    allowAuth();
    pool.query
      .mockResolvedValueOnce([[dbUser]])   // SELECT user
      .mockResolvedValueOnce([[]])          // username taken check
      .mockResolvedValueOnce([{}]);         // UPDATE
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ username: 'newname99', currentPassword: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('newname99');
  });
});
