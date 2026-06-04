import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Games tables
    await query(`
      CREATE TABLE IF NOT EXISTS game_scores (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_type    VARCHAR(50) NOT NULL,
        reference_id INTEGER,
        points       INTEGER NOT NULL DEFAULT 0,
        metadata     JSONB,
        played_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_game_ref UNIQUE (user_id, game_type, reference_id)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_user      ON game_scores(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type)`);

    return NextResponse.json({ success: true, message: "Tables created" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
