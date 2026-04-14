-- Footbalyze — Database Schema
-- Database: fullstack_db

CREATE DATABASE IF NOT EXISTS fullstack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fullstack_db;

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- Stores registered accounts. Password holds the bcrypt hash.
-- password_hash mirrors Password for compatibility with older login paths.
CREATE TABLE users (
    User_ID       INT AUTO_INCREMENT PRIMARY KEY,
    Username      VARCHAR(50)  NOT NULL UNIQUE,
    Email         VARCHAR(100) NOT NULL UNIQUE,
    Password      VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    Role          VARCHAR(20)  NOT NULL DEFAULT 'user',
    avatar_url    VARCHAR(255) NULL,
    banned        TINYINT(1)   NOT NULL DEFAULT 0
);

-- ─── FAVOURITES ──────────────────────────────────────────────────────────────
-- One row per user. Team_ID and Player_ID are external API IDs (not FK refs).
CREATE TABLE favourites (
    Favourite_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID      INT NOT NULL,
    Team_ID      INT NULL,
    Player_ID    INT NULL,
    UNIQUE KEY uq_user (User_ID),
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── PREDICTIONS ─────────────────────────────────────────────────────────────
-- One prediction per user per match. Outcome resolved automatically.
-- Outcome values: 'exact' | 'correct' | 'wrong' | NULL (unresolved)
CREATE TABLE predictions (
    Prediction_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID       INT          NOT NULL,
    Match_ID      INT          NOT NULL,
    HomeGoals     INT          NOT NULL,
    AwayGoals     INT          NOT NULL,
    Outcome       VARCHAR(10)  NULL DEFAULT NULL,
    CreatedAt     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_match (User_ID, Match_ID),
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
-- Comments on individual matches (Match_ID is an external API match ID).
CREATE TABLE comments (
    Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID    INT          NOT NULL,
    Username   VARCHAR(50)  NOT NULL,
    Match_ID   INT          NOT NULL,
    Content    VARCHAR(500) NOT NULL,
    CreatedAt  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match (Match_ID),
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── COMMENT REPORTS ─────────────────────────────────────────────────────────
-- Tracks which users have reported which comments. One report per user per comment.
CREATE TABLE comment_reports (
    Report_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Comment_ID  INT NOT NULL,
    Reporter_ID INT NOT NULL,
    CreatedAt   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_report (Comment_ID, Reporter_ID),
    INDEX idx_comment (Comment_ID),
    FOREIGN KEY (Comment_ID)  REFERENCES comments(Comment_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Reporter_ID) REFERENCES users(User_ID)       ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── WATCHLIST ───────────────────────────────────────────────────────────────
-- Players a user is tracking. Stores denormalised API data for fast display.
-- Player_ID and Team_ID are external API IDs (not FK refs).
CREATE TABLE watchlist (
    Watchlist_ID     INT AUTO_INCREMENT PRIMARY KEY,
    User_ID          INT          NOT NULL,
    Player_ID        INT          NOT NULL,
    Player_Name      VARCHAR(100) NULL,
    Team_ID          INT          NULL,
    Team_Name        VARCHAR(100) NULL,
    Position         VARCHAR(20)  NULL,
    DetailedPosition VARCHAR(50)  NULL,
    Nationality      VARCHAR(50)  NULL,
    LeagueCode       VARCHAR(10)  NULL,
    CreatedAt        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_player (User_ID, Player_ID),
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
