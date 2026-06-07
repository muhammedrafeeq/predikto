import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const TEAM_ML: Record<string, string> = {
  "Mexico": "മെക്സിക്കോ", "South Africa": "ദക്ഷിണ ആഫ്രിക്ക", "South Korea": "ദക്ഷിണ കൊറിയ",
  "Czech Republic": "ചെക്ക് റിപ്പബ്ലിക്", "Canada": "കാനഡ", "Bosnia & Herzegovina": "ബോസ്നിയ",
  "Qatar": "ഖത്തർ", "Switzerland": "സ്വിറ്റ്‌സർലൻഡ്", "Brazil": "ബ്രസീൽ",
  "Morocco": "മൊറോക്കോ", "Haiti": "ഹെയ്തി", "Scotland": "സ്കോട്ട്‌ലൻഡ്",
  "USA": "അമേരിക്ക", "Paraguay": "പരാഗ്വേ", "Australia": "ഓസ്ട്രേലിയ",
  "Turkey": "തുർക്കി", "Germany": "ജർമ്മനി", "Curaçao": "കുരക്കാവോ",
  "Ivory Coast": "ഐവറി കോസ്റ്റ്", "Ecuador": "ഇക്വഡോർ", "Netherlands": "നെതർലൻഡ്സ്",
  "Japan": "ജപ്പാൻ", "Sweden": "സ്വീഡൻ", "Tunisia": "ടുണീഷ്യ",
  "Belgium": "ബെൽജിയം", "Egypt": "ഈജിപ്ത്", "Iran": "ഇറാൻ",
  "New Zealand": "ന്യൂസിലൻഡ്", "Spain": "സ്പെയിൻ", "Cape Verde": "കേപ് വേർഡ്",
  "Saudi Arabia": "സൗദി അറേബ്യ", "Uruguay": "ഉറുഗ്വേ", "France": "ഫ്രാൻസ്",
  "Senegal": "സെനഗൽ", "Iraq": "ഇറാഖ്", "Norway": "നോർവേ",
  "Argentina": "അർജന്റീന", "Algeria": "അൾജീരിയ", "Austria": "ഓസ്ട്രിയ",
  "Jordan": "ജോർദ്ദാൻ", "Portugal": "പോർച്ചുഗൽ", "DR Congo": "ഡിആർ കോംഗോ",
  "Uzbekistan": "ഉസ്ബെക്കിസ്ഥാൻ", "Colombia": "കൊളംബിയ", "England": "ഇംഗ്ലണ്ട്",
  "Croatia": "ക്രൊയേഷ്യ", "Ghana": "ഘാന", "Panama": "പനാമ",
};

function getContinent(team: string): { en: string; ml: string } {
  const SA = ["Brazil","Argentina","Uruguay","Colombia","Ecuador","Paraguay"];
  const EU = ["France","Germany","Spain","England","Portugal","Netherlands","Belgium","Croatia",
              "Switzerland","Austria","Turkey","Scotland","Sweden","Norway","Bosnia & Herzegovina","Czech Republic"];
  const AF = ["Morocco","Senegal","Egypt","Tunisia","Ivory Coast","South Africa","Ghana","Algeria","DR Congo","Cape Verde"];
  const AS = ["Japan","South Korea","Saudi Arabia","Iran","Iraq","Jordan","Qatar","Uzbekistan","Australia"];
  const CA = ["USA","Mexico","Canada","Panama","Haiti","Curaçao"];
  if (SA.includes(team)) return { en: "South American", ml: "ദക്ഷിണ അമേരിക്കൻ" };
  if (EU.includes(team)) return { en: "European", ml: "യൂറോപ്യൻ" };
  if (AF.includes(team)) return { en: "African", ml: "ആഫ്രിക്കൻ" };
  if (AS.includes(team)) return { en: "Asian/Oceanian", ml: "ഏഷ്യൻ/ഓഷ്യാനിയൻ" };
  if (CA.includes(team)) return { en: "North/Central American or Caribbean", ml: "നോർത്ത്/സെൻട്രൽ അമേരിക്കൻ" };
  return { en: "international", ml: "അന്താരാഷ്ട്ര" };
}

function normalizePosition(pos: string): { en: string; ml: string } {
  const p = pos.toLowerCase();
  if (p.includes("goalkeeper")) return { en: "goalkeeper", ml: "ഗോൾകീപ്പർ" };
  if (p.includes("centre-back") || p.includes("center-back") || p.includes("central defender")) return { en: "centre-back", ml: "സെന്റർ-ബാക്ക്" };
  if (p.includes("left-back") || p.includes("left back")) return { en: "left-back", ml: "ലഫ്റ്റ് ബാക്ക്" };
  if (p.includes("right-back") || p.includes("right back")) return { en: "right-back", ml: "റൈറ്റ് ബാക്ക്" };
  if (p.includes("defender") || p.includes("back")) return { en: "defender", ml: "ഡിഫൻഡർ" };
  if (p.includes("defensive mid")) return { en: "defensive midfielder", ml: "ഡിഫൻസിവ് മിഡ്‌ഫീൽഡർ" };
  if (p.includes("attacking mid")) return { en: "attacking midfielder", ml: "അറ്റാക്കിംഗ് മിഡ്‌ഫീൽഡർ" };
  if (p.includes("midfielder")) return { en: "midfielder", ml: "മിഡ്‌ഫീൽഡർ" };
  if (p.includes("left wing")) return { en: "left winger", ml: "ലഫ്റ്റ് വിംഗർ" };
  if (p.includes("right wing")) return { en: "right winger", ml: "റൈറ്റ് വിംഗർ" };
  if (p.includes("winger")) return { en: "winger", ml: "വിംഗർ" };
  if (p.includes("striker") || p.includes("centre forward") || p.includes("center forward")) return { en: "striker", ml: "സ്ട്രൈക്കർ" };
  if (p.includes("forward")) return { en: "forward", ml: "ഫോർവേഡ്" };
  return { en: pos, ml: pos };
}

function stripWiki(text: string): string {
  return text
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface WikiInfo {
  position?: string;
  club?: string;
  dobYear?: string;
  dobFull?: string;
  birthPlace?: string;
  caps?: number;
  goals?: number;
}

function parseInfobox(wikitext: string): WikiInfo {
  const info: WikiInfo = {};
  const getField = (field: string): string | null => {
    const re = new RegExp(`\\|\\s*${field}\\s*=([^\n|{}]+)`, "i");
    const m = wikitext.match(re);
    return m ? stripWiki(m[1]) : null;
  };

  const pos = getField("position");
  if (pos) info.position = pos;

  const club = getField("current_club") || getField("currentclub");
  if (club) info.club = club.split("|").pop()?.trim();

  const fullMatch = wikitext.match(/birth.date[^|{]*\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
  if (fullMatch) {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    info.dobFull = `${parseInt(fullMatch[3])} ${months[parseInt(fullMatch[2]) - 1]} ${fullMatch[1]}`;
    info.dobYear = fullMatch[1];
  } else {
    const dob = getField("birth_date");
    if (dob) {
      const ym = dob.match(/\b(19|20)\d{2}\b/);
      if (ym) info.dobYear = ym[0];
    }
  }

  const bp = getField("birth_place") || getField("birthplace");
  if (bp) {
    const parts = bp.split(",");
    info.birthPlace = parts[parts.length - 1].trim() || bp;
  }

  const goals = getField("nationalgoals1") || getField("goals1");
  if (goals) info.goals = parseInt(goals.replace(/[^\d]/g, "")) || 0;
  const caps = getField("nationalcaps1") || getField("caps1");
  if (caps) info.caps = parseInt(caps.replace(/[^\d]/g, "")) || 0;

  return info;
}

async function fetchWikiInfo(playerName: string): Promise<WikiInfo> {
  try {
    const headers = { "User-Agent": "Skorio-WhoAmI/1.0 (educational)" };
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + " footballer")}&format=json&utf8=1&srlimit=3`;
    const sr = await fetch(searchUrl, { headers });
    const sd = await sr.json() as { query?: { search?: { title: string }[] } };
    const results = sd.query?.search ?? [];
    if (!results.length) return {};

    const title = results[0].title;
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(title)}&format=json&utf8=1`;
    const pr = await fetch(pageUrl, { headers });
    const pd = await pr.json() as {
      query?: { pages?: Record<string, { revisions?: { slots?: { main?: { "*": string } } }[] }> }
    };
    const pages = pd.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const wikitext = page?.revisions?.[0]?.slots?.main?.["*"] ?? "";
    if (!wikitext || wikitext.startsWith("#REDIRECT")) return {};
    return parseInfobox(wikitext);
  } catch {
    return {};
  }
}

function buildClues(playerName: string, teamName: string, info: WikiInfo): { en: string[]; ml: string[] } {
  const teamMl = TEAM_ML[teamName] || teamName;
  const continent = getContinent(teamName);
  const en: string[] = [];
  const ml: string[] = [];

  // Clue 1 – birth info
  if (info.dobFull) {
    en.push(`I was born on ${info.dobFull}`);
    ml.push(`ഞാൻ ${info.dobFull}ൽ ജനിച്ചു`);
  } else if (info.birthPlace && info.dobYear) {
    en.push(`I was born in ${info.birthPlace} in ${info.dobYear}`);
    ml.push(`ഞാൻ ${info.dobYear}ൽ ${info.birthPlace}ൽ ജനിച്ചു`);
  } else if (info.dobYear) {
    en.push(`I was born in ${info.dobYear}`);
    ml.push(`ഞാൻ ${info.dobYear}ൽ ജനിച്ചു`);
  } else if (info.birthPlace) {
    en.push(`I was born in ${info.birthPlace}`);
    ml.push(`ഞാൻ ${info.birthPlace}ൽ ജനിച്ചു`);
  } else {
    en.push(`I am a professional footballer selected for the 2026 FIFA World Cup squad`);
    ml.push(`ഞാൻ 2026 FIFA World Cup squad-ലേക്ക് തിരഞ്ഞെടുക്കപ്പെട്ട ഒരു professional footballer ആണ്`);
  }

  // Clue 2 – international stats
  if ((info.caps ?? 0) >= 10) {
    en.push(`I have earned ${info.caps}+ senior international caps`);
    ml.push(`ഞാൻ ${info.caps}+ സീനിയർ ഇന്റർനാഷണൽ caps നേടിയിട്ടുണ്ട്`);
  } else if ((info.goals ?? 0) > 0) {
    en.push(`I have scored ${info.goals} goals for my national team`);
    ml.push(`ഞാൻ ദേശീയ ടീമിനായി ${info.goals} ഗോളുകൾ നേടിയിട്ടുണ്ട്`);
  } else {
    en.push(`I represent my country at the highest level of international football`);
    ml.push(`ഞാൻ ഇന്റർനാഷണൽ ഫുട്‌ബോളിന്റെ ഏറ്റവും ഉയർന്ന തലത്തിൽ എന്റെ രാജ്യത്തെ represent ചെയ്യുന്നു`);
  }

  // Clue 3 – club
  if (info.club) {
    en.push(`At club level, I play for ${info.club}`);
    ml.push(`Club ഫുട്‌ബോളിൽ ഞാൻ ${info.club}ൽ കളിക്കുന്നു`);
  } else {
    en.push(`I play club football in one of the world's top professional leagues`);
    ml.push(`ഞാൻ ലോകത്തെ top professional league-കളിൽ ഒന്നിൽ club ഫുട്‌ബോൾ കളിക്കുന്നു`);
  }

  // Clue 4 – position
  if (info.position) {
    const pos = normalizePosition(info.position);
    en.push(`My position on the pitch is ${pos.en}`);
    ml.push(`ഗ്രൗണ്ടിൽ എന്റെ position ${pos.ml} ആണ്`);
  } else {
    en.push(`I am known for my skill and contribution on the football pitch`);
    ml.push(`ഫുട്‌ബോൾ ഗ്രൗണ്ടിൽ എന്റെ കഴിവിനും സംഭാവനയ്ക്കും ഞാൻ അറിയപ്പെടുന്നു`);
  }

  // Clue 5 – continental hint
  en.push(`I represent a ${continent.en} nation at the World Cup`);
  ml.push(`World Cup-ൽ ഞാൻ ഒരു ${continent.ml} രാഷ്ട്രത്തെ represent ചെയ്യുന്നു`);

  // Clue 6 – easiest
  en.push(`I play for ${teamName} at the 2026 FIFA World Cup`);
  ml.push(`ഞാൻ 2026 FIFA World Cup-ൽ ${teamMl}നെ represent ചെയ്ത് കളിക്കുന്നു`);

  return { en, ml };
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function POST() {
  try {
    await requireAdmin();

    // Fetch all players from DB
    const playersRes = await query(`SELECT DISTINCT name, team_name FROM players ORDER BY name ASC`);
    const players = playersRes.rows as { name: string; team_name: string }[];

    // Get already-seeded set
    const existingRes = await query(`SELECT player_name FROM who_am_i_players`);
    const seeded = new Set<string>(existingRes.rows.map((r: { player_name: string }) => r.player_name));

    const toProcess = players.filter(p => !seeded.has(p.name));

    if (toProcess.length === 0) {
      return NextResponse.json({ success: true, message: "All players already seeded.", inserted: 0, total: players.length });
    }

    let inserted = 0;
    let wikiHits = 0;
    const errors: string[] = [];

    for (const { name, team_name } of toProcess) {
      try {
        const info = await fetchWikiInfo(name);
        if (info.position || info.club || info.caps) wikiHits++;

        const { en, ml } = buildClues(name, team_name, info);
        const lastName = name.split(" ").pop()!;
        const aliases = Array.from(new Set([lastName, name]));

        await query(
          `INSERT INTO who_am_i_players (player_name, aliases, clues, clues_ml, active)
           VALUES ($1, $2, $3, $4, true)`,
          [name, JSON.stringify(aliases), JSON.stringify(en), JSON.stringify(ml)]
        );
        inserted++;
      } catch (e) {
        errors.push(`${name}: ${(e as Error).message}`);
      }

      await sleep(200);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} players (${wikiHits} with Wikipedia data).`,
      inserted,
      wikiHits,
      skipped: seeded.size,
      total: players.length,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
