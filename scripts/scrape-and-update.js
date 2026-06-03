const fs = require("fs");
const path = require("path");

const originalTeams = [
  "Mexico", "South Africa", "South Korea", "Czech Republic",
  "Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland",
  "Brazil", "Morocco", "Haiti", "Scotland",
  "USA", "Paraguay", "Australia", "Turkey",
  "Germany", "Curaçao", "Ivory Coast", "Ecuador",
  "Netherlands", "Japan", "Sweden", "Tunisia",
  "Belgium", "Egypt", "Iran", "New Zealand",
  "Spain", "Cape Verde", "Saudi Arabia", "Uruguay",
  "France", "Senegal", "Iraq", "Norway",
  "Argentina", "Algeria", "Austria", "Jordan",
  "Portugal", "DR Congo", "Uzbekistan", "Colombia",
  "England", "Croatia", "Ghana", "Panama"
];

function getSeedTeamName(wikiName) {
  if (wikiName === "United States") return "USA";
  if (wikiName === "Bosnia and Herzegovina") return "Bosnia & Herzegovina";
  return wikiName;
}

async function scrape() {
  console.log("🌐 Fetching Wikipedia squads page...");
  const res = await fetch("https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads");
  const html = await res.text();
  console.log("✅ Page fetched. Parsing squads...");

  // Find all headings: h2, h3 or h4
  const teamHeadingRegex = /<h[234] id="([^"]+)">([\s\S]*?)<\/h[234]>/g;
  const matches = [...html.matchAll(teamHeadingRegex)];
  const headings = matches.map(m => {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    return { id: m[1], text, index: m.index, fullMatch: m[0] };
  });

  const squads = {};

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const teamName = getSeedTeamName(heading.text);

    if (!originalTeams.includes(teamName)) {
      continue; // Skip other headings not in our 48 teams
    }

    // Get HTML between this heading and the next heading (h2 or h3 or h4 or end of page)
    const startIdx = heading.index + heading.fullMatch.length;
    let endIdx = -1;
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].index > startIdx) {
        endIdx = headings[j].index;
        break;
      }
    }

    const section = html.slice(startIdx, endIdx !== -1 ? endIdx : html.length);

    // Find all player names in this section
    const thMatches = [...section.matchAll(/<th[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/g)];
    const players = [];

    for (const th of thMatches) {
      const thContent = th[1];
      const aMatch = thContent.match(/<a href="[^"]*"[^>]*>([^<]+)<\/a>/);
      if (aMatch) {
        let playerName = aMatch[1].trim();
        // Remove any footnotes or garbage
        playerName = playerName.replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
        if (playerName && !playerName.includes("Position") && !playerName.includes("Player") && !playerName.includes("Coach")) {
          players.push(playerName);
        }
      }
    }

    if (players.length > 0) {
      squads[teamName] = players;
      console.log(`✓ Scraped ${teamName}: ${players.length} players`);
    } else {
      console.log(`⚠️ Warning: No players parsed for ${teamName}`);
    }
  }

  console.log(`\nTotal squads scraped: ${Object.keys(squads).length} / 48`);

  // Write to scripts/seed-fifa2026.ts
  const seedPath = path.join(process.cwd(), "scripts", "seed-fifa2026.ts");
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ seed-fifa2026.ts not found at ${seedPath}`);
    return;
  }

  let seedContent = fs.readFileSync(seedPath, "utf8");

  // Format SQUADS object as string
  let squadsString = "const SQUADS: Record<string, string[]> = {\n";
  for (const team of originalTeams) {
    const players = squads[team] || [];
    const playersFormatted = players.map(p => `"${p.replace(/"/g, '\\"')}"`).join(", ");
    squadsString += `  "${team}": [${playersFormatted}],\n`;
  }
  squadsString += "};";

  // Replace existing const SQUADS block in seed script
  const startMarker = "const SQUADS: Record<string, string[]> = {";
  const startIdx = seedContent.indexOf(startMarker);
  if (startIdx === -1) {
    console.error("❌ Could not find start of SQUADS declaration in seed-fifa2026.ts");
    return;
  }

  // Find closing block of SQUADS
  const endIdx = seedContent.indexOf("};", startIdx);
  if (endIdx === -1) {
    console.error("❌ Could not find end of SQUADS declaration in seed-fifa2026.ts");
    return;
  }

  const newSeedContent = seedContent.slice(0, startIdx) + squadsString + seedContent.slice(endIdx + 2);
  fs.writeFileSync(seedPath, newSeedContent, "utf8");
  console.log("🎉 Successfully updated scripts/seed-fifa2026.ts with scraped squads!");
}

scrape().catch(console.error);
