import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST() {
  try {
    // Authenticate as Admin
    await requireAdmin();

    // 1. Create Tournaments Table
    await query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        type        VARCHAR(50) DEFAULT 'league',
        status      VARCHAR(20) DEFAULT 'active',
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Contests Table (with creator_id nullable for system-created contests)
    await query(`
      CREATE TABLE IF NOT EXISTS contests (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        game_type     VARCHAR(50) NOT NULL,
        join_code     VARCHAR(10) UNIQUE NOT NULL,
        creator_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_public     BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
    `);

    // 3. Create Contest Members Table
    await query(`
      CREATE TABLE IF NOT EXISTS contest_members (
        contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (contest_id, user_id)
      )
    `);

    // 4. Alter Matches to include tournament_id
    await query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE
    `);

    // Seed default Tournament
    await query(`
      INSERT INTO tournaments (id, name, description, type, status)
      VALUES (1, 'Global Tournament', 'Default Tournament for all games', 'league', 'active')
      ON CONFLICT (id) DO NOTHING
    `);

    // Reset sequence if needed for tournaments
    await query(`SELECT setval(pg_get_serial_sequence('tournaments', 'id'), COALESCE(MAX(id), 1)) FROM tournaments`);

    // Map existing matches to default tournament
    await query(`
      UPDATE matches SET tournament_id = 1 WHERE tournament_id IS NULL
    `);

    // Seed default Contest ("WC2026")
    await query(`
      INSERT INTO contests (id, name, tournament_id, game_type, join_code, creator_id, is_public)
      VALUES (1, 'WC2026', 1, 'match_prediction', '958102', (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1), false)
      ON CONFLICT (id) DO NOTHING
    `);

    // If it already exists, rename and update it
    await query(`
      UPDATE contests
      SET name = 'WC2026',
          join_code = '958102',
          is_public = false,
          creator_id = (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1)
      WHERE id = 1 OR name = 'Public Arena'
    `);

    // Reset sequence for contests
    await query(`SELECT setval(pg_get_serial_sequence('contests', 'id'), COALESCE(MAX(id), 1)) FROM contests`);

    // Add all existing users to the Public Arena
    await query(`
      INSERT INTO contest_members (contest_id, user_id)
      SELECT 1, id FROM users
      ON CONFLICT DO NOTHING
    `);

    // 5. Alter Predictions to include contest_id (temporarily nullable during update, then made NOT NULL)
    await query(`
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await query(`
      UPDATE predictions SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await query(`
      ALTER TABLE predictions ALTER COLUMN contest_id SET NOT NULL
    `);
    
    // Drop old predictions constraint and add new one
    await query(`
      ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_match_question
    `);
    await query(`
      ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_contest_match_question
    `);
    await query(`
      ALTER TABLE predictions ADD CONSTRAINT unique_user_contest_match_question UNIQUE (user_id, contest_id, match_id, question_id)
    `);

    // 6. Alter Scores to include contest_id
    await query(`
      ALTER TABLE scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await query(`
      UPDATE scores SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await query(`
      ALTER TABLE scores ALTER COLUMN contest_id SET NOT NULL
    `);
    
    // Drop old scores constraint and add new one
    await query(`
      ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_match_score
    `);
    await query(`
      ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_contest_match_score
    `);
    await query(`
      ALTER TABLE scores ADD CONSTRAINT unique_user_contest_match_score UNIQUE (user_id, contest_id, match_id)
    `);

    // 7. Alter Game Scores to include contest_id
    await query(`
      ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await query(`
      UPDATE game_scores SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await query(`
      ALTER TABLE game_scores ALTER COLUMN contest_id SET NOT NULL
    `);
    
    // Drop old game_scores constraint and add new one
    await query(`
      ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_game_ref
    `);
    await query(`
      ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_contest_game_ref
    `);
    await query(`
      ALTER TABLE game_scores ADD CONSTRAINT unique_user_contest_game_ref UNIQUE (user_id, contest_id, game_type, reference_id)
    `);

    // Add indexes for speed optimization
    await query(`CREATE INDEX IF NOT EXISTS idx_contest_members_user ON contest_members(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_contests_join_code ON contests(join_code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_predictions_contest ON predictions(contest_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_scores_contest ON scores(contest_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_contest ON game_scores(contest_id)`);

    // Create System Settings Table
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key         VARCHAR(100) PRIMARY KEY,
        value       VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game result tables (needed for first_goal, formation, and bracket contests)
    await query(`
      CREATE TABLE IF NOT EXISTS first_goal_results (
        match_id          INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
        first_goal_minute INTEGER NOT NULL,
        recorded_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS formation_results (
        match_id       INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
        home_formation VARCHAR(20) NOT NULL,
        away_formation VARCHAR(20) NOT NULL,
        recorded_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS bracket_results (
        id          SERIAL PRIMARY KEY,
        stage       VARCHAR(20)  NOT NULL,
        matchup     VARCHAR(50)  NOT NULL UNIQUE,
        winner      VARCHAR(100) NOT NULL,
        recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // trivia_questions table
    await query(`
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
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_active ON trivia_questions(difficulty, active)`);

    // penalty_challenges table
    await query(`
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
      )
    `);

    // Allow contest_id to be NULL for standalone games (trivia, penalty)
    await query(`ALTER TABLE game_scores ALTER COLUMN contest_id DROP NOT NULL`);
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_standalone_game_ref
        ON game_scores (user_id, game_type, reference_id)
        WHERE contest_id IS NULL
    `);

    // Seed default setting
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ('allow_contest_creation', 'true')
      ON CONFLICT (key) DO NOTHING
    `);

    return NextResponse.json({
      success: true,
      message: "Database schema migrated to contest-driven architecture successfully!",
    });
  } catch (error: unknown) {
    console.error("Migration failed:", error);
    const e = error as { message?: string };
    return NextResponse.json(
      { error: "Migration failed: " + (e.message ?? "Unknown error") },
      { status: 500 }
    );
  }
}
