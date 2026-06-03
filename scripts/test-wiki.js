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

async function run() {
  try {
    const res = await fetch("https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads");
    const html = await res.text();
    
    // Find all headings: h2, h3 or h4
    const teamHeadingRegex = /<h[234] id="([^"]+)">([\s\S]*?)<\/h[234]>/g;
    const matches = [...html.matchAll(teamHeadingRegex)];
    const headings = matches.map(m => {
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      return { id: m[1], text };
    });
    
    console.log("Original Teams count:", originalTeams.length);
    console.log("Wikipedia parsed Headings count:", headings.length);
    
    const missing = [];
    for (const t of originalTeams) {
      if (headings.some(h => h.text === t)) continue;
      
      const normalized = headings.find(h => h.text.toLowerCase() === t.toLowerCase());
      if (normalized) {
        console.log(`Casing mismatch: "${t}" vs Wikipedia "${normalized.text}"`);
        continue;
      }
      
      if (t === "USA" && headings.some(h => h.text === "United States")) continue;
      if (t === "Bosnia & Herzegovina" && headings.some(h => h.text === "Bosnia and Herzegovina")) continue;
      
      missing.push(t);
    }
    
    console.log("Missing teams from Wikipedia headings:", missing);
  } catch (err) {
    console.error(err);
  }
}
run();
