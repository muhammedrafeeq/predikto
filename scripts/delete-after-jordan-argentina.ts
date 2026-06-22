import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

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

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || "" });
  await client.connect();

  try {
    // Find Jordan vs Argentina match
    const jaRes = await client.query(
      `SELECT id, team_home, team_away, match_time FROM matches
       WHERE (LOWER(team_home) LIKE '%jordan%' AND LOWER(team_away) LIKE '%argentina%')
          OR (LOWER(team_home) LIKE '%argentina%' AND LOWER(team_away) LIKE '%jordan%')
       ORDER BY match_time ASC LIMIT 1`
    );

    if (jaRes.rows.length === 0) {
      console.error("❌  Jordan vs Argentina match not found in DB.");
      process.exit(1);
    }

    const ja = jaRes.rows[0];
    const d = new Date(ja.match_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    console.log(`\n✅  Anchor match: [${ja.id}] ${ja.team_home} vs ${ja.team_away}  |  ${d}`);
    console.log(`    All matches AFTER this time will be deleted.\n`);

    // Find matches after Jordan vs Argentina
    const toDelete = await client.query(
      `SELECT id, team_home, team_away, round, match_time FROM matches
       WHERE match_time > $1
       ORDER BY match_time ASC`,
      [ja.match_time]
    );

    if (toDelete.rows.length === 0) {
      console.log("ℹ️  No matches after Jordan vs Argentina. Nothing to delete.");
      await client.end();
      return;
    }

    console.log(`🔍  Found ${toDelete.rows.length} matches to delete:\n`);
    for (const m of toDelete.rows) {
      const md = new Date(m.match_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
      console.log(`  [${m.id}] ${m.team_home} vs ${m.team_away}  |  ${m.round || "Group Stage"}  |  ${md}`);
    }

    const ids = toDelete.rows.map((r: any) => r.id);

    const delPreds = await client.query(
      `DELETE FROM predictions WHERE question_id IN (SELECT id FROM questions WHERE match_id = ANY($1::int[]))`,
      [ids]
    );
    console.log(`\n  🗑️  Deleted ${delPreds.rowCount} prediction rows`);

    const delQ = await client.query(`DELETE FROM questions WHERE match_id = ANY($1::int[])`, [ids]);
    console.log(`  🗑️  Deleted ${delQ.rowCount} question rows`);

    const delM = await client.query(`DELETE FROM matches WHERE id = ANY($1::int[])`, [ids]);
    console.log(`  🗑️  Deleted ${delM.rowCount} match rows`);

    const total = await client.query("SELECT COUNT(*) FROM matches");
    console.log(`\n🎉  Done! Total matches remaining: ${total.rows[0].count}`);
    console.log(`    Last match: [${ja.id}] ${ja.team_home} vs ${ja.team_away}`);
  } catch (err) {
    console.error("❌  Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
