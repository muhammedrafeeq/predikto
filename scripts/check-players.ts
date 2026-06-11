import { query } from "../lib/db";

const teams = [
  "Brazil", "France", "Argentina", "Portugal", "Spain", "England", "Germany",
  "Netherlands", "Belgium", "Croatia", "Morocco", "Uruguay", "Colombia",
  "Sweden", "Norway", "Serbia", "Australia", "Mexico", "Canada",
  "Korea Republic", "Japan", "Senegal", "Egypt", "USA", "Austria"
];

async function main() {
  for (const team of teams) {
    const res = await query(
      "SELECT name, is_star FROM players WHERE LOWER(team_name) = LOWER($1) ORDER BY name ASC",
      [team]
    );
    if (res.rows.length === 0) continue;
    const stars = res.rows.filter((r: any) => r.is_star).map((r: any) => r.name);
    const all = res.rows.map((r: any) => r.name);
    console.log(`\n${team} (${res.rows.length} players, ${stars.length} ⭐):`);
    console.log("  All: " + all.join(", "));
    if (stars.length) console.log("  Stars: " + stars.join(", "));
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
