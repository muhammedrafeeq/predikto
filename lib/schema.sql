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
    is_public BOOLEAN DEFAULT FALSE,
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
    team_home_ml VARCHAR(100) DEFAULT '',
    team_away_ml VARCHAR(100) DEFAULT '',
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
    name_ml VARCHAR(100) DEFAULT '',
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

CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_active ON trivia_questions(difficulty, active);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- teams table (new — normalizes team references)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(5),           -- e.g., 'MEX', 'BRA'
  flag_emoji VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- player_cards (master card definitions, seeded by admin/script)
CREATE TABLE IF NOT EXISTS player_cards (
  id              SERIAL PRIMARY KEY,
  team_id         INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  player_name     TEXT NOT NULL,
  position        TEXT CHECK (position IN ('GK','DEF','MID','FWD')),
  jersey_number   INT,
  rarity          TEXT CHECK (rarity IN ('common','rare','epic','legendary')),
  overall_rating  INT CHECK (overall_rating BETWEEN 1 AND 99),
  stats           JSONB,      -- {pace, shooting, passing, defending}
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- user_cards (cards owned by each user)
CREATE TABLE IF NOT EXISTS user_cards (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  card_id         INTEGER REFERENCES player_cards(id) ON DELETE CASCADE,
  quantity        INT DEFAULT 1,
  earned_via      TEXT CHECK (earned_via IN (
                    'daily_login','trivia','prediction',
                    'perfect','streak','leaderboard'
                  )),
  first_earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- card_drops (log of every drop event)
CREATE TABLE IF NOT EXISTS card_drops (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  card_id         INTEGER REFERENCES player_cards(id) ON DELETE CASCADE,
  trigger         TEXT NOT NULL,
  trigger_ref_id  INTEGER,
  dropped_at      TIMESTAMPTZ DEFAULT NOW()
);

-- card_trades
CREATE TABLE IF NOT EXISTS card_trades (
  id                  SERIAL PRIMARY KEY,
  from_user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  to_user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  offered_card_id     INTEGER REFERENCES player_cards(id) ON DELETE CASCADE,
  requested_card_id   INTEGER REFERENCES player_cards(id) ON DELETE CASCADE,
  status              TEXT CHECK (status IN (
                        'pending','accepted','rejected',
                        'countered','expired'
                      )) DEFAULT 'pending',
  counter_card_id     INTEGER REFERENCES player_cards(id) ON DELETE CASCADE,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- user_favourite_teams
CREATE TABLE IF NOT EXISTS user_favourite_teams (
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team_id   INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  slot      INT DEFAULT 1,
  PRIMARY KEY (user_id, slot)
);

-- daily_login_streaks
CREATE TABLE IF NOT EXISTS daily_login_streaks (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak   INT DEFAULT 0,
  longest_streak   INT DEFAULT 0,
  last_login_date  DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_cards_team ON player_cards(team_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_rarity ON player_cards(rarity);
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_card ON user_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_card_drops_user ON card_drops(user_id);
CREATE INDEX IF NOT EXISTS idx_card_trades_from ON card_trades(from_user_id);
CREATE INDEX IF NOT EXISTS idx_card_trades_to ON card_trades(to_user_id);
CREATE INDEX IF NOT EXISTS idx_card_trades_status ON card_trades(status);
CREATE INDEX IF NOT EXISTS idx_user_fav_teams_user ON user_favourite_teams(user_id);

