-- Database schema for Predikto

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'league', -- 'league' or 'bracket'
    status VARCHAR(20) DEFAULT 'active', -- 'upcoming', 'active', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL, -- 'match_prediction', 'first_goal', 'formation', 'bracket'
    join_code VARCHAR(10) UNIQUE NOT NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contest Members Table
CREATE TABLE IF NOT EXISTS contest_members (
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contest_id, user_id)
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    team_home VARCHAR(100) NOT NULL,
    team_away VARCHAR(100) NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'live', 'predicted', 'resulted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table (3 questions per match: winner, scoreline, top scorer)
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'winner', 'score', 'scorer'
    label VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_contest_match_question UNIQUE (user_id, contest_id, match_id, question_id)
);

-- Results Table (Correct answers for each question)
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    correct_answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_match_question_result UNIQUE (match_id, question_id)
);

-- Scores Table (Accumulated user points per match, scoped to contest)
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_contest_match_score UNIQUE (user_id, contest_id, match_id)
);

-- Game Scores Table (Accumulated points for games like first-goal, formation, bracket, penalty, trivia, etc.)
CREATE TABLE IF NOT EXISTS game_scores (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contest_id   INTEGER REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
    game_type    VARCHAR(50) NOT NULL,
    reference_id INTEGER,
    points       INTEGER NOT NULL DEFAULT 0,
    metadata     JSONB,
    played_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_contest_game_ref UNIQUE (user_id, contest_id, game_type, reference_id)
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_player UNIQUE (team_name, name)
);

-- Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_questions_match_id ON questions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_match ON predictions(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_players_team_name ON players(team_name);

-- Contest-driven Indexes
CREATE INDEX IF NOT EXISTS idx_contest_members_user ON contest_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contests_join_code ON contests(join_code);
CREATE INDEX IF NOT EXISTS idx_predictions_contest ON predictions(contest_id);
CREATE INDEX IF NOT EXISTS idx_scores_contest ON scores(contest_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_contest ON game_scores(contest_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
