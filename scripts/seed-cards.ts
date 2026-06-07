import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

// Load environment variables from .env or .env.local
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
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

// 48 Nations with Codes and Flags
const TEAM_META: Record<string, { code: string; flag: string }> = {
  "Mexico": { code: "MEX", flag: "🇲🇽" },
  "South Africa": { code: "RSA", flag: "🇿🇦" },
  "South Korea": { code: "KOR", flag: "🇰🇷" },
  "Czech Republic": { code: "CZE", flag: "🇨🇿" },
  "Canada": { code: "CAN", flag: "🇨🇦" },
  "Bosnia & Herzegovina": { code: "BIH", flag: "🇧🇦" },
  "Qatar": { code: "QAT", flag: "🇶🇦" },
  "Switzerland": { code: "SUI", flag: "🇨🇭" },
  "Brazil": { code: "BRA", flag: "🇧🇷" },
  "Morocco": { code: "MAR", flag: "🇲🇦" },
  "Haiti": { code: "HAI", flag: "🇭🇹" },
  "Scotland": { code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  "USA": { code: "USA", flag: "🇺🇸" },
  "Paraguay": { code: "PAR", flag: "🇵🇾" },
  "Australia": { code: "AUS", flag: "🇦🇺" },
  "Turkey": { code: "TUR", flag: "🇹🇷" },
  "Germany": { code: "GER", flag: "🇩🇪" },
  "Curaçao": { code: "CUW", flag: "🇨🇼" },
  "Ivory Coast": { code: "CIV", flag: "🇨🇮" },
  "Ecuador": { code: "ECU", flag: "🇪🇨" },
  "Netherlands": { code: "NED", flag: "🇳🇱" },
  "Japan": { code: "JPN", flag: "🇯🇵" },
  "Sweden": { code: "SWE", flag: "🇸🇪" },
  "Tunisia": { code: "TUN", flag: "🇹🇳" },
  "Belgium": { code: "BEL", flag: "🇧🇪" },
  "Egypt": { code: "EGY", flag: "🇪🇬" },
  "Iran": { code: "IRN", flag: "🇮🇷" },
  "New Zealand": { code: "NZL", flag: "🇳🇿" },
  "Spain": { code: "ESP", flag: "🇪🇸" },
  "Cape Verde": { code: "CPV", flag: "🇨🇻" },
  "Saudi Arabia": { code: "KSA", flag: "🇸🇦" },
  "Uruguay": { code: "URU", flag: "🇺🇾" },
  "France": { code: "FRA", flag: "🇫🇷" },
  "Senegal": { code: "SEN", flag: "🇸🇳" },
  "Iraq": { code: "IRQ", flag: "🇮🇶" },
  "Norway": { code: "NOR", flag: "🇳🇴" },
  "Argentina": { code: "ARG", flag: "🇦🇷" },
  "Algeria": { code: "ALG", flag: "🇩🇿" },
  "Austria": { code: "AUT", flag: "🇦🇹" },
  "Jordan": { code: "JOR", flag: "🇯🇴" },
  "Portugal": { code: "POR", flag: "🇵🇹" },
  "DR Congo": { code: "COD", flag: "🇨🇩" },
  "Uzbekistan": { code: "UZB", flag: "🇺🇿" },
  "Colombia": { code: "COL", flag: "🇨🇴" },
  "England": { code: "ENG", flag: "🏴%F0%9F%8F%B4%F2%80%81%A7%F2%80%81%A2%F2%80%81%A5%F2%80%81%AE%F2%80%81%A7%F2%80%81%BF" }, // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  "Croatia": { code: "CRO", flag: "🇭🇷" },
  "Ghana": { code: "GHA", flag: "🇬🇭" },
  "Panama": { code: "PAN", flag: "🇵🇦" },
};

// URL decode flag emojis for Eng/Sco flags
TEAM_META["England"].flag = decodeURIComponent(TEAM_META["England"].flag);

function getRandomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runSeed() {
  console.log("🌱 Starting card system database seeding...");

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to Database.");

    // 1. Seed Teams
    console.log("⚽ Seeding 48 teams...");
    const teamIdMap: Record<string, number> = {};

    for (const [teamName, meta] of Object.entries(TEAM_META)) {
      const res = await client.query(
        `INSERT INTO teams (name, code, flag_emoji)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) 
         DO UPDATE SET code = EXCLUDED.code, flag_emoji = EXCLUDED.flag_emoji
         RETURNING id`,
        [teamName, meta.code, meta.flag]
      );
      teamIdMap[teamName] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(teamIdMap).length} teams.`);

    // 2. Clear existing player_cards before re-seeding
    console.log("🗑️ Clearing existing player cards to avoid duplicates...");
    await client.query("TRUNCATE TABLE player_cards, user_cards, card_drops, card_trades CASCADE");
    await client.query("ALTER SEQUENCE player_cards_id_seq RESTART WITH 1");

    // 3. Load all players from existing `players` table to seed `player_cards`
    console.log("⚽ Loading player names from existing players table...");
    const playersRes = await client.query<{ id: number; team_name: string; name: string }>(
      `SELECT team_name, name FROM players ORDER BY team_name ASC, id ASC`
    );

    const playersByTeam: Record<string, string[]> = {};
    for (const row of playersRes.rows) {
      if (!playersByTeam[row.team_name]) {
        playersByTeam[row.team_name] = [];
      }
      playersByTeam[row.team_name].push(row.name);
    }

    // 4. Seed cards for each player inside a transaction using a single bulk insert
    console.log("🏷️ Seeding player card definitions (in a single bulk query)...");
    let cardCount = 0;
    const values: any[] = [];
    const valueStrings: string[] = [];
    let paramIndex = 1;

    for (const [teamName, squad] of Object.entries(playersByTeam)) {
      const teamId = teamIdMap[teamName];
      if (!teamId) {
        console.warn(`⚠️ Team ID not found for: ${teamName}`);
        continue;
      }

      for (let i = 0; i < squad.length; i++) {
        const playerName = squad[i];
        const jerseyNumber = i + 1;

        // Position breakdown (exactly 26 players per squad, indexes 0 to 25)
        let position: "GK" | "DEF" | "MID" | "FWD" = "MID";
        if (i < 2) position = "GK";
        else if (i < 10) position = "DEF";
        else if (i < 18) position = "MID";
        else position = "FWD";

        // Rarity tier breakdown: 14 Common, 8 Rare, 3 Epic, 1 Legendary
        let rarity: "common" | "rare" | "epic" | "legendary" = "common";
        let minRating = 60, maxRating = 74;
        let minStat = 45, maxStat = 74;

        if (i < 14) {
          rarity = "common";
          minRating = 60; maxRating = 74;
          minStat = 45; maxStat = 74;
        } else if (i < 22) {
          rarity = "rare";
          minRating = 75; maxRating = 82;
          minStat = 70; maxStat = 82;
        } else if (i < 25) {
          rarity = "epic";
          minRating = 83; maxRating = 89;
          minStat = 80; maxStat = 89;
        } else {
          rarity = "legendary";
          minRating = 90; maxRating = 99;
          minStat = 90; maxStat = 99;
        }

        const overallRating = getRandomStat(minRating, maxRating);
        const stats = {
          pace: getRandomStat(minStat, maxStat),
          shooting: getRandomStat(minStat, maxStat),
          passing: getRandomStat(minStat, maxStat),
          defending: getRandomStat(minStat, maxStat),
        };

        valueStrings.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
        values.push(teamId, playerName, position, jerseyNumber, rarity, overallRating, JSON.stringify(stats));
        paramIndex += 7;
        cardCount++;
      }
    }

    if (valueStrings.length > 0) {
      await client.query("BEGIN");
      const bulkInsertQuery = `
        INSERT INTO player_cards (team_id, player_name, position, jersey_number, rarity, overall_rating, stats)
        VALUES ${valueStrings.join(", ")}
      `;
      await client.query(bulkInsertQuery, values);
      await client.query("COMMIT");
    }

    console.log(`🎉 Seeding completed. Successfully created ${cardCount} player cards.`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Connection closed.");
  }
}

runSeed();
