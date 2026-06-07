-- Allow contest_id to be NULL for standalone games (trivia, penalty)
ALTER TABLE game_scores ALTER COLUMN contest_id DROP NOT NULL;

-- Partial unique index for standalone games (contest_id IS NULL)
-- This replaces the old unique_user_game_ref constraint for non-contest games
CREATE UNIQUE INDEX IF NOT EXISTS idx_standalone_game_ref
  ON game_scores (user_id, game_type, reference_id)
  WHERE contest_id IS NULL;

-- trivia_questions table (used by trivia game)
CREATE TABLE IF NOT EXISTS trivia_questions (
  id             SERIAL PRIMARY KEY,
  question       TEXT NOT NULL,
  question_ml    TEXT DEFAULT '',
  options        JSONB NOT NULL,
  options_ml     JSONB DEFAULT '[]',
  correct_index  SMALLINT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  difficulty     VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  explanation    TEXT DEFAULT '',
  explanation_ml TEXT DEFAULT '',
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_active ON trivia_questions(difficulty, active);

-- penalty_challenges table (used by penalty challenge mode)
CREATE TABLE IF NOT EXISTS penalty_challenges (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  creator_name         TEXT NOT NULL,
  creator_kicks        JSONB NOT NULL,
  creator_goalie_kicks JSONB NOT NULL,
  creator_goals        INTEGER NOT NULL,
  creator_points       INTEGER NOT NULL,
  challenger_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  challenger_name      TEXT,
  challenger_kicks     JSONB,
  challenger_goalie_kicks JSONB,
  challenger_goals     INTEGER,
  challenger_points    INTEGER,
  status               TEXT NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at           TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
);
