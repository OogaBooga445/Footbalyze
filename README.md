# Footbalyze

Football stats app covering 10 leagues — browse standings, teams, players and match results. Create an account to pick your favourite team, make score predictions, build a watchlist, and chat in match comments.

Built with Vue 3 + Express + MySQL.

**Live:** https://footbalyze.rvtdev.tech

---

## Before you start

You'll need three things installed:

- **Node.js** (v18+)
- **MySQL 8** running locally
- A free API key from [football-data.org](https://www.football-data.org/client/register) — takes 30 seconds to sign up

---

## Getting it running

### Step 1 — Set up the database

Make sure MySQL is running, then import the schema:

```bash
mysql -u root -p < Tables.sql
```

This creates the `fullstack_db` database with all the tables the app needs.

> **On Windows** — if MySQL isn't running, open Services and start `MySQL83`, or run `net start MySQL83` in a terminal.

---

### Step 2 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your details:

```
DB_PASSWORD=       ← your MySQL root password
JWT_SECRET=        ← any long random string (see below)
FOOTBALL_DATA_API_KEY=   ← your key from football-data.org
```

The rest can stay as-is for local development.

To generate a secure JWT secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then install and start:
```bash
npm install
npm start
```

Backend is now running at `http://localhost:3000`.

---

### Step 3 — Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend is now at **http://localhost:5173** — open that in your browser and you're good to go.

---

## What you can do

**Without an account:**
- Browse standings, teams, players, and match results for all 10 leagues
- View team squad pages, player profiles, head-to-head records
- Search for anything from the navbar

**With an account:**
- Set a favourite team and player — see their live stats on your dashboard
- Predict match scorelines and earn points (3 for exact score, 1 for correct result)
- Track players on a watchlist
- Comment on any match

**As an admin:**
- Manage users — change roles, ban accounts, delete accounts
- Moderate reported comments

---

## Leagues covered

Premier League · La Liga · Bundesliga · Serie A · Ligue 1 · Championship · Primeira Liga · Eredivisie · Brasileirão · Champions League

---

## Making someone an admin

Register normally through the app, then run this in MySQL:

```sql
USE fullstack_db;
UPDATE users SET Role = 'admin' WHERE Username = 'your_username';
```

Log out and back in and the admin panel will appear.

---

## Running the tests

```bash
cd backend
npm test
```

26 tests covering auth, predictions, comments, and settings. No database needed — everything is mocked.

---

## Good to know

- **API caching** — the app caches football data so you don't burn through the free API limit (standings cached 6h, teams 24h). First load on a cold cache will be slower.
- **Predictions** — outcomes are scored automatically every 15 minutes in the background, so scores update on their own once matches finish.
- **Season** — if the 2025/26 season rolls over, update `CURRENT_SEASON` in your `.env` and restart the backend.
