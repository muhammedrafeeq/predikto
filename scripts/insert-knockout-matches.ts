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

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) { console.error("❌  DATABASE_URL not set"); process.exit(1); }

// Times are IST (UTC+5:30). Convert IST "DD Mon HH:MM AM/PM" to UTC ISO.
function istToUtc(dateStr: string, timeStr: string): string {
  // dateStr e.g. "2026-06-29", timeStr e.g. "12:30 AM"
  const [timePart, ampm] = timeStr.trim().split(" ");
  let [h, m] = timePart.split(":").map(Number);
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  // IST = UTC+5:30, so UTC = IST - 5:30
  const istMinutes = h * 60 + m;
  let utcMinutes = istMinutes - (5 * 60 + 30);
  let dayOffset = 0;
  if (utcMinutes < 0) { utcMinutes += 24 * 60; dayOffset = -1; }
  if (utcMinutes >= 24 * 60) { utcMinutes -= 24 * 60; dayOffset = 1; }
  const uh = Math.floor(utcMinutes / 60);
  const um = utcMinutes % 60;
  const base = new Date(dateStr + "T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return `${base.toISOString().slice(0, 10)}T${String(uh).padStart(2, "0")}:${String(um).padStart(2, "0")}:00Z`;
}

interface MatchDef {
  matchNo: number;
  home: string;
  away: string;
  date: string;       // YYYY-MM-DD
  istTime: string;    // "HH:MM AM/PM"
  round: string;
}

// Round of 32 — times converted from user-provided IST kickoff times
const ROUND_OF_32: MatchDef[] = [
  { matchNo: 73, home: "2A",        away: "2B",           date: "2026-06-29", istTime: "12:30 AM", round: "Round of 32" },
  { matchNo: 74, home: "Germany",   away: "3rd A/B/C/D/F",date: "2026-06-30", istTime: "2:00 AM",  round: "Round of 32" },
  { matchNo: 75, home: "1F",        away: "2C",           date: "2026-06-30", istTime: "6:30 AM",  round: "Round of 32" },
  { matchNo: 76, home: "1C",        away: "2F",           date: "2026-06-29", istTime: "10:30 PM", round: "Round of 32" },
  { matchNo: 77, home: "1I",        away: "3rd C/D/F/G/H",date: "2026-07-01", istTime: "2:30 AM",  round: "Round of 32" },
  { matchNo: 78, home: "2E",        away: "2I",           date: "2026-06-30", istTime: "10:30 PM", round: "Round of 32" },
  { matchNo: 79, home: "Mexico",    away: "3rd C/E/F/H/I",date: "2026-07-01", istTime: "6:30 AM",  round: "Round of 32" },
  { matchNo: 80, home: "1L",        away: "3rd E/H/I/J/K",date: "2026-07-01", istTime: "9:30 PM",  round: "Round of 32" },
  { matchNo: 81, home: "USA",       away: "3rd B/E/F/I/J",date: "2026-07-02", istTime: "5:30 AM",  round: "Round of 32" },
  { matchNo: 82, home: "1G",        away: "3rd A/E/H/I/J",date: "2026-07-02", istTime: "1:30 AM",  round: "Round of 32" },
  { matchNo: 83, home: "2K",        away: "2L",           date: "2026-07-03", istTime: "4:30 AM",  round: "Round of 32" },
  { matchNo: 84, home: "1H",        away: "2J",           date: "2026-07-03", istTime: "12:30 AM", round: "Round of 32" },
  { matchNo: 85, home: "1B",        away: "3rd E/F/G/I/J",date: "2026-07-03", istTime: "8:30 AM",  round: "Round of 32" },
  { matchNo: 86, home: "1J",        away: "2H",           date: "2026-07-04", istTime: "3:30 AM",  round: "Round of 32" },
  { matchNo: 87, home: "1K",        away: "3rd D/E/I/J/L",date: "2026-07-04", istTime: "7:00 AM",  round: "Round of 32" },
  { matchNo: 88, home: "2D",        away: "2G",           date: "2026-07-03", istTime: "11:30 PM", round: "Round of 32" },
];

// Round of 16
const ROUND_OF_16: MatchDef[] = [
  { matchNo: 89, home: "RD32 W2",  away: "RD32 W5",  date: "2026-07-05", istTime: "2:30 AM",  round: "Round of 16" },
  { matchNo: 90, home: "RD32 W1",  away: "RD32 W3",  date: "2026-07-04", istTime: "10:30 PM", round: "Round of 16" },
  { matchNo: 91, home: "RD32 W4",  away: "RD32 W6",  date: "2026-07-06", istTime: "1:30 AM",  round: "Round of 16" },
  { matchNo: 92, home: "RD32 W7",  away: "RD32 W8",  date: "2026-07-06", istTime: "5:30 AM",  round: "Round of 16" },
  { matchNo: 93, home: "RD32 W11", away: "RD32 W12", date: "2026-07-07", istTime: "12:30 AM", round: "Round of 16" },
  { matchNo: 94, home: "RD32 W9",  away: "RD32 W10", date: "2026-07-07", istTime: "5:30 AM",  round: "Round of 16" },
  { matchNo: 95, home: "RD32 W14", away: "RD32 W16", date: "2026-07-07", istTime: "9:30 PM",  round: "Round of 16" },
  { matchNo: 96, home: "RD32 W13", away: "RD32 W15", date: "2026-07-08", istTime: "1:30 AM",  round: "Round of 16" },
];

// 3rd Place
const THIRD_PLACE: MatchDef[] = [
  { matchNo: 104, home: "SF L1", away: "SF L2", date: "2026-07-19", istTime: "2:30 AM", round: "3rd Place" },
];

// Final
const FINAL: MatchDef[] = [
  { matchNo: 103, home: "SF W1", away: "SF W2", date: "2026-07-20", istTime: "12:30 AM", round: "Final" },
];

// Semi-Finals
const SEMI_FINALS: MatchDef[] = [
  { matchNo: 101, home: "QF W1", away: "QF W2", date: "2026-07-15", istTime: "12:30 AM", round: "Semi-Final" },
  { matchNo: 102, home: "QF W3", away: "QF W4", date: "2026-07-16", istTime: "12:30 AM", round: "Semi-Final" },
];

// Quarter-Finals
const QUARTER_FINALS: MatchDef[] = [
  { matchNo: 97,  home: "RD16 W1", away: "RD16 W2", date: "2026-07-10", istTime: "1:30 AM",  round: "Quarter-Final" },
  { matchNo: 98,  home: "RD16 W5", away: "RD16 W6", date: "2026-07-11", istTime: "12:30 AM", round: "Quarter-Final" },
  { matchNo: 99,  home: "RD16 W3", away: "RD16 W4", date: "2026-07-12", istTime: "2:30 AM",  round: "Quarter-Final" },
  { matchNo: 100, home: "RD16 W7", away: "RD16 W8", date: "2026-07-12", istTime: "6:30 AM",  round: "Quarter-Final" },
];

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Ensure round column exists
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(100) DEFAULT ''`);

    // Update existing group stage matches with round label
    await client.query(`UPDATE matches SET round = 'Group Stage' WHERE round = '' AND match_time < '2026-06-29'::timestamptz`);

    const allMatches = [...THIRD_PLACE, ...FINAL];
    let inserted = 0;
    let skipped = 0;

    for (const m of allMatches) {
      const utcTime = istToUtc(m.date, m.istTime);
      const matchTime = new Date(utcTime);
      const deadline = new Date(matchTime.getTime() - 60 * 60 * 1000);

      // Check if match already exists (same home/away/time)
      const existing = await client.query(
        `SELECT id FROM matches WHERE team_home = $1 AND team_away = $2 AND DATE(match_time) = DATE($3::timestamptz)`,
        [m.home, m.away, matchTime]
      );

      if (existing.rows.length > 0) {
        // Update round on existing match
        await client.query(`UPDATE matches SET round = $1 WHERE id = $2`, [m.round, existing.rows[0].id]);
        console.log(`  [SKIP] Match ${m.matchNo}: ${m.home} vs ${m.away} already exists, updated round`);
        skipped++;
        continue;
      }

      const mRes = await client.query(
        `INSERT INTO matches (tournament_id, team_home, team_away, match_time, deadline, status, round)
         VALUES (1, $1, $2, $3, $4, 'upcoming', $5) RETURNING id`,
        [m.home, m.away, matchTime, deadline, m.round]
      );
      const matchId = mRes.rows[0].id;

      await client.query(`INSERT INTO questions (match_id, type, label, points) VALUES ($1,'winner','Match Winner',2)`, [matchId]);
      await client.query(`INSERT INTO questions (match_id, type, label, points) VALUES ($1,'score','Exact Scoreline',4)`, [matchId]);
      await client.query(`INSERT INTO questions (match_id, type, label, points) VALUES ($1,'scorer','First Goalscorer',2)`, [matchId]);

      console.log(`  [INSERT] Match ${m.matchNo}: ${m.home} vs ${m.away} @ ${matchTime.toISOString()} [${m.round}]`);
      inserted++;
    }

    const total = await client.query("SELECT COUNT(*) FROM matches");
    console.log(`\n✅  Done! Inserted: ${inserted}, Skipped/Updated: ${skipped}, Total matches: ${total.rows[0].count}`);
  } catch (err) {
    console.error("❌  Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
