import { query } from "../lib/db";

const STAR_PLAYERS = [
  "Lionel Messi", "Ángel Di María", "Lautaro Martínez", "Julián Álvarez", "Rodrigo De Paul",
  "Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rúben Dias", "Rafael Leão",
  "Kylian Mbappé", "Antoine Griezmann", "Aurélien Tchouaméni", "Marcus Thuram", "Eduardo Camavinga",
  "Vinicius Junior", "Rodrygo", "Raphinha", "Lucas Paquetá", "Endrick",
  "Jude Bellingham", "Harry Kane", "Bukayo Saka", "Phil Foden", "Marcus Rashford",
  "Pedri", "Gavi", "Álvaro Morata", "Rodri", "Lamine Yamal",
  "Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Leroy Sané", "Thomas Müller",
  "Virgil van Dijk", "Memphis Depay", "Cody Gakpo", "Frenkie de Jong", "Xavi Simons",
  "Kevin De Bruyne", "Romelu Lukaku", "Thibaut Courtois", "Leandro Trossard",
  "Luka Modrić", "Ivan Perišić", "Mateo Kovačić",
  "Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri",
  "Darwin Núñez", "Federico Valverde", "Luis Suárez",
  "Christian Pulisic", "Tyler Adams", "Weston McKennie",
  "Hirving Lozano", "Raúl Jiménez", "Edson Álvarez",
  "James Rodríguez", "Luis Díaz", "Falcao",
  "Takefusa Kubo", "Daichi Kamada",
  "Sadio Mané", "Édouard Mendy", "Ismaïla Sarr",
  "Mohamed Salah",
  "Erling Haaland", "Martin Ødegaard",
  "Alexander Isak", "Dejan Kulusevski",
  "David Alaba", "Marcel Sabitzer",
  "Aleksandar Mitrović", "Dušan Vlahović",
  "Mathew Leckie", "Aaron Mooy",
  "Alphonso Davies", "Jonathan David",
  "Son Heung-min", "Lee Kang-in",
];

async function main() {
  await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_star BOOLEAN DEFAULT false`);
  // First clear all star flags
  await query(`UPDATE players SET is_star = false`);

  let updated = 0;
  for (const name of STAR_PLAYERS) {
    const res = await query(`UPDATE players SET is_star = true WHERE name = $1`, [name]);
    if ((res.rowCount ?? 0) > 0) updated++;
    else console.log(`  Not found in DB: ${name}`);
  }

  console.log(`\nDone — ${updated}/${STAR_PLAYERS.length} players marked as star.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
