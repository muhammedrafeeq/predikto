import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

// Load environment variables from .env.local or .env
const envFiles = [".env.local", ".env"];
let envLoaded = false;
for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    console.log(`Loading env variables from ${file}...`);
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
    envLoaded = true;
    break;
  }
}

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment or env files.");
  process.exit(1);
}

async function runMigration() {
  console.log("Connecting to database...");
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected. Starting migration transaction...");
    await client.query("BEGIN");

    // 1. Create Tournaments
    console.log("Creating tournaments table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        type        VARCHAR(50) DEFAULT 'league',
        status      VARCHAR(20) DEFAULT 'active',
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Contests
    console.log("Creating contests table...");
    await client.query(`
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

    await client.query(`
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
    `);

    // 3. Create Contest Members
    console.log("Creating contest_members table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS contest_members (
        contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (contest_id, user_id)
      )
    `);

    // 4. Alter Matches to include tournament_id
    console.log("Adding tournament_id to matches...");
    await client.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE
    `);

    // Seed default Tournament
    console.log("Seeding default tournament...");
    await client.query(`
      INSERT INTO tournaments (id, name, description, type, status)
      VALUES (1, 'Global Tournament', 'Default Tournament for all games', 'league', 'active')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`SELECT setval(pg_get_serial_sequence('tournaments', 'id'), COALESCE(MAX(id), 1)) FROM tournaments`);

    // Map matches
    await client.query(`
      UPDATE matches SET tournament_id = 1 WHERE tournament_id IS NULL
    `);

    // Seed default Contest
    console.log("Seeding default Global/Public Arena contest...");
    await client.query(`
      INSERT INTO contests (id, name, tournament_id, game_type, join_code, creator_id, is_public)
      VALUES (1, 'WC2026', 1, 'match_prediction', '958102', (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1), false)
      ON CONFLICT (id) DO NOTHING
    `);

    // If it already exists, rename and update it
    await client.query(`
      UPDATE contests
      SET name = 'WC2026',
          join_code = '958102',
          is_public = false,
          creator_id = (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1)
      WHERE id = 1 OR name = 'Public Arena'
    `);
    await client.query(`SELECT setval(pg_get_serial_sequence('contests', 'id'), COALESCE(MAX(id), 1)) FROM contests`);

    // Add existing users to the Global Arena
    console.log("Adding all users to Public Arena...");
    await client.query(`
      INSERT INTO contest_members (contest_id, user_id)
      SELECT 1, id FROM users
      ON CONFLICT DO NOTHING
    `);

    // 5. Alter Predictions
    console.log("Adding contest_id to predictions...");
    await client.query(`
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await client.query(`
      UPDATE predictions SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await client.query(`
      ALTER TABLE predictions ALTER COLUMN contest_id SET NOT NULL
    `);

    // Replace unique constraints on predictions
    await client.query(`
      ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_match_question
    `);
    await client.query(`
      ALTER TABLE predictions DROP CONSTRAINT IF EXISTS unique_user_contest_match_question
    `);
    await client.query(`
      ALTER TABLE predictions ADD CONSTRAINT unique_user_contest_match_question UNIQUE (user_id, contest_id, match_id, question_id)
    `);

    // 6. Alter Scores
    console.log("Adding contest_id to scores...");
    await client.query(`
      ALTER TABLE scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await client.query(`
      UPDATE scores SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await client.query(`
      ALTER TABLE scores ALTER COLUMN contest_id SET NOT NULL
    `);

    // Replace unique constraints on scores
    await client.query(`
      ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_match_score
    `);
    await client.query(`
      ALTER TABLE scores DROP CONSTRAINT IF EXISTS unique_user_contest_match_score
    `);
    await client.query(`
      ALTER TABLE scores ADD CONSTRAINT unique_user_contest_match_score UNIQUE (user_id, contest_id, match_id)
    `);

    // 7. Alter Game Scores
    console.log("Adding contest_id to game_scores...");
    await client.query(`
      ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE
    `);
    await client.query(`
      UPDATE game_scores SET contest_id = 1 WHERE contest_id IS NULL
    `);
    await client.query(`
      ALTER TABLE game_scores ALTER COLUMN contest_id SET NOT NULL
    `);

    // Replace unique constraints on game_scores
    await client.query(`
      ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_game_ref
    `);
    await client.query(`
      ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_user_contest_game_ref
    `);
    await client.query(`
      ALTER TABLE game_scores ADD CONSTRAINT unique_user_contest_game_ref UNIQUE (user_id, contest_id, game_type, reference_id)
    `);

    // 7b. Add game_types array column
    console.log("Adding game_types column to contests...");
    await client.query(`
      ALTER TABLE contests ADD COLUMN IF NOT EXISTS game_types TEXT[] DEFAULT ARRAY['match_prediction']
    `);
    // Backfill from existing game_type
    await client.query(`
      UPDATE contests SET game_types = ARRAY[game_type] WHERE game_types IS NULL OR game_types = '{}'
    `);

    // 8. Create Indexes
    console.log("Creating optimization indexes...");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contest_members_user ON contest_members(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contests_join_code ON contests(join_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_predictions_contest ON predictions(contest_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_scores_contest ON scores(contest_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_game_scores_contest ON game_scores(contest_id)`);

    // 9. Create System Settings Table
    console.log("Creating system_settings table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key         VARCHAR(100) PRIMARY KEY,
        value       VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default setting
    console.log("Seeding default system settings...");
    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('allow_contest_creation', 'true')
      ON CONFLICT (key) DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration transaction failed, rolling back...", error);
    try {
      await client.query("ROLLBACK");
    } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
