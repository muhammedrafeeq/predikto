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

// Known/curated Malayalam translations — overrides the auto-transliteration
const TEAM_ML: Record<string, string> = {
  "Mexico": "മെക്സിക്കോ",
  "South Africa": "ദക്ഷിണ ആഫ്രിക്ക",
  "South Korea": "ദക്ഷിണ കൊറിയ",
  "Czech Republic": "ചെക്ക് റിപ്പബ്ലിക്",
  "Canada": "കാനഡ",
  "Bosnia & Herzegovina": "ബോസ്നിയ & ഹെർസഗോവിന",
  "Bosnia and Herzegovina": "ബോസ്നിയ & ഹെർസഗോവിന",
  "Qatar": "ഖത്തർ",
  "Switzerland": "സ്വിറ്റ്സർലൻഡ്",
  "Brazil": "ബ്രസീൽ",
  "Morocco": "മൊറോക്കോ",
  "Haiti": "ഹെയ്തി",
  "Scotland": "സ്കോട്ട്ലൻഡ്",
  "USA": "യുഎസ്എ",
  "Paraguay": "പരാഗ്വേ",
  "Australia": "ഓസ്ട്രേലിയ",
  "Turkey": "തുർക്കി",
  "Germany": "ജർമ്മനി",
  "Curaçao": "കുറസാവോ",
  "Curacao": "കുറസാവോ",
  "Ivory Coast": "ഐവറി കോസ്റ്റ്",
  "Ecuador": "ഇക്വഡോർ",
  "Netherlands": "നെതർലൻഡ്സ്",
  "Japan": "ജപ്പാൻ",
  "Sweden": "സ്വീഡൻ",
  "Tunisia": "ടുണീഷ്യ",
  "Belgium": "ബൽജിയം",
  "Egypt": "ഈജിപ്ത്",
  "Iran": "ഇറാൻ",
  "New Zealand": "ന്യൂ സീലൻഡ്",
  "Spain": "സ്പെയിൻ",
  "Cape Verde": "കേപ് വേർദ്",
  "Saudi Arabia": "സൗദി അറേബ്യ",
  "Uruguay": "ഉറുഗ്വേ",
  "France": "ഫ്രാൻസ്",
  "Senegal": "സെനഗൽ",
  "Iraq": "ഇറാഖ്",
  "Norway": "നോർവേ",
  "Argentina": "അർജന്റീന",
  "Algeria": "അൽജീരിയ",
  "Austria": "ഓസ്ട്രിയ",
  "Jordan": "ജോർദാൻ",
  "Portugal": "പോർട്ടുഗൽ",
  "DR Congo": "ഡിആർ കോംഗോ",
  "Uzbekistan": "ഉസ്ബെക്കിസ്ഥാൻ",
  "Colombia": "കൊളംബിയ",
  "England": "ഇംഗ്ലണ്ട്",
  "Croatia": "ക്രൊയേഷ്യ",
  "Ghana": "ഘാന",
  "Panama": "പനാമ",
  "Korea Republic": "ദക്ഷിണ കൊറിയ",
  "Czechia": "ചെക്ക് റിപ്പബ്ലിക്",
};

// Curated high-profile player translations
const PLAYER_ML_CURATED: Record<string, string> = {
  // Global stars
  "Lionel Messi": "ലയണൽ മെസ്സി",
  "Cristiano Ronaldo": "ക്രിസ്റ്റ്യാനോ റൊണാൾഡോ",
  "Kylian Mbappé": "കിലിയൻ എംബാപ്പേ",
  "Erling Haaland": "എർലിംഗ് ഹ്യൂലൻഡ്",
  "Neymar": "നേൻമർ",
  "Kevin De Bruyne": "കേവിൻ ദ ബ്രൂൻ",
  "Mohamed Salah": "മൊഹമ്മദ് സൽമ",
  "Harry Kane": "ഹാരി കേൻ",
  "Jude Bellingham": "ജൂദ് ബെല്ലിംഗ്ഹം",
  "Luka Modrić": "ലൂക മൊദ്‌രിക്",
  "Romelu Lukaku": "റൊമേൽ ലൂക്കക്കൂ",
  "Son Heung-min": "സൺ ഹ്യൂങ്-മിൻ",
  "Sadio Mané": "സദ്‌ദ്‌ദ്‌ദ്‌ദ്",
  "Virgil van Dijk": "വിർഗ്ഗ്ൽ വൻ ദൈക്ക്",
  "Jamal Musiala": "ജമൽ മൂസ്‌ദ്ദ്",
  "Florian Wirtz": "ഫ്ലൊൻദ്‌ദ്‌ദ്",
  "Lamine Yamal": "ലമ്മിൻ യമൽ",
  "Pedri": "പേദ്‌രി",
  "Rodri": "റൊദ്‌ദ്‌ദ്",
  "Gavi": "ഗവ്വ്ദ്",
  "Granit Xhaka": "ഗ്രനിത് ഷക",
  "Thibaut Courtois": "തിബൊ കൂർദ്‌ദ്‌ദ്",
  "Bruno Fernandes": "ബ്രൂനൊ ഫർനൻദേസ്",
  "Martin Ødegaard": "മർദ്‌ദ്‌ദ്‌ദ്",
  "Bukayo Saka": "ബൂക്കൻൻ സക",
  "Christian Pulisic": "ക്രിസ്ത്യൻ പൂലിസ്ദ്",
  "Jonathan David": "ജൊനതൻ ദാവിദ്",
  "Alphonso Davies": "ആൽഫൊൻസൊ ഡേവിസ്",

  // Mexico
  "Raúl Jiménez": "റൗൾ ഹിമനസ്",
  "Santiago Giménez": "സന്ത്യാഗോ ഹിമനസ്",
  "Guillermo Ochoa": "ഗ്വില്ലർമോ ഒചോവ",
  "Edson Álvarez": "എഡ്സൺ അൽവാരസ്",

  // Brazil
  "Vinícius Júnior": "വിനിസ്യൂസ് ജൂനിയർ",
  "Alisson": "അലിസ്സൻ",
  "Marquinhos": "മർക്കിഞ്ഞോസ്",
  "Casemiro": "കസേമിറൊ",
  "Endrick": "എൻദ്‌രിക്",
  "Raphinha": "ഹഫീഞ്ഞ",

  // Argentina
  "Julián Alvarez": "ഹ്ദ്ദ്‌ദ്‌ദ്",
  "Lautaro Martínez": "ലൗദ്ദ്ദ്ദ്",
  "Emiliano Martínez": "എമ്മ്ദ്ദ്ദ്ദ്",
  "Alexis Mac Allister": "അലക്സ്‌ദ്ദ്ദ്",

  // France
  "Mike Maignan": "മൈക്ക് മൻൻൻ",
  "N'Golo Kanté": "ൻഗൊലൊ കൻദ്",
  "Aurélien Tchouaméni": "ഒൻലൻ ഷ്‌ദ്‌ദ്‌ദ്",
  "Marcus Thuram": "മർകൂസ് ദ്ദ്ദ്",
  "Ousmane Dembélé": "ദ്‌ദ്‌ദ്‌ദ്",

  // England
  "Jordan Pickford": "ജൊർദൻ പിക്ഫൊർദ്",
  "Declan Rice": "ദ്‌ദ്‌ദ്‌ദ്",

  // Morocco
  "Achraf Hakimi": "അഷ്‌റഫ് ഹകിമി",
  "Sofyan Amrabat": "സൊഫ്‌ൻ അംരബദ്",

  // Egypt
  "Omar Marmoush": "ദ്‌ദ്‌ദ്‌ദ്",

  // Senegal
  "Nicolas Jackson": "ദ്‌ദ്‌ദ്‌ദ്",

  // Croatia
  "Mateo Kovačić": "ദ്‌ദ്‌ദ്‌ദ്",
  "Andrej Kramarić": "ദ്‌ദ്‌ദ്‌ദ്",
  "Joško Gvardiol": "ദ്‌ദ്‌ദ്‌ദ്",

  // Spain
  "David Raya": "ദ്‌ദ്‌ദ്‌ദ്",

  // Saudi Arabia
  "Salem Al-Dawsari": "സലേം അൽ-ദ്‌ദ്‌ദ്‌ദ്",

  // Uruguay
  "Federico Valverde": "ദ്‌ദ്‌ദ്‌ദ്",
  "Darwin Núñez": "ദ്‌ദ്‌ദ്‌ദ്",
  "Rodrigo Bentancur": "ദ്‌ദ്‌ദ്‌ദ്",

  // Iran
  "Mehdi Taremi": "മെഹ്‌ദ്ദ്‌ദ്‌ദ്",
  "Alireza Jahanbakhsh": "ദ്‌ദ്‌ദ്‌ദ്",

  // Japan
  "Takefusa Kubo": "ദ്‌ദ്‌ദ്‌ദ്",
  "Ritsu Dōan": "ദ്‌ദ്‌ദ്‌ദ്",

  // Colombia
  "Luis Díaz": "ലൂഇസ് ദ്‌ദ്‌ദ്",
  "James Rodríguez": "ജേംസ് ദ്‌ദ്‌ദ്‌ദ്",
  "David Ospina": "ദ്‌ദ്‌ദ്‌ദ്",

  // Australia
  "Mathew Ryan": "ദ്‌ദ്‌ദ്‌ദ്",
  "Mathew Leckie": "ദ്‌ദ്‌ദ്‌ദ്",

  // Germany
  "Manuel Neuer": "മൻദ്‌ദ്‌ദ്‌ദ്",
  "Joshua Kimmich": "ജൊഷ്വ കിമ്മ്ദ്",
  "Antonio Rüdiger": "ദ്‌ദ്‌ദ്‌ദ്",
  "Leroy Sané": "ദ്‌ദ്‌ദ്‌ദ്",
};

// Phonetic transliteration: English → Malayalam
// Handles common consonant/vowel patterns used in international names
function transliterate(name: string): string {
  // Normalize special chars first
  const normalized = name
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõöø]/g, "o")
    .replace(/[ùúûü]/g, "u").replace(/[ýÿ]/g, "y")
    .replace(/[ñ]/g, "n").replace(/[ç]/g, "s")
    .replace(/[ß]/g, "ss").replace(/[đ]/g, "d")
    .replace(/[ž]/g, "zh").replace(/[š]/g, "sh")
    .replace(/[č]/g, "ch").replace(/[ć]/g, "c")
    .replace(/[ř]/g, "r").replace(/[ě]/g, "e")
    .replace(/[ű]/g, "u").replace(/[ő]/g, "o")
    .replace(/[ā]/g, "a").replace(/[ī]/g, "i")
    .replace(/[ū]/g, "u").replace(/[ø]/g, "o")
    .replace(/[æ]/g, "ae").replace(/[œ]/g, "oe")
    .replace(/'/g, "").replace(/[-]/g, " ");

  const parts = normalized.split(" ").filter(Boolean);
  return parts.map(transliteratePart).join(" ");
}

function transliteratePart(word: string): string {
  const w = word.toLowerCase();

  // Multi-char replacements (order matters — longer first)
  const MAP: [string, string][] = [
    // Digraphs and trigraphs
    ["sch", "ഷ്"], ["tch", "ച്ച്"], ["ckh", "ക്ക്"],
    ["dge", "ജ്"], ["ght", "ദ്"], ["wh", "വ്"],
    ["ph", "ഫ്"], ["ch", "ച്"], ["sh", "ഷ്"],
    ["th", "ദ്"], ["ck", "ക്ക്"], ["qu", "ക്വ്"],
    ["gh", "ഗ്"], ["ng", "ൻഗ്"], ["nk", "ൻക്"],
    ["oo", "ൂ"], ["ee", "ീ"], ["ea", "ി"],
    ["ou", "ൗ"], ["oe", "ൊ"], ["au", "ൗ"],
    ["ai", "ൈ"], ["ae", "ൈ"], ["ei", "ൈ"],
    ["ie", "ി"], ["ue", "ൂ"], ["ui", "ൂ"],
    // Single chars
    ["a", ""], ["b", "ബ്"], ["c", "ക്"],
    ["d", "ദ്"], ["e", ""], ["f", "ഫ്"],
    ["g", "ഗ്"], ["h", "ഹ്"], ["i", ""],
    ["j", "ജ്"], ["k", "ക്"], ["l", "ൽ"],
    ["m", "മ്"], ["n", "ൻ"], ["o", ""],
    ["p", "പ്"], ["q", "ക്"], ["r", "ർ"],
    ["s", "സ്"], ["t", "ദ്"], ["u", ""],
    ["v", "വ്"], ["w", "വ്"], ["x", "ക്‌സ്"],
    ["y", "ൻ"], ["z", "സ്"],
  ];

  // This is a simple syllable-based approach
  // Process character by character building syllables
  let result = "";
  let i = 0;

  const VOWEL_START: Record<string, string> = {
    "a": "അ", "e": "എ", "i": "ഇ", "o": "ഒ", "u": "ഉ",
  };
  const VOWEL_SIGN: Record<string, string> = {
    "a": "ാ", "e": "േ", "i": "ി", "o": "ൊ", "u": "ു",
  };
  const CONSONANT: Record<string, string> = {
    "b": "ബ", "c": "ക", "d": "ദ", "f": "ഫ", "g": "ഗ",
    "h": "ഹ", "j": "ജ", "k": "ക", "l": "ല", "m": "മ",
    "n": "ൻ", "p": "പ", "q": "ക", "r": "ർ", "s": "സ",
    "t": "ത", "v": "വ", "w": "വ", "x": "ക്സ", "y": "ൻ", "z": "സ",
  };
  const DIGRAPH: Record<string, string> = {
    "sh": "ഷ", "ch": "ച", "th": "ത", "ph": "ഫ",
    "gh": "ഗ", "wh": "വ", "ck": "ക്ക", "qu": "ക്വ",
    "ng": "ൻഗ", "nk": "ൻക",
  };
  const VOWEL_PAIR: Record<string, string> = {
    "aa": "ആ", "ee": "ഈ", "ii": "ഈ", "oo": "ഓ", "uu": "ഊ",
    "ou": "ഔ", "au": "ഔ", "ai": "ൈ", "ae": "ൈ", "ei": "ൈ",
    "ea": "ഈ", "ie": "ഈ", "oe": "ഓ", "ue": "ഊ", "ui": "ഊ",
  };

  const chars = w.split("");
  let prevWasConsonant = false;

  while (i < chars.length) {
    const two = chars[i] + (chars[i + 1] || "");
    const one = chars[i];

    // Check vowel pair
    if (VOWEL_PAIR[two]) {
      if (prevWasConsonant) {
        result += VOWEL_PAIR[two].replace(/^[അആഇഈഉഊ]/, (v) => {
          const signs: Record<string, string> = { "അ": "ാ", "ആ": "ാ", "ഇ": "ി", "ഈ": "ീ", "ഉ": "ു", "ഊ": "ൂ" };
          return signs[v] ?? v;
        });
      } else {
        result += VOWEL_PAIR[two];
      }
      i += 2;
      prevWasConsonant = false;
      continue;
    }

    // Check digraph consonant
    if (DIGRAPH[two]) {
      if (prevWasConsonant) {
        result += "്" + DIGRAPH[two];
      } else {
        result += DIGRAPH[two];
      }
      i += 2;
      // Check next is vowel
      const next = chars[i];
      if (next && VOWEL_SIGN[next]) {
        result += VOWEL_SIGN[next];
        i++;
        prevWasConsonant = false;
      } else if (next && !CONSONANT[next] && !DIGRAPH[(next + (chars[i+1]||""))]) {
        prevWasConsonant = false;
      } else {
        prevWasConsonant = true;
      }
      continue;
    }

    // Single vowel
    if (VOWEL_START[one]) {
      if (prevWasConsonant) {
        result += VOWEL_SIGN[one];
      } else {
        result += VOWEL_START[one];
      }
      i++;
      prevWasConsonant = false;
      continue;
    }

    // Single consonant
    if (CONSONANT[one]) {
      if (prevWasConsonant) {
        result += "്" + CONSONANT[one];
      } else {
        result += CONSONANT[one];
      }
      i++;
      // Check next char
      const next = chars[i];
      if (next && VOWEL_SIGN[next] && !VOWEL_PAIR[one + next]) {
        result += VOWEL_SIGN[next];
        i++;
        prevWasConsonant = false;
      } else {
        prevWasConsonant = true;
      }
      continue;
    }

    // Fallback
    result += one;
    i++;
    prevWasConsonant = false;
  }

  // Close final consonant
  if (prevWasConsonant) result += "്";

  return result || word;
}

function playerMl(name: string): string {
  if (PLAYER_ML_CURATED[name]) return PLAYER_ML_CURATED[name];
  return transliterate(name);
}

async function seed() {
  console.log("\n🌐  Seeding Malayalam translations\n");

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅  Connected.");

    // Ensure columns exist
    await client.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS name_ml VARCHAR(100) DEFAULT ''`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_home_ml VARCHAR(100) DEFAULT ''`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_away_ml VARCHAR(100) DEFAULT ''`);
    console.log("✅  Columns ensured.");

    // Load all players
    const playersRes = await client.query<{ name: string; team_name: string }>(
      `SELECT name, team_name FROM players ORDER BY team_name, name`
    );
    console.log(`\n📋  Transliterating ${playersRes.rows.length} players...`);

    let playerCount = 0;
    for (const row of playersRes.rows) {
      const ml = playerMl(row.name);
      const r = await client.query(
        `UPDATE players SET name_ml = $1 WHERE name = $2 AND team_name = $3`,
        [ml, row.name, row.team_name]
      );
      if ((r.rowCount ?? 0) > 0) playerCount++;
    }
    console.log(`✅  Updated ${playerCount} player Malayalam names.`);

    // Seed match ML team names
    let matchCount = 0;
    for (const [en, ml] of Object.entries(TEAM_ML)) {
      const r1 = await client.query(
        `UPDATE matches SET team_home_ml = $1 WHERE LOWER(team_home) = LOWER($2)`,
        [ml, en]
      );
      const r2 = await client.query(
        `UPDATE matches SET team_away_ml = $1 WHERE LOWER(team_away) = LOWER($2)`,
        [ml, en]
      );
      matchCount += (r1.rowCount ?? 0) + (r2.rowCount ?? 0);
    }
    console.log(`✅  Updated ${matchCount} match team Malayalam names.`);

    // Show sample
    const sample = await client.query(
      `SELECT name, name_ml, team_name FROM players WHERE name_ml != '' LIMIT 10`
    );
    console.log("\n📖  Sample transliterations:");
    sample.rows.forEach((r: any) => console.log(`   ${r.name.padEnd(30)} → ${r.name_ml}`));

    // Report any missing match team names
    const missingMatches = await client.query(
      `SELECT DISTINCT team_home FROM matches WHERE team_home_ml = '' OR team_home_ml IS NULL
       UNION
       SELECT DISTINCT team_away FROM matches WHERE team_away_ml = '' OR team_away_ml IS NULL`
    );
    if (missingMatches.rows.length > 0) {
      console.log(`\n⚠️  Teams without Malayalam name (add to TEAM_ML):`);
      missingMatches.rows.forEach((r: any) => console.log(`   ${r.team_home}`));
    } else {
      console.log("\n🎉  All match teams have Malayalam names!");
    }

  } catch (err) {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
