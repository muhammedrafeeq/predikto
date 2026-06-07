-- Who Am I game: player clue entries managed by admin
CREATE TABLE IF NOT EXISTS who_am_i_players (
  id         SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,         -- display name (answer)
  aliases    JSONB NOT NULL DEFAULT '[]', -- accepted answer variants
  clues      JSONB NOT NULL DEFAULT '[]', -- 6 English clues
  clues_ml   JSONB NOT NULL DEFAULT '[]', -- 6 Malayalam clues
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_who_am_i_active ON who_am_i_players(active);
