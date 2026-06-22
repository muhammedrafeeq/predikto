import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

// Load .env / .env.local
for (const file of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const sep = t.indexOf("=");
    if (sep === -1) continue;
    const key = t.slice(0, sep).trim();
    let val = t.slice(sep + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  }
}

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) { console.error("❌  DATABASE_URL not set"); process.exit(1); }

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Show what will be deleted first
    const preview = await client.query(`
      SELECT id, team_home, team_away, round, match_time
      FROM matches
      WHERE round IS NOT NULL AND round NOT IN ('', 'Group Stage')
      ORDER BY match_time ASC
    `);

    if (preview.rows.length === 0) {
      console.log("ℹ️  No knockout matches found. Nothing to delete.");
      await client.end();
      return;
    }

    console.log(`\n🔍  Found ${preview.rows.length} knockout matches to delete:\n`);
    for (const m of preview.rows) {
      const d = new Date(m.match_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
      console.log(`  [${m.id}] ${m.team_home} vs ${m.team_away}  |  ${m.round}  |  ${d}`);
    }

    // Confirm last group stage match
    const lastGroup = await client.query(`
      SELECT id, team_home, team_away, match_time
      FROM matches
      WHERE round = 'Group Stage' OR round = '' OR round IS NULL
      ORDER BY match_time DESC
      LIMIT 1
    `);
    if (lastGroup.rows.length > 0) {
      const lg = lastGroup.rows[0];
      console.log(`\n✅  Last remaining match will be: [${lg.id}] ${lg.team_home} vs ${lg.team_away}`);
    }

    console.log("\n⏳  Deleting knockout matches and their questions/predictions...\n");

    // Get knockout match IDs
    const knockoutIds = preview.rows.map((r: any) => r.id);

    // Delete predictions for these matches
    const delPreds = await client.query(`
      DELETE FROM predictions
      WHERE question_id IN (
        SELECT id FROM questions WHERE match_id = ANY($1::int[])
      )
    `, [knockoutIds]);
    console.log(`  🗑️  Deleted ${delPreds.rowCount} prediction rows`);

    // Delete questions for these matches
    const delQuestions = await client.query(`
      DELETE FROM questions WHERE match_id = ANY($1::int[])
    `, [knockoutIds]);
    console.log(`  🗑️  Deleted ${delQuestions.rowCount} question rows`);

    // Delete the matches themselves
    const delMatches = await client.query(`
      DELETE FROM matches WHERE id = ANY($1::int[])
    `, [knockoutIds]);
    console.log(`  🗑️  Deleted ${delMatches.rowCount} match rows`);

    // Verify last remaining match
    const remaining = await client.query(`
      SELECT id, team_home, team_away, round, match_time
      FROM matches ORDER BY match_time DESC LIMIT 1
    `);
    if (remaining.rows.length > 0) {
      const r = remaining.rows[0];
      const d = new Date(r.match_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
      console.log(`\n✅  Last match in DB: [${r.id}] ${r.team_home} vs ${r.team_away}  |  ${r.round || "Group Stage"}  |  ${d}`);
    }

    const total = await client.query("SELECT COUNT(*) FROM matches");
    console.log(`\n🎉  Done! Total matches remaining: ${total.rows[0].count}`);
  } catch (err) {
    console.error("❌  Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
