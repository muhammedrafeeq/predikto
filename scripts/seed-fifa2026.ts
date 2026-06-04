import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";
import bcrypt from "bcryptjs";

// ── Load .env.local ───────────────────────────────────────────────────────────
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

// ── Time helper: "HH:MM UTC-X" → UTC ISO string on given date ────────────────
function toUtc(date: string, localTime: string): string {
  // e.g. date="2026-06-11", localTime="13:00 UTC-6"
  const [timePart, offsetPart] = localTime.trim().split(" ");
  const [hStr, mStr] = timePart.split(":");
  const offset = parseInt(offsetPart.replace("UTC", ""), 10); // e.g. -6 → -6
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  // Convert to UTC: subtract offset (UTC-6 means local+6=UTC)
  const localMinutes = h * 60 + m;
  const utcMinutes = localMinutes + (-offset) * 60; // add because UTC = local - offset = local + (-offset)
  const utcDay = Math.floor(utcMinutes / (24 * 60));
  const rem = ((utcMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const uh = Math.floor(rem / 60);
  const um = rem % 60;

  // Add utcDay days to date
  const base = new Date(date + "T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + utcDay);
  const dd = String(base.getUTCDate()).padStart(2, "0");
  const mo = String(base.getUTCMonth() + 1).padStart(2, "0");
  const yr = base.getUTCFullYear();
  return `${yr}-${mo}-${dd}T${String(uh).padStart(2, "0")}:${String(um).padStart(2, "0")}:00Z`;
}

// ── Official FIFA World Cup 2026 Schedule ─────────────────────────────────────
interface MatchDef {
  home: string;
  away: string;
  utcTime: string;        // ISO UTC
  round: string;
  venue: string;
}

const RAW: { date: string; time: string; team1: string; team2: string; round: string; ground: string }[] = [
  // ── Group A ─────────────────────────────────────────────
  { round:"Group A – Matchday 1", date:"2026-06-11", time:"13:00 UTC-6", team1:"Mexico",          team2:"South Africa",     ground:"Mexico City" },
  { round:"Group A – Matchday 1", date:"2026-06-11", time:"20:00 UTC-6", team1:"South Korea",     team2:"Czech Republic",   ground:"Guadalajara" },
  { round:"Group A – Matchday 2", date:"2026-06-18", time:"12:00 UTC-4", team1:"Czech Republic",  team2:"South Africa",     ground:"Atlanta" },
  { round:"Group A – Matchday 2", date:"2026-06-18", time:"19:00 UTC-6", team1:"Mexico",          team2:"South Korea",      ground:"Guadalajara" },
  { round:"Group A – Matchday 3", date:"2026-06-24", time:"19:00 UTC-6", team1:"Czech Republic",  team2:"Mexico",           ground:"Mexico City" },
  { round:"Group A – Matchday 3", date:"2026-06-24", time:"19:00 UTC-6", team1:"South Africa",    team2:"South Korea",      ground:"Monterrey" },
  // ── Group B ─────────────────────────────────────────────
  { round:"Group B – Matchday 1", date:"2026-06-12", time:"15:00 UTC-4", team1:"Canada",          team2:"Bosnia & Herzegovina", ground:"Toronto" },
  { round:"Group B – Matchday 1", date:"2026-06-13", time:"12:00 UTC-7", team1:"Qatar",           team2:"Switzerland",      ground:"San Francisco" },
  { round:"Group B – Matchday 2", date:"2026-06-18", time:"12:00 UTC-7", team1:"Switzerland",     team2:"Bosnia & Herzegovina", ground:"Los Angeles" },
  { round:"Group B – Matchday 2", date:"2026-06-18", time:"15:00 UTC-7", team1:"Canada",          team2:"Qatar",            ground:"Vancouver" },
  { round:"Group B – Matchday 3", date:"2026-06-24", time:"12:00 UTC-7", team1:"Switzerland",     team2:"Canada",           ground:"Vancouver" },
  { round:"Group B – Matchday 3", date:"2026-06-24", time:"12:00 UTC-7", team1:"Bosnia & Herzegovina", team2:"Qatar",       ground:"Seattle" },
  // ── Group C ─────────────────────────────────────────────
  { round:"Group C – Matchday 1", date:"2026-06-13", time:"18:00 UTC-4", team1:"Brazil",          team2:"Morocco",          ground:"New York/New Jersey" },
  { round:"Group C – Matchday 1", date:"2026-06-13", time:"21:00 UTC-4", team1:"Haiti",           team2:"Scotland",         ground:"Boston" },
  { round:"Group C – Matchday 2", date:"2026-06-19", time:"18:00 UTC-4", team1:"Scotland",        team2:"Morocco",          ground:"Boston" },
  { round:"Group C – Matchday 2", date:"2026-06-19", time:"20:30 UTC-4", team1:"Brazil",          team2:"Haiti",            ground:"Philadelphia" },
  { round:"Group C – Matchday 3", date:"2026-06-24", time:"18:00 UTC-4", team1:"Scotland",        team2:"Brazil",           ground:"Miami" },
  { round:"Group C – Matchday 3", date:"2026-06-24", time:"18:00 UTC-4", team1:"Morocco",         team2:"Haiti",            ground:"Atlanta" },
  // ── Group D ─────────────────────────────────────────────
  { round:"Group D – Matchday 1", date:"2026-06-12", time:"18:00 UTC-7", team1:"USA",             team2:"Paraguay",         ground:"Los Angeles" },
  { round:"Group D – Matchday 1", date:"2026-06-13", time:"21:00 UTC-7", team1:"Australia",       team2:"Turkey",           ground:"Vancouver" },
  { round:"Group D – Matchday 2", date:"2026-06-19", time:"12:00 UTC-7", team1:"USA",             team2:"Australia",        ground:"Seattle" },
  { round:"Group D – Matchday 2", date:"2026-06-19", time:"20:00 UTC-7", team1:"Turkey",          team2:"Paraguay",         ground:"San Francisco" },
  { round:"Group D – Matchday 3", date:"2026-06-25", time:"19:00 UTC-7", team1:"Turkey",          team2:"USA",              ground:"Los Angeles" },
  { round:"Group D – Matchday 3", date:"2026-06-25", time:"19:00 UTC-7", team1:"Paraguay",        team2:"Australia",        ground:"San Francisco" },
  // ── Group E ─────────────────────────────────────────────
  { round:"Group E – Matchday 1", date:"2026-06-14", time:"12:00 UTC-5", team1:"Germany",         team2:"Curaçao",          ground:"Houston" },
  { round:"Group E – Matchday 1", date:"2026-06-14", time:"19:00 UTC-4", team1:"Ivory Coast",     team2:"Ecuador",          ground:"Philadelphia" },
  { round:"Group E – Matchday 2", date:"2026-06-20", time:"16:00 UTC-4", team1:"Germany",         team2:"Ivory Coast",      ground:"Toronto" },
  { round:"Group E – Matchday 2", date:"2026-06-20", time:"19:00 UTC-5", team1:"Ecuador",         team2:"Curaçao",          ground:"Kansas City" },
  { round:"Group E – Matchday 3", date:"2026-06-25", time:"16:00 UTC-4", team1:"Curaçao",         team2:"Ivory Coast",      ground:"Philadelphia" },
  { round:"Group E – Matchday 3", date:"2026-06-25", time:"16:00 UTC-4", team1:"Ecuador",         team2:"Germany",          ground:"New York/New Jersey" },
  // ── Group F ─────────────────────────────────────────────
  { round:"Group F – Matchday 1", date:"2026-06-14", time:"15:00 UTC-5", team1:"Netherlands",     team2:"Japan",            ground:"Dallas" },
  { round:"Group F – Matchday 1", date:"2026-06-14", time:"20:00 UTC-6", team1:"Sweden",          team2:"Tunisia",          ground:"Monterrey" },
  { round:"Group F – Matchday 2", date:"2026-06-20", time:"12:00 UTC-5", team1:"Netherlands",     team2:"Sweden",           ground:"Houston" },
  { round:"Group F – Matchday 2", date:"2026-06-20", time:"22:00 UTC-6", team1:"Tunisia",         team2:"Japan",            ground:"Monterrey" },
  { round:"Group F – Matchday 3", date:"2026-06-25", time:"18:00 UTC-5", team1:"Japan",           team2:"Sweden",           ground:"Dallas" },
  { round:"Group F – Matchday 3", date:"2026-06-25", time:"18:00 UTC-5", team1:"Tunisia",         team2:"Netherlands",      ground:"Kansas City" },
  // ── Group G ─────────────────────────────────────────────
  { round:"Group G – Matchday 1", date:"2026-06-15", time:"12:00 UTC-7", team1:"Belgium",         team2:"Egypt",            ground:"Seattle" },
  { round:"Group G – Matchday 1", date:"2026-06-15", time:"18:00 UTC-7", team1:"Iran",            team2:"New Zealand",      ground:"Los Angeles" },
  { round:"Group G – Matchday 2", date:"2026-06-21", time:"12:00 UTC-7", team1:"Belgium",         team2:"Iran",             ground:"Los Angeles" },
  { round:"Group G – Matchday 2", date:"2026-06-21", time:"18:00 UTC-7", team1:"New Zealand",     team2:"Egypt",            ground:"Vancouver" },
  { round:"Group G – Matchday 3", date:"2026-06-26", time:"20:00 UTC-7", team1:"Egypt",           team2:"Iran",             ground:"Seattle" },
  { round:"Group G – Matchday 3", date:"2026-06-26", time:"20:00 UTC-7", team1:"New Zealand",     team2:"Belgium",          ground:"Vancouver" },
  // ── Group H ─────────────────────────────────────────────
  { round:"Group H – Matchday 1", date:"2026-06-15", time:"12:00 UTC-4", team1:"Spain",           team2:"Cape Verde",       ground:"Atlanta" },
  { round:"Group H – Matchday 1", date:"2026-06-15", time:"18:00 UTC-4", team1:"Saudi Arabia",    team2:"Uruguay",          ground:"Miami" },
  { round:"Group H – Matchday 2", date:"2026-06-21", time:"12:00 UTC-4", team1:"Spain",           team2:"Saudi Arabia",     ground:"Atlanta" },
  { round:"Group H – Matchday 2", date:"2026-06-21", time:"18:00 UTC-4", team1:"Uruguay",         team2:"Cape Verde",       ground:"Miami" },
  { round:"Group H – Matchday 3", date:"2026-06-26", time:"19:00 UTC-5", team1:"Cape Verde",      team2:"Saudi Arabia",     ground:"Houston" },
  { round:"Group H – Matchday 3", date:"2026-06-26", time:"18:00 UTC-6", team1:"Uruguay",         team2:"Spain",            ground:"Guadalajara" },
  // ── Group I ─────────────────────────────────────────────
  { round:"Group I – Matchday 1", date:"2026-06-16", time:"15:00 UTC-4", team1:"France",          team2:"Senegal",          ground:"New York/New Jersey" },
  { round:"Group I – Matchday 1", date:"2026-06-16", time:"18:00 UTC-4", team1:"Iraq",            team2:"Norway",           ground:"Boston" },
  { round:"Group I – Matchday 2", date:"2026-06-22", time:"17:00 UTC-4", team1:"France",          team2:"Iraq",             ground:"Philadelphia" },
  { round:"Group I – Matchday 2", date:"2026-06-22", time:"20:00 UTC-4", team1:"Norway",          team2:"Senegal",          ground:"New York/New Jersey" },
  { round:"Group I – Matchday 3", date:"2026-06-26", time:"15:00 UTC-4", team1:"Norway",          team2:"France",           ground:"Boston" },
  { round:"Group I – Matchday 3", date:"2026-06-26", time:"15:00 UTC-4", team1:"Senegal",         team2:"Iraq",             ground:"Toronto" },
  // ── Group J ─────────────────────────────────────────────
  { round:"Group J – Matchday 1", date:"2026-06-16", time:"20:00 UTC-5", team1:"Argentina",       team2:"Algeria",          ground:"Kansas City" },
  { round:"Group J – Matchday 1", date:"2026-06-16", time:"21:00 UTC-7", team1:"Austria",         team2:"Jordan",           ground:"San Francisco" },
  { round:"Group J – Matchday 2", date:"2026-06-22", time:"12:00 UTC-5", team1:"Argentina",       team2:"Austria",          ground:"Dallas" },
  { round:"Group J – Matchday 2", date:"2026-06-22", time:"20:00 UTC-7", team1:"Jordan",          team2:"Algeria",          ground:"San Francisco" },
  { round:"Group J – Matchday 3", date:"2026-06-27", time:"21:00 UTC-5", team1:"Algeria",         team2:"Austria",          ground:"Kansas City" },
  { round:"Group J – Matchday 3", date:"2026-06-27", time:"21:00 UTC-5", team1:"Jordan",          team2:"Argentina",        ground:"Dallas" },
  // ── Group K ─────────────────────────────────────────────
  { round:"Group K – Matchday 1", date:"2026-06-17", time:"12:00 UTC-5", team1:"Portugal",        team2:"DR Congo",         ground:"Houston" },
  { round:"Group K – Matchday 1", date:"2026-06-17", time:"20:00 UTC-6", team1:"Uzbekistan",      team2:"Colombia",         ground:"Mexico City" },
  { round:"Group K – Matchday 2", date:"2026-06-23", time:"12:00 UTC-5", team1:"Portugal",        team2:"Uzbekistan",       ground:"Houston" },
  { round:"Group K – Matchday 2", date:"2026-06-23", time:"20:00 UTC-6", team1:"Colombia",        team2:"DR Congo",         ground:"Guadalajara" },
  { round:"Group K – Matchday 3", date:"2026-06-27", time:"19:30 UTC-4", team1:"Colombia",        team2:"Portugal",         ground:"Miami" },
  { round:"Group K – Matchday 3", date:"2026-06-27", time:"19:30 UTC-4", team1:"DR Congo",        team2:"Uzbekistan",       ground:"Atlanta" },
  // ── Group L ─────────────────────────────────────────────
  { round:"Group L – Matchday 1", date:"2026-06-17", time:"15:00 UTC-5", team1:"England",         team2:"Croatia",          ground:"Dallas" },
  { round:"Group L – Matchday 1", date:"2026-06-17", time:"19:00 UTC-4", team1:"Ghana",           team2:"Panama",           ground:"Toronto" },
  { round:"Group L – Matchday 2", date:"2026-06-23", time:"16:00 UTC-4", team1:"England",         team2:"Ghana",            ground:"Boston" },
  { round:"Group L – Matchday 2", date:"2026-06-23", time:"19:00 UTC-4", team1:"Panama",          team2:"Croatia",          ground:"Toronto" },
  { round:"Group L – Matchday 3", date:"2026-06-27", time:"17:00 UTC-4", team1:"Panama",          team2:"England",          ground:"New York/New Jersey" },
  { round:"Group L – Matchday 3", date:"2026-06-27", time:"17:00 UTC-4", team1:"Croatia",         team2:"Ghana",            ground:"Philadelphia" },
  // ── Round of 32 ─────────────────────────────────────────
  { round:"Round of 32 – M73", date:"2026-06-28", time:"12:00 UTC-7", team1:"Runner-up A",       team2:"Runner-up B",       ground:"Los Angeles" },
  { round:"Round of 32 – M74", date:"2026-06-29", time:"16:30 UTC-4", team1:"Winner E",           team2:"3rd A/B/C/D/F",     ground:"Boston" },
  { round:"Round of 32 – M75", date:"2026-06-29", time:"19:00 UTC-6", team1:"Winner F",           team2:"Runner-up C",       ground:"Monterrey" },
  { round:"Round of 32 – M76", date:"2026-06-29", time:"12:00 UTC-5", team1:"Winner C",           team2:"Runner-up F",       ground:"Houston" },
  { round:"Round of 32 – M77", date:"2026-06-30", time:"17:00 UTC-4", team1:"Winner I",           team2:"3rd C/D/F/G/H",     ground:"New York/New Jersey" },
  { round:"Round of 32 – M78", date:"2026-06-30", time:"12:00 UTC-5", team1:"Runner-up E",        team2:"Runner-up I",       ground:"Dallas" },
  { round:"Round of 32 – M79", date:"2026-06-30", time:"19:00 UTC-6", team1:"Winner A",           team2:"3rd C/E/F/H/I",     ground:"Mexico City" },
  { round:"Round of 32 – M80", date:"2026-07-01", time:"12:00 UTC-4", team1:"Winner L",           team2:"3rd E/H/I/J/K",     ground:"Atlanta" },
  { round:"Round of 32 – M81", date:"2026-07-01", time:"17:00 UTC-7", team1:"Winner D",           team2:"3rd B/E/F/I/J",     ground:"San Francisco" },
  { round:"Round of 32 – M82", date:"2026-07-01", time:"13:00 UTC-7", team1:"Winner G",           team2:"3rd A/E/H/I/J",     ground:"Seattle" },
  { round:"Round of 32 – M83", date:"2026-07-02", time:"19:00 UTC-4", team1:"Runner-up K",        team2:"Runner-up L",       ground:"Toronto" },
  { round:"Round of 32 – M84", date:"2026-07-02", time:"12:00 UTC-7", team1:"Winner H",           team2:"Runner-up J",       ground:"Los Angeles" },
  { round:"Round of 32 – M85", date:"2026-07-02", time:"20:00 UTC-7", team1:"Winner B",           team2:"3rd E/F/G/I/J",     ground:"Vancouver" },
  { round:"Round of 32 – M86", date:"2026-07-03", time:"18:00 UTC-4", team1:"Winner J",           team2:"Runner-up H",       ground:"Miami" },
  { round:"Round of 32 – M87", date:"2026-07-03", time:"20:30 UTC-5", team1:"Winner K",           team2:"3rd D/E/I/J/L",     ground:"Kansas City" },
  { round:"Round of 32 – M88", date:"2026-07-03", time:"13:00 UTC-5", team1:"Runner-up D",        team2:"Runner-up G",       ground:"Dallas" },
  // ── Round of 16 ─────────────────────────────────────────
  { round:"Round of 16 – M89", date:"2026-07-04", time:"17:00 UTC-4", team1:"W74",               team2:"W77",               ground:"Philadelphia" },
  { round:"Round of 16 – M90", date:"2026-07-04", time:"12:00 UTC-5", team1:"W73",               team2:"W75",               ground:"Houston" },
  { round:"Round of 16 – M91", date:"2026-07-05", time:"16:00 UTC-4", team1:"W76",               team2:"W78",               ground:"New York/New Jersey" },
  { round:"Round of 16 – M92", date:"2026-07-05", time:"18:00 UTC-6", team1:"W79",               team2:"W80",               ground:"Mexico City" },
  { round:"Round of 16 – M93", date:"2026-07-06", time:"14:00 UTC-5", team1:"W83",               team2:"W84",               ground:"Dallas" },
  { round:"Round of 16 – M94", date:"2026-07-06", time:"17:00 UTC-7", team1:"W81",               team2:"W82",               ground:"Seattle" },
  { round:"Round of 16 – M95", date:"2026-07-07", time:"12:00 UTC-4", team1:"W86",               team2:"W88",               ground:"Atlanta" },
  { round:"Round of 16 – M96", date:"2026-07-07", time:"13:00 UTC-7", team1:"W85",               team2:"W87",               ground:"Vancouver" },
  // ── Quarter-finals ───────────────────────────────────────
  { round:"Quarter-final – M97",  date:"2026-07-09", time:"16:00 UTC-4", team1:"W89", team2:"W90", ground:"Boston" },
  { round:"Quarter-final – M98",  date:"2026-07-10", time:"12:00 UTC-7", team1:"W93", team2:"W94", ground:"Los Angeles" },
  { round:"Quarter-final – M99",  date:"2026-07-11", time:"17:00 UTC-4", team1:"W91", team2:"W92", ground:"Miami" },
  { round:"Quarter-final – M100", date:"2026-07-11", time:"20:00 UTC-5", team1:"W95", team2:"W96", ground:"Kansas City" },
  // ── Semi-finals ──────────────────────────────────────────
  { round:"Semi-final – M101", date:"2026-07-14", time:"14:00 UTC-5", team1:"W97",  team2:"W98",  ground:"Dallas" },
  { round:"Semi-final – M102", date:"2026-07-15", time:"15:00 UTC-4", team1:"W99",  team2:"W100", ground:"Atlanta" },
  // ── 3rd place + Final ────────────────────────────────────
  { round:"Third Place",  date:"2026-07-18", time:"17:00 UTC-4", team1:"L101", team2:"L102", ground:"Miami" },
  { round:"Final",        date:"2026-07-19", time:"15:00 UTC-4", team1:"W101", team2:"W102", ground:"New York/New Jersey" },
];

const MATCHES: MatchDef[] = RAW.map(r => ({
  home: r.team1,
  away: r.team2,
  utcTime: toUtc(r.date, r.time),
  round: r.round,
  venue: r.ground,
}));

const SQUADS: Record<string, string[]> = {
  "Mexico": ["Raúl Rangel", "Jorge Sánchez", "César Montes", "Edson Álvarez", "Johan Vásquez", "Érik Lira", "Luis Romo", "Álvaro Fidalgo", "Raúl Jiménez", "Alexis Vega", "Santiago Giménez", "Carlos Acevedo", "Guillermo Ochoa", "Armando González", "Israel Reyes", "Julián Quiñones", "Orbelín Pineda", "Obed Vargas", "Gilberto Mora", "Mateo Chávez", "César Huerta", "Guillermo Martínez", "Jesús Gallardo", "Luis Chávez", "Roberto Alvarado", "Brian Gutiérrez"],
  "South Africa": ["Ronwen Williams", "Thabang Matuludi", "Khulumani Ndamane", "Teboho Mokoena", "Thalente Mbatha", "Aubrey Modiba", "Oswin Appollis", "Tshepang Moremi", "Lyle Foster", "Relebohile Mofokeng", "Themba Zwane", "Thapelo Maseko", "Sphephelo Sithole", "Mbekezeli Mbokazi", "Iqraam Rayners", "Sipho Chaine", "Evidence Makgopa", "Samukele Kabini", "Nkosinathi Sibisi", "Khuliso Mudau", "Ime Okon", "Ricardo Goss", "Jayden Adams", "Olwethu Makhanya", "Kamogelo Sebelebele", "Bradley Cross"],
  "South Korea": ["Kim Seung-gyu", "Lee Han-beom", "Lee Gi-hyuk", "Kim Min-jae", "Kim Tae-hyeon", "Hwang In-beom", "Son Heung-min", "Paik Seung-ho", "Cho Gue-sung", "Lee Jae-sung", "Hwang Hee-chan", "Song Bum-keun", "Lee Tae-seok", "Cho Wi-je", "Kim Moon-hwan", "Park Jin-seob", "Bae Jun-ho", "Oh Hyeon-gyu", "Lee Kang-in", "Yang Hyun-jun", "Jo Hyeon-woo", "Seol Young-woo", "Jens Castrop", "Kim Jin-gyu", "Eom Ji-sung", "Lee Dong-gyeong"],
  "Czech Republic": ["Matěj Kovář", "David Zima", "Tomáš Holeš", "Robin Hranáč", "Vladimír Coufal", "Štěpán Chaloupek", "Ladislav Krejčí", "Vladimír Darida", "Adam Hložek", "Patrik Schick", "Jan Kuchta", "Lukáš Červ", "Mojmír Chytil", "David Jurásek", "Pavel Šulc", "Jindřich Staněk", "Lukáš Provod", "Michal Sadílek", "Tomáš Chorý", "Jaroslav Zelený", "David Douděra", "Tomáš Souček", "Lukáš Horníček", "Alexandr Sojka", "Hugo Sochůrek", "Denis Višinský"],
  "Canada": ["Dayne St. Clair", "Alistair Johnston", "Alfie Jones", "Luc de Fougerolles", "Joel Waterman", "Mathieu Choinière", "Stephen Eustáquio", "Ismaël Koné", "Cyle Larin", "Jonathan David", "Liam Millar", "Tani Oluwaseyi", "Derek Cornelius", "Jacob Shaffelburg", "Moïse Bombito", "Maxime Crépeau", "Tajon Buchanan", "Owen Goodman", "Alphonso Davies", "Ali Ahmed", "Jonathan Osorio", "Richie Laryea", "Niko Sigur", "Promise David", "Nathan Saliba"],
  "Bosnia & Herzegovina": ["Nikola Vasilj", "Nihad Mujakić", "Dennis Hadžikadunić", "Tarik Muharemović", "Sead Kolašinac", "Benjamin Tahirović", "Amar Dedić", "Armin Gigović", "Samed Baždar", "Ermedin Demirović", "Edin Džeko", "Mladen Jurkas", "Ivan Bašić", "Ivan Šunjić", "Amar Memić", "Amir Hadžiahmetović", "Dženis Burnić", "Nikola Katić", "Kerim Alajbegović", "Esmir Bajraktarević", "Stjepan Radeljić", "Martin Zlomislić", "Haris Tabaković", "Nidal Čelik", "Jovo Lukić", "Ermin Mahmić"],
  "Qatar": ["Mahmud Abunada", "Pedro Miguel", "Lucas Mendes", "Issa Laye", "Jassem Gaber", "Abdulaziz Hatem", "Ahmed Alaaeldin", "Edmilson Junior", "Mohammed Muntari", "Hassan Al-Haydos", "Akram Afif", "Karim Boudiaf", "Ayoub Al-Oui", "Homam Ahmed", "Yusuf Abdurisag", "Boualem Khoukhi", "Ahmed Al-Ganehi", "Sultan Al-Brake", "Almoez Ali", "Ahmed Fathy", "Salah Zakaria", "Meshaal Barsham", "Assim Madibo", "Tahsin Jamshid", "Al-Hashmi Al-Hussain", "Mohamed Manai"],
  "Switzerland": ["Gregor Kobel", "Miro Muheim", "Silvan Widmer", "Nico Elvedi", "Manuel Akanji", "Denis Zakaria", "Breel Embolo", "Remo Freuler", "Johan Manzambi", "Granit Xhaka", "Dan Ndoye", "Yvon Mvogo", "Ricardo Rodriguez", "Ardon Jashari", "Djibril Sow", "Christian Fassnacht", "Rubén Vargas", "Eray Cömert", "Noah Okafor", "Michel Aebischer", "Marvin Keller", "Fabian Rieder", "Zeki Amdouni", "Aurèle Amenda", "Luca Jaquez", "Cedric Itten"],
  "Brazil": ["Alisson", "Wesley", "Gabriel Magalhães", "Marquinhos", "Casemiro", "Alex Sandro", "Vinícius Júnior", "Bruno Guimarães", "Matheus Cunha", "Neymar", "Raphinha", "Weverton", "Danilo Luiz", "Bremer", "Léo Pereira", "Douglas Santos", "Fabinho", "Danilo Santos", "Endrick", "Lucas Paquetá", "Luiz Henrique", "Gabriel Martinelli", "Ederson", "Roger Ibañez", "Igor Thiago", "Rayan"],
  "Morocco": ["Yassine Bounou", "Achraf Hakimi", "Noussair Mazraoui", "Sofyan Amrabat", "Nayef Aguerd", "Ayyoub Bouaddi", "Chemsdine Talbi", "Azzedine Ounahi", "Soufiane Rahimi", "Brahim Díaz", "Ismael Saibari", "Munir Mohamedi", "Zakaria El Ouahdi", "Issa Diop", "Samir El Mourabet", "Gessime Yassine", "Abde Ezzalzouli", "Chadi Riad", "Youssef Belammari", "Ayoub El Kaabi", "Ayoube Amaimouni", "Ahmed Reda Tagnaouti", "Bilal El Khannouss", "Neil El Aynaoui", "Redouane Halhal", "Anass Salah-Eddine"],
  "Haiti": ["Johny Placide", "Carlens Arcus", "Keeto Thermoncy", "Ricardo Adé", "Hannes Delcroix", "Carl Sainté", "Derrick Etienne Jr.", "Martin Expérience", "Duckens Nazon", "Jean-Ricner Bellegarde", "Louicius Deedson", "Alexandre Pierre", "Duke Lacroix", "Leverton Pierre", "Ruben Providence", "Lenny Joseph", "Danley Jean Jacques", "Wilson Isidor", "Yassin Fortuné", "Frantzdy Pierrot", "Josué Casimir", "Jean-Kévin Duverne", "Josué Duverger", "Wilguens Paugain", "Dominique Simon", "Woodensky Pierre"],
  "Scotland": ["Angus Gunn", "Aaron Hickey", "Andy Robertson", "Scott McTominay", "Grant Hanley", "Kieran Tierney", "John McGinn", "Tyler Fletcher", "Lyndon Dykes", "Ché Adams", "Ryan Christie", "Liam Kelly", "Jack Hendry", "Ross Stewart", "John Souttar", "Dominic Hyam", "Ben Gannon-Doak", "George Hirst", "Lewis Ferguson", "Lawrence Shankland", "Craig Gordon", "Nathan Patterson", "Kenny McLean", "Anthony Ralston", "Findlay Curtis", "Scott McKenna"],
  "USA": ["Matt Turner", "Sergiño Dest", "Chris Richards", "Tyler Adams", "Antonee Robinson", "Auston Trusty", "Giovanni Reyna", "Weston McKennie", "Ricardo Pepi", "Christian Pulisic", "Brenden Aaronson", "Miles Robinson", "Tim Ream", "Sebastian Berhalter", "Cristian Roldan", "Alex Freeman", "Malik Tillman", "Maximilian Arfsten", "Haji Wright", "Folarin Balogun", "Timothy Weah", "Mark McKenzie", "Joe Scally", "Matt Freese", "Chris Brady", "Alejandro Zendejas"],
  "Paraguay": ["Gatito Fernández", "Gustavo Velázquez", "Omar Alderete", "Juan José Cáceres", "Fabián Balbuena", "Júnior Alonso", "Ramón Sosa", "Diego Gómez", "Antonio Sanabria", "Miguel Almirón", "Maurício", "Orlando Gill", "José Canale", "Andrés Cubas", "Gustavo Gómez", "Damián Bobadilla", "Kaku", "Álex Arce", "Julio Enciso", "Braian Ojeda", "Gabriel Ávalos", "Gastón Olveira", "Matías Galarza", "Gustavo Caballero", "Isidro Pitta", "Alexandro Maidana"],
  "Australia": ["Mathew Ryan", "Miloš Degenek", "Alessandro Circati", "Jacob Italiano", "Jordan Bos", "Jason Geria", "Mathew Leckie", "Connor Metcalfe", "Mohamed Touré", "Ajdin Hrustic", "Awer Mabil", "Paul Izzo", "Aiden O'Neill", "Cammy Devlin", "Kai Trewin", "Aziz Behich", "Nestory Irankunda", "Patrick Beach", "Harry Souttar", "Cristian Volpato", "Cameron Burgess", "Jackson Irvine", "Nishan Velupillay", "Paul Okon-Engstler", "Lucas Herrington", "Tete Yengi"],
  "Turkey": ["Mert Günok", "Zeki Çelik", "Merih Demiral", "Çağlar Söyüncü", "Salih Özcan", "Orkun Kökçü", "Kerem Aktürkoğlu", "Arda Güler", "Deniz Gül", "Hakan Çalhanoğlu", "Kenan Yıldız", "Altay Bayındır", "Eren Elmalı", "Abdülkerim Bardakcı", "Ozan Kabak", "İsmail Yüksek", "İrfan Can Kahveci", "Mert Müldür", "Yunus Akgün", "Ferdi Kadıoğlu", "Barış Alper Yılmaz", "Kaan Ayhan", "Uğurcan Çakır", "Oğuz Aydın", "Samet Akaydin", "Can Uzun"],
  "Germany": ["Manuel Neuer", "Antonio Rüdiger", "Waldemar Anton", "Jonathan Tah", "Aleksandar Pavlović", "Joshua Kimmich", "Kai Havertz", "Leon Goretzka", "Jamie Leweling", "Jamal Musiala", "Nick Woltemade", "Oliver Baumann", "Pascal Groß", "Maximilian Beier", "Nico Schlotterbeck", "Angelo Stiller", "Florian Wirtz", "Nathaniel Brown", "Leroy Sané", "Nadiem Amiri", "Alexander Nübel", "David Raum", "Felix Nmecha", "Malick Thiaw", "Lennart Karl", "Deniz Undav"],
  "Curaçao": ["Eloy Room", "Shurandy Sambo", "Juriën Gaari", "Roshon van Eijma", "Sherel Floranus", "Godfried Roemeratoe", "Juninho Bacuna", "Livano Comenencia", "Jürgen Locadia", "Leandro Bacuna", "Jeremy Antonisse", "Sontje Hansen", "Tyrese Noslin", "Kenji Gorré", "Ar'jany Martha", "Jearl Margaritha", "Brandley Kuwas", "Armando Obispo", "Gervane Kastaneer", "Joshua Brenet", "Tahith Chong", "Kevin Felida", "Riechedly Bazoer", "Deveron Fonville", "Tyrick Bodak", "Trevor Doornbusch"],
  "Ivory Coast": ["Yahia Fofana", "Ousmane Diomande", "Ghislain Konan", "Jean Michaël Seri", "Wilfried Singo", "Seko Fofana", "Odilon Kossounou", "Franck Kessié", "Ange-Yoan Bonny", "Simon Adingra", "Yan Diomande", "Elye Wahi", "Christopher Opéri", "Oumar Diakité", "Amad Diallo", "Mohamed Koné", "Guéla Doué", "Ibrahim Sangaré", "Nicolas Pépé", "Emmanuel Agbadou", "Evan Ndicka", "Evann Guessand", "Alban Lafont", "Bazoumana Touré", "Parfait Guiagon", "Christ Inao Oulaï"],
  "Ecuador": ["Hernán Galíndez", "Félix Torres", "Piero Hincapié", "Joel Ordóñez", "Jordy Alcívar", "Willian Pacho", "Pervis Estupiñán", "Anthony Valencia", "John Yeboah", "Kendry Páez", "Kevin Rodríguez", "Moisés Ramírez", "Enner Valencia", "Alan Minda", "Pedro Vite", "Jordy Caicedo", "Ángelo Preciado", "Denil Castillo", "Gonzalo Plata", "Nilson Angulo", "Alan Franco", "Gonzalo Valle", "Moisés Caicedo", "Jeremy Arévalo", "Jackson Porozo", "Yaimar Medina"],
  "Netherlands": ["Bart Verbruggen", "Jurriën Timber", "Marten de Roon", "Virgil van Dijk", "Nathan Aké", "Jan Paul van Hecke", "Justin Kluivert", "Ryan Gravenberch", "Wout Weghorst", "Memphis Depay", "Cody Gakpo", "Mats Wieffer", "Robin Roefs", "Tijjani Reijnders", "Micky van de Ven", "Guus Til", "Noa Lang", "Donyell Malen", "Brian Brobbey", "Teun Koopmeiners", "Frenkie de Jong", "Denzel Dumfries", "Mark Flekken", "Crysencio Summerville", "Jorrel Hato", "Quinten Timber"],
  "Japan": ["Zion Suzuki", "Yukinari Sugawara", "Shōgo Taniguchi", "Kō Itakura", "Yūto Nagatomo", "Wataru Endo", "Ao Tanaka", "Takefusa Kubo", "Keisuke Gotō", "Ritsu Dōan", "Daizen Maeda", "Keisuke Ōsako", "Keito Nakamura", "Junya Itō", "Daichi Kamada", "Tsuyoshi Watanabe", "Yuito Suzuki", "Ayase Ueda", "Kōki Ogawa", "Ayumu Seko", "Hiroki Itō", "Takehiro Tomiyasu", "Tomoki Hayakawa", "Kaishū Sano", "Junnosuke Suzuki", "Kento Shiogai"],
  "Sweden": ["Jacob Widell Zetterström", "Gustaf Lagerbielke", "Victor Lindelöf", "Isak Hien", "Gabriel Gudmundsson", "Herman Johansson", "Lucas Bergvall", "Daniel Svensson", "Alexander Isak", "Benjamin Nygren", "Anthony Elanga", "Viktor Johansson", "Ken Sema", "Hjalmar Ekdal", "Carl Starfelt", "Jesper Karlström", "Viktor Gyökeres", "Yasin Ayari", "Mattias Svanberg", "Eric Smith", "Alexander Bernhardsson", "Besfort Zeneli", "Kristoffer Nordfeldt", "Elliot Stroud", "Gustaf Nilsson", "Taha Ali"],
  "Tunisia": ["Mouhib Chamakh", "Ali Abdi", "Montassar Talbi", "Omar Rekik", "Adem Arous", "Dylan Bronn", "Elias Achouri", "Elias Saad", "Hazem Mastouri", "Hannibal Mejbri", "Ismaël Gharbi", "Mortadha Ben Ouanes", "Rani Khedira", "Khalil Ayari", "Hadj Mahmoud", "Aymen Dahmen", "Ellyes Skhiri", "Rayan Elloumi", "Firas Chaouat", "Yan Valery", "Mohamed Amine Ben Hamida", "Sabri Ben Hessen", "Moutaz Neffati", "Raed Chikhaoui", "Anis Ben Slimane", "Sebastian Tounekti"],
  "Belgium": ["Thibaut Courtois", "Zeno Debast", "Arthur Theate", "Brandon Mechele", "Maxim De Cuyper", "Axel Witsel", "Kevin De Bruyne", "Youri Tielemans", "Romelu Lukaku", "Leandro Trossard", "Jérémy Doku", "Senne Lammens", "Mike Penders", "Dodi Lukébakio", "Thomas Meunier", "Koni De Winter", "Charles De Ketelaere", "Joaquin Seys", "Diego Moreira", "Hans Vanaken", "Timothy Castagne", "Alexis Saelemaekers", "Nicolas Raskin", "Amadou Onana", "Nathan Ngoy", "Matias Fernandez-Pardo"],
  "Egypt": ["Mohamed El Shenawy", "Yasser Ibrahim", "Mohamed Hany", "Hossam Abdelmaguid", "Ramy Rabia", "Mohamed Abdelmonem", "Trézéguet", "Emam Ashour", "Hamza Abdelkarim", "Mohamed Salah", "Mostafa Ziko", "Haissem Hassan", "Ahmed Fatouh", "Hamdy Fathy", "Karim Hafez", "El Mahdy Soliman", "Mohanad Lasheen", "Nabil Emad", "Marwan Attia", "Ibrahim Adel", "Mahmoud Saber", "Omar Marmoush", "Mostafa Shobeir", "Tarek Alaa", "Zizo", "Mohamed Alaa"],
  "Iran": ["Alireza Beiranvand", "Saleh Hardani", "Ehsan Hajsafi", "Shojae Khalilzadeh", "Milad Mohammadi", "Saeid Ezatolahi", "Alireza Jahanbakhsh", "Mohammad Mohebi", "Mehdi Taremi", "Mehdi Ghayedi", "Ali Alipour", "Payam Niazmand", "Hossein Kanaanizadegan", "Saman Ghoddos", "Rouzbeh Cheshmi", "Mehdi Torabi", "Aria Yousefi", "Amirhossein Hosseinzadeh", "Ali Nemati", "Shahriyar Moghanlou", "Mohammad Ghorbani", "Hossein Hosseini", "Ramin Rezaeian", "Dennis Eckert", "Danial Eiri", "Amirmohammad Razzaghinia"],
  "New Zealand": ["Max Crocombe", "Tim Payne", "Francis de Vries", "Tyler Bindon", "Michael Boxall", "Joe Bell", "Matthew Garbett", "Marko Stamenić", "Chris Wood", "Sarpreet Singh", "Elijah Just", "Alex Paulsen", "Liberato Cacace", "Alex Rufer", "Nando Pijnaker", "Finn Surman", "Kosta Barbarouses", "Ben Waine", "Ben Old", "Callum McCowatt", "Jesse Randall", "Michael Woud", "Ryan Thomas", "Callan Elliot", "Lachlan Bayliss", "Tommy Smith"],
  "Spain": ["David Raya", "Marc Pubill", "Álex Grimaldo", "Eric García", "Marcos Llorente", "Mikel Merino", "Ferran Torres", "Fabián Ruiz", "Gavi", "Dani Olmo", "Yéremy Pino", "Pedro Porro", "Joan Garcia", "Aymeric Laporte", "Álex Baena", "Rodri", "Nico Williams", "Martín Zubimendi", "Lamine Yamal", "Pedri", "Mikel Oyarzabal", "Pau Cubarsí", "Unai Simón", "Marc Cucurella", "Víctor Muñoz", "Borja Iglesias"],
  "Cape Verde": ["Vozinha", "Stopira", "Diney", "Roberto Lopes", "Logan Costa", "Kevin Pina", "Jovane Cabral", "João Paulo", "Gilson Benchimol", "Jamiro Monteiro", "Garry Rodrigues", "Márcio Rosa", "Sidny Lopes Cabral", "Deroy Duarte", "Laros Duarte", "Yannick Semedo", "Willy Semedo", "Telmo Arcanjo", "Dailon Livramento", "Ryan Mendes", "Nuno da Costa", "Steven Moreira", "CJ dos Santos", "Wagner Pina", "Kelvin Pires", "Hélio Varela"],
  "Saudi Arabia": ["Nawaf Al-Aqidi", "Ali Majrashi", "Ali Lajami", "Abdulelah Al-Amri", "Hassan Al-Tambakti", "Nasser Al-Dawsari", "Musab Al-Juwayr", "Ayman Yahya", "Firas Al-Buraikan", "Salem Al-Dawsari", "Saleh Al-Shehri", "Saud Abdulhamid", "Nawaf Boushal", "Hassan Kadesh", "Abdullah Al-Khaibari", "Ziyad Al-Johani", "Khalid Al-Ghannam", "Alaa Al-Hejji", "Abdullah Al-Hamdan", "Sultan Mandash", "Mohammed Al-Owais", "Ahmed Al-Kassar", "Mohamed Kanno", "Moteb Al-Harbi", "Jehad Thakri", "Mohammed Abu Al-Shamat"],
  "Uruguay": ["Sergio Rochet", "José María Giménez", "Sebastián Cáceres", "Ronald Araújo", "Manuel Ugarte", "Rodrigo Bentancur", "Nicolás de la Cruz", "Federico Valverde", "Darwin Núñez", "Giorgian de Arrascaeta", "Facundo Pellistri", "Santiago Mele", "Guillermo Varela", "Agustín Canobbio", "Emiliano Martínez", "Mathías Olivera", "Matías Viña", "Brian Rodríguez", "Rodrigo Aguirre", "Maximiliano Araújo", "Federico Viñas", "Joaquín Piquerez", "Fernando Muslera", "Santiago Bueno", "Juan Manuel Sanabria", "Rodrigo Zalazar"],
  "France": ["Brice Samba", "Malo Gusto", "Lucas Digne", "Dayot Upamecano", "Jules Koundé", "Manu Koné", "Ousmane Dembélé", "Aurélien Tchouaméni", "Marcus Thuram", "Kylian Mbappé", "Michael Olise", "Bradley Barcola", "N'Golo Kanté", "Adrien Rabiot", "Ibrahima Konaté", "Mike Maignan", "William Saliba", "Warren Zaïre-Emery", "Théo Hernandez", "Désiré Doué", "Lucas Hernandez", "Jean-Philippe Mateta", "Robin Risser", "Rayan Cherki", "Maghnes Akliouche", "Maxence Lacroix"],
  "Senegal": ["Yehvann Diouf", "Mamadou Sarr", "Kalidou Koulibaly", "Abdoulaye Seck", "Idrissa Gueye", "Pathé Ciss", "Assane Diao", "Lamine Camara", "Bamba Dieng", "Sadio Mané", "Nicolas Jackson", "Cherif Ndiaye", "Iliman Ndiaye", "Ismail Jakobs", "Krépin Diatta", "Édouard Mendy", "Pape Matar Sarr", "Ismaïla Sarr", "Moussa Niakhaté", "Ibrahim Mbaye", "Habib Diarra", "Bara Sapoko Ndiaye", "Mory Diaw", "Antoine Mendy", "El Hadji Malick Diouf", "Pape Gueye"],
  "Iraq": ["Fahad Talib", "Rebin Sulaka", "Hussein Ali", "Zaid Tahseen", "Akam Hashim", "Manaf Younis", "Youssef Amyn", "Ibrahim Bayesh", "Ali Al-Hamadi", "Mohanad Ali", "Ahmed Qasem", "Jalal Hassan", "Ali Yousif", "Zidane Iqbal", "Ahmed Yahya", "Amir Al-Ammari", "Ali Jasim", "Aymen Hussein", "Kevin Yakob", "Aimar Sher", "Marko Farji", "Ahmed Basil", "Merchas Doski", "Zaid Ismail", "Mustafa Saadoon", "Frans Putros"],
  "Norway": ["Ørjan Nyland", "Morten Thorsby", "Kristoffer Ajer", "Leo Østigård", "David Møller Wolfe", "Patrick Berg", "Alexander Sørloth", "Sander Berge", "Erling Haaland", "Martin Ødegaard", "Jørgen Strand Larsen", "Sander Tangvik", "Egil Selvik", "Fredrik Aursnes", "Fredrik André Bjørkan", "Marcus Holmgren Pedersen", "Torbjørn Heggem", "Kristian Thorstvedt", "Thelo Aasgaard", "Antonio Nusa", "Andreas Schjelderup", "Oscar Bobb", "Jens Petter Hauge", "Sondre Langås", "Henrik Falchener", "Julian Ryerson"],
  "Argentina": ["Juan Musso", "Leonardo Balerdi", "Nicolás Tagliafico", "Gonzalo Montiel", "Leandro Paredes", "Lisandro Martínez", "Rodrigo De Paul", "Valentín Barco", "Julián Alvarez", "Lionel Messi", "Giovani Lo Celso", "Gerónimo Rulli", "Cristian Romero", "Exequiel Palacios", "Nicolás González", "Thiago Almada", "Giuliano Simeone", "Nico Paz", "Nicolás Otamendi", "Alexis Mac Allister", "José Manuel López", "Lautaro Martínez", "Emiliano Martínez", "Enzo Fernández", "Facundo Medina", "Nahuel Molina"],
  "Algeria": ["Melvin Mastil", "Aïssa Mandi", "Achref Abada", "Mohamed Amine Tougai", "Zineddine Belaïd", "Ramiz Zerrouki", "Riyad Mahrez", "Houssem Aouar", "Amine Gouiri", "Farès Chaïbi", "Anis Hadj Moussa", "Nadhir Benbouali", "Jaouen Hadjam", "Hicham Boudaoui", "Rayan Aït-Nouri", "Oussama Benbot", "Rafik Belghali", "Mohamed Amoura", "Nabil Bentaleb", "Adil Boulbina", "Ramy Bensebaini", "Ibrahim Maza", "Luca Zidane", "Yacine Titraoui", "Farès Ghedjemis", "Samir Chergui"],
  "Austria": ["Alexander Schlager", "David Affengruber", "Kevin Danso", "Xaver Schlager", "Stefan Posch", "Nicolas Seiwald", "Marko Arnautović", "David Alaba", "Marcel Sabitzer", "Florian Grillitsch", "Michael Gregoritsch", "Florian Wiegele", "Patrick Pentz", "Saša Kalajdžić", "Philipp Lienhart", "Phillipp Mwene", "Carney Chukwuemeka", "Romano Schmid", "Konrad Laimer", "Patrick Wimmer", "Alexander Prass", "Marco Friedl", "Paul Wanner", "Michael Svoboda", "Alessandro Schöpf"],
  "Jordan": ["Yazeed Abulaila", "Mohammad Abu Hashish", "Abdallah Nasib", "Husam Abu Dahab", "Yazan Al-Arab", "Amer Jamous", "Mohammad Abu Zrayq", "Noor Al-Rawabdeh", "Ali Olwan", "Musa Al-Taamari", "Odeh Al-Fakhouri", "Nour Bani Attiah", "Mahmoud Al-Mardi", "Rajaei Ayed", "Ibrahim Sadeh", "Mo Abualnadi", "Salim Obaid", "Ibrahim Sabra", "Saed Al-Rosan", "Mohannad Abu Taha", "Nizar Al-Rashdan", "Abdallah Al-Fakhouri", "Ihsan Haddad", "Ali Azaizeh", "Mohammad Al-Dawoud", "Anas Badawi"],
  "Portugal": ["Diogo Costa", "Nélson Semedo", "Rúben Dias", "Tomás Araújo", "Diogo Dalot", "Matheus Nunes", "Cristiano Ronaldo", "Bruno Fernandes", "Gonçalo Ramos", "Bernardo Silva", "João Félix", "José Sá", "Renato Veiga", "Gonçalo Inácio", "João Neves", "Francisco Trincão", "Rafael Leão", "Pedro Neto", "Gonçalo Guedes", "João Cancelo", "Rúben Neves", "Rui Silva", "Vitinha", "Samú Costa", "Nuno Mendes", "Francisco Conceição"],
  "DR Congo": ["Lionel Mpasi", "Aaron Wan-Bissaka", "Steve Kapuadi", "Axel Tuanzebe", "Dylan Batubinsika", "Ngal'ayel Mukau", "Nathanaël Mbuku", "Samuel Moutoussamy", "Brian Cipenga", "Théo Bongonda", "Gaël Kakuta", "Joris Kayembe", "Meschak Elia", "Noah Sadiki", "Aaron Tshibola", "Timothy Fayulu", "Cédric Bakambu", "Charles Pickel", "Fiston Mayele", "Yoane Wissa", "Matthieu Epolo", "Chancel Mbemba", "Simon Banza", "Gédéon Kalulu", "Edo Kayembe", "Arthur Masuaku"],
  "Uzbekistan": ["Utkir Yusupov", "Abdukodir Khusanov", "Khojiakbar Alijonov", "Farrukh Sayfiev", "Rustam Ashurmatov", "Akmal Mozgovoy", "Otabek Shukurov", "Jamshid Iskanderov", "Odiljon Hamrobekov", "Jaloliddin Masharipov", "Oston Urunov", "Abduvohid Nematov", "Sherzod Nasrullaev", "Eldor Shomurodov", "Umar Eshmurodov", "Botirali Ergashev", "Dostonbek Khamdamov", "Abdulla Abdullaev", "Azizjon Ganiev", "Azizbek Amonov", "Igor Sergeev", "Abbosbek Fayzullaev", "Sherzod Esanov", "Bekhruz Karimov", "Avazbek Ulmasaliev", "Jakhongir Urozov"],
  "Colombia": ["David Ospina", "Daniel Muñoz", "Jhon Lucumí", "Santiago Arias", "Kevin Castaño", "Richard Ríos", "Luis Díaz", "Jorge Carrascal", "Jhon Córdoba", "James Rodríguez", "Jhon Arias", "Camilo Vargas", "Yerry Mina", "Gustavo Puerta", "Juan Portilla", "Jefferson Lerma", "Johan Mojica", "Willer Ditta", "Cucho Hernández", "Juan Fernando Quintero", "Jaminton Campaz", "Deiver Machado", "Davinson Sánchez", "Álvaro Montero", "Luis Suárez", "Andrés Gómez"],
  "England": ["Jordan Pickford", "Ezri Konsa", "Nico O'Reilly", "Declan Rice", "John Stones", "Marc Guéhi", "Bukayo Saka", "Elliot Anderson", "Harry Kane", "Jude Bellingham", "Marcus Rashford", "Tino Livramento", "Dean Henderson", "Jordan Henderson", "Dan Burn", "Kobbie Mainoo", "Morgan Rogers", "Anthony Gordon", "Ollie Watkins", "Noni Madueke", "Eberechi Eze", "Ivan Toney", "James Trafford", "Reece James", "Djed Spence", "Jarell Quansah"],
  "Croatia": ["Dominik Livaković", "Josip Stanišić", "Marin Pongračić", "Joško Gvardiol", "Duje Ćaleta-Car", "Josip Šutalo", "Nikola Moro", "Mateo Kovačić", "Andrej Kramarić", "Luka Modrić", "Ante Budimir", "Ivor Pandur", "Nikola Vlašić", "Ivan Perišić", "Mario Pašalić", "Martin Baturina", "Petar Sučić", "Kristijan Jakić", "Toni Fruk", "Igor Matanović", "Luka Sučić", "Luka Vušković", "Dominik Kotarski", "Marco Pašalić", "Martin Erlić", "Petar Musa"],
  "Ghana": ["Lawrence Ati-Zigi", "Alidu Seidu", "Caleb Yirenkyi", "Jonas Adjetey", "Thomas Partey", "Abdul Mumin", "Abdul Fatawu", "Kwasi Sibo", "Jordan Ayew", "Brandon Thomas-Asante", "Antoine Semenyo", "Joseph Anang", "Christopher Bonsu Baah", "Gideon Mensah", "Elisha Owusu", "Benjamin Asare", "Abdul Rahman Baba", "Jerome Opoku", "Iñaki Williams", "Augustine Boakye", "Kojo Peprah Oppong", "Kamaldeen Sulemana", "Derrick Luckassen", "Ernest Nuamah", "Prince Kwabena Adu", "Marvin Senaya"],
  "Panama": ["Luis Mejía", "César Blackman", "José Córdoba", "Fidel Escobar", "Edgardo Fariña", "Cristian Martínez", "José Luis Rodríguez", "Adalberto Carrasquilla", "Tomás Rodríguez", "Ismael Díaz", "Yoel Bárcenas", "César Samudio", "Jiovany Ramos", "Carlos Harvey", "Eric Davis", "Andrés Andrade", "José Fajardo", "Cecilio Waterman", "Alberto Quintero", "Aníbal Godoy", "César Yanis", "Orlando Mosquera", "Michael Amir Murillo", "Azarias Londoño", "Roderick Miller", "Jorge Gutiérrez"],
};

// ── Admin credentials ─────────────────────────────────────────────────────────
const ADMIN_PHONE = "9567983967";
const ADMIN_PIN   = "3967";
const ADMIN_NAME  = "Admin";

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌍  FIFA World Cup 2026 – Full Reseed\n");

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅  Connected.");

    // 1. Ensure schema
    const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
    await client.query(fs.readFileSync(schemaPath, "utf8"));
    console.log("✅  Schema verified.");

    // 2. Clear ALL match-related data and RESET ID sequences so IDs always start from 1
    console.log("🗑️   Truncating existing matches, questions, predictions, results, scores, players…");
    await client.query(
      "TRUNCATE TABLE scores, results, predictions, questions, matches, players RESTART IDENTITY CASCADE"
    );
    console.log("✅  Cleared (sequences reset).");

    // 2.5 Seed Players — bulk insert all at once via unnest()
    console.log("⚽  Seeding squad players (bulk insert)...");
    const teamNames: string[] = [];
    const playerNames: string[] = [];
    for (const [team, players] of Object.entries(SQUADS)) {
      for (const player of players) {
        teamNames.push(team);
        playerNames.push(player);
      }
    }
    await client.query(
      `INSERT INTO players (team_name, name)
       SELECT * FROM unnest($1::text[], $2::text[])
       ON CONFLICT DO NOTHING`,
      [teamNames, playerNames]
    );
    console.log(`✅  Seeded ${teamNames.length} players.`);

    // 3. Upsert admin
    const adminCheck = await client.query("SELECT id FROM users WHERE phone = $1", [ADMIN_PHONE]);
    let adminId: number;
    if (adminCheck.rows.length === 0) {
      const hash = bcrypt.hashSync(ADMIN_PIN, 10);
      const r = await client.query(
        `INSERT INTO users (name, phone, pin_hash, role) VALUES ($1,$2,$3,'admin') RETURNING id`,
        [ADMIN_NAME, ADMIN_PHONE, hash]
      );
      adminId = r.rows[0].id;
      console.log(`✅  Admin created (id: ${adminId})`);
    } else {
      adminId = adminCheck.rows[0].id;
      const hash = bcrypt.hashSync(ADMIN_PIN, 10);
      await client.query("UPDATE users SET pin_hash=$1, role='admin' WHERE id=$2", [hash, adminId]);
      console.log(`ℹ️   Admin updated (id: ${adminId})`);
    }

    // Seed default Tournament and Contest
    console.log("🏆  Seeding default tournament and contest...");
    await client.query(`
      INSERT INTO tournaments (id, name, description, type, status)
      VALUES (1, 'FIFA World Cup 2026', 'Official FIFA World Cup 2026 Tournament', 'league', 'active')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`SELECT setval(pg_get_serial_sequence('tournaments', 'id'), COALESCE(MAX(id), 1)) FROM tournaments`);

    await client.query(`
      INSERT INTO contests (id, name, tournament_id, game_type, join_code, creator_id)
      VALUES (1, 'WC2026', 1, 'match_prediction', '958102', (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1))
      ON CONFLICT (id) DO NOTHING
    `);

    // If it already exists, rename and update it
    await client.query(`
      UPDATE contests
      SET name = 'WC2026',
          join_code = '958102',
          creator_id = (SELECT id FROM users WHERE phone = '7994028594' LIMIT 1)
      WHERE id = 1 OR name = 'Public Arena'
    `);
    await client.query(`SELECT setval(pg_get_serial_sequence('contests', 'id'), COALESCE(MAX(id), 1)) FROM contests`);

    // Add admin to Public Arena
    if (adminId) {
      await client.query(`INSERT INTO contest_members (contest_id, user_id) VALUES (1, $1) ON CONFLICT DO NOTHING`, [adminId]);
    }

    // 4. Insert matches
    console.log(`\n📅  Inserting ${MATCHES.length} matches…\n`);
    let inserted = 0;

    for (const m of MATCHES) {
      const matchTime = new Date(m.utcTime);
      // Deadline = 1 hour before kickoff
      const deadline = new Date(matchTime.getTime() - 60 * 60 * 1000);
      const now = new Date();
      const status = matchTime < now ? "resulted" : "upcoming";

      const mRes = await client.query(
        `INSERT INTO matches (tournament_id, team_home, team_away, match_time, deadline, status)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [1, m.home, m.away, matchTime, deadline, status]
      );
      const matchId: number = mRes.rows[0].id;

      // 3 questions per match
      await client.query(
        `INSERT INTO questions (match_id, type, label, points) VALUES ($1,'winner','Match Winner',2)`, [matchId]
      );
      await client.query(
        `INSERT INTO questions (match_id, type, label, points) VALUES ($1,'score','Exact Scoreline',4)`, [matchId]
      );
      await client.query(
        `INSERT INTO questions (match_id, type, label, points) VALUES ($1,'scorer','First Goalscorer',2)`, [matchId]
      );

      const d = matchTime.toLocaleDateString("en-GB", { day:"2-digit", month:"short" });
      const t = matchTime.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", timeZoneName:"short" });
      console.log(`  [${String(inserted+1).padStart(3)}] ${m.home.padEnd(24)} vs ${m.away.padEnd(24)} | ${d} ${t} | ${m.round}`);
      inserted++;
    }

    // 5. Summary
    const totM = (await client.query("SELECT COUNT(*) FROM matches")).rows[0].count;
    const totQ = (await client.query("SELECT COUNT(*) FROM questions")).rows[0].count;
    const totU = (await client.query("SELECT COUNT(*) FROM users")).rows[0].count;
    const totP = (await client.query("SELECT COUNT(*) FROM players")).rows[0].count;

    console.log(`
─────────────────────────────────────────────
📊  Database Summary:
    👤  Users     : ${totU}
    ⚽  Matches   : ${totM}
    ❓  Questions : ${totQ}
    🏃  Players   : ${totP}
─────────────────────────────────────────────
🔑  Admin Login:
    Phone    : ${ADMIN_PHONE}
    Password : ${ADMIN_PIN}

🎉  Reseed complete!
`);
  } catch (err) {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
