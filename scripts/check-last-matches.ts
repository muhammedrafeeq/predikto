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

  const res = await client.query(
    `SELECT id, team_home, team_away, round, match_time FROM matches ORDER BY match_time DESC LIMIT 20`
  );
  console.log("\nLast 20 matches (newest first):\n");
  for (const r of res.rows) {
    const d = new Date(r.match_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    console.log(`  [${r.id}] ${r.team_home} vs ${r.team_away}  |  ${r.round || "Group Stage"}  |  ${d}`);
  }

  await client.end();
}

run();
