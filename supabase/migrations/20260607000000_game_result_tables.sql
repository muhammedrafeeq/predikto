-- first_goal_results: stores the actual first goal minute per match
CREATE TABLE IF NOT EXISTS first_goal_results (
  match_id    INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  first_goal_minute INTEGER NOT NULL CHECK (first_goal_minute BETWEEN 1 AND 120),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- formation_results: stores the actual formations used per match
CREATE TABLE IF NOT EXISTS formation_results (
  match_id       INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_formation TEXT NOT NULL,
  away_formation TEXT NOT NULL,
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- bracket_results: stores each bracket stage result (group winners, R16, QF, SF, Final)
CREATE TABLE IF NOT EXISTS bracket_results (
  id          SERIAL PRIMARY KEY,
  stage       TEXT NOT NULL,
  matchup     TEXT NOT NULL UNIQUE,
  winner      TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_first_goal_results_match ON first_goal_results(match_id);
CREATE INDEX IF NOT EXISTS idx_formation_results_match  ON formation_results(match_id);
CREATE INDEX IF NOT EXISTS idx_bracket_results_stage    ON bracket_results(stage);
