const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Load env
const envFiles = [".env", ".env.local"];
for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex !== -1) {
        const key = trimmed.substring(0, separatorIndex).trim();
        let val = trimmed.substring(separatorIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

const connectionString = process.env.DATABASE_URL || "";

async function check() {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Connected to DB. Checking player counts for each match...");
  const matchesRes = await client.query("SELECT id, team_home, team_away FROM matches ORDER BY id ASC");
  
  let matchesWithZeroPlayers = 0;
  for (const m of matchesRes.rows) {
    const playersRes = await client.query(
      `SELECT count(*) as count 
       FROM players 
       WHERE LOWER(team_name) = LOWER($1) OR LOWER(team_name) = LOWER($2)`,
      [m.team_home, m.team_away]
    );
    const count = parseInt(playersRes.rows[0].count, 10);
    if (count === 0) {
      console.log(`❌ Match ID ${m.id}: ${m.team_home} vs ${m.team_away} has 0 players!`);
      matchesWithZeroPlayers++;
    }
  }

  console.log(`\nVerification complete. Matches with zero players: ${matchesWithZeroPlayers}`);
  
  // Also check if any team in matches does not exist in players
  const teamsInMatchesRes = await client.query(
    `SELECT DISTINCT team FROM (
       SELECT team_home as team FROM matches
       UNION
       SELECT team_away as team FROM matches
     ) t`
  );
  console.log(`\nUnique teams in matches: ${teamsInMatchesRes.rows.length}`);
  
  for (const t of teamsInMatchesRes.rows) {
    const playersRes = await client.query("SELECT count(*) as count FROM players WHERE LOWER(team_name) = LOWER($1)", [t.team]);
    const count = parseInt(playersRes.rows[0].count, 10);
    if (count === 0) {
      console.log(`❌ Team "${t.team}" has 0 players in players table!`);
    }
  }

  await client.end();
}

check().catch(console.error);
