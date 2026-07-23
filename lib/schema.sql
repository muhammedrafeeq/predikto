-- Database schema for Skorio (Live Score & Football App)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    espn_id VARCHAR(50) UNIQUE,
    team_home VARCHAR(100) NOT NULL,
    team_away VARCHAR(100) NOT NULL,
    team_home_logo TEXT DEFAULT '',
    team_away_logo TEXT DEFAULT '',
    score_home SMALLINT DEFAULT 0,
    score_away SMALLINT DEFAULT 0,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'live', 'finished'
    status_detail VARCHAR(100) DEFAULT '',
    league VARCHAR(100) DEFAULT 'Football',
    round VARCHAR(100) DEFAULT 'Football',
    details_json JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ml VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_player UNIQUE (team_name, name)
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(5),
  flag_emoji VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mini-Games Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_type    VARCHAR(50) NOT NULL, -- 'trivia', 'flag_quiz', 'who_am_i', 'penalty'
    reference_id INTEGER,
    points       INTEGER NOT NULL DEFAULT 0,
    metadata     JSONB,
    played_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trivia Questions Table
CREATE TABLE IF NOT EXISTS trivia_questions (
    id            SERIAL PRIMARY KEY,
    question      TEXT NOT NULL,
    question_ml   TEXT DEFAULT '',
    options       JSONB NOT NULL,
    options_ml    JSONB DEFAULT '[]',
    correct_index SMALLINT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
    difficulty    VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    explanation   TEXT DEFAULT '',
    explanation_ml TEXT DEFAULT '',
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Who Am I Players Table
CREATE TABLE IF NOT EXISTS who_am_i_players (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) UNIQUE NOT NULL,
    aliases JSONB DEFAULT '[]',
    clues JSONB NOT NULL,
    clues_ml JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_players_team_name ON players(team_name);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_active ON trivia_questions(difficulty, active);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
