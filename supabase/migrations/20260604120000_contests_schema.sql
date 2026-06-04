-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'league',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    join_code VARCHAR(10) UNIQUE NOT NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Contest Members Table
CREATE TABLE IF NOT EXISTS contest_members (
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contest_id, user_id)
);

-- 4. Add tournament_id to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;

-- Seed default tournament
INSERT INTO tournaments (id, name, description, type, status)
VALUES (1, 'Global Tournament', 'Default Tournament for all games', 'league', 'active')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for tournaments
SELECT setval(pg_get_serial_sequence('tournaments', 'id'), COALESCE(MAX(id), 1)) FROM tournaments;

-- Associate existing matches with default tournament
UPDATE matches SET tournament_id = 1 WHERE tournament_id IS NULL;

-- Seed default contest ("Public Arena")
INSERT INTO contests (id, name, tournament_id, game_type, join_code, creator_id)
VALUES (1, 'Public Arena', 1, 'match_prediction', 'PUBLIC', NULL)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for contests
SELECT setval(pg_get_serial_sequence('contests', 'id'), COALESCE(MAX(id), 1)) FROM contests;

-- Add existing users to the Public Arena contest
INSERT INTO contest_members (contest_id, user_id)
SELECT 1, id FROM users
ON CONFLICT DO NOTHING;

-- 5. Add contest_id to predictions
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE;
UPDATE predictions SET contest_id = 1 WHERE contest_id IS NULL;
ALTER TABLE predictions ALTER COLUMN contest_id SET NOT NULL;

-- Recreate predictions unique constraint
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_match_question;
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_contest_match_question;
ALTER TABLE predictions ADD CONSTRAINT unique_user_contest_match_question UNIQUE (user_id, contest_id, match_id, question_id);

-- 6. Add contest_id to scores
ALTER TABLE scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE;
UPDATE scores SET contest_id = 1 WHERE contest_id IS NULL;
ALTER TABLE scores ALTER COLUMN contest_id SET NOT NULL;

-- Recreate scores unique constraint
ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_match_score;
ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_contest_match_score;
ALTER TABLE scores ADD CONSTRAINT unique_user_contest_match_score UNIQUE (user_id, contest_id, match_id);

-- 7. Add contest_id to game_scores
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE;
UPDATE game_scores SET contest_id = 1 WHERE contest_id IS NULL;
ALTER TABLE game_scores ALTER COLUMN contest_id SET NOT NULL;

-- Recreate game_scores unique constraint
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_game_ref;
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_contest_game_ref;
ALTER TABLE game_scores ADD CONSTRAINT unique_user_contest_game_ref UNIQUE (user_id, contest_id, game_type, reference_id);

-- 8. Create optimization indexes
CREATE INDEX IF NOT EXISTS idx_contest_members_user ON contest_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contests_join_code ON contests(join_code);
CREATE INDEX IF NOT EXISTS idx_predictions_contest ON predictions(contest_id);
CREATE INDEX IF NOT EXISTS idx_scores_contest ON scores(contest_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_contest ON game_scores(contest_id);
