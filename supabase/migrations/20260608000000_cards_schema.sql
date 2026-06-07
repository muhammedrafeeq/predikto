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
