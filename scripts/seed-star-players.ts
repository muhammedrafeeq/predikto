import { query } from "../lib/db";

const STAR_PLAYERS = [
  // Argentina
  "Lionel Messi", "Julián Alvarez", "Lautaro Martínez", "Rodrigo De Paul",
  "Emiliano Martínez", "Alexis Mac Allister", "Enzo Fernández", "Cristian Romero",

  // Portugal
  "Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rúben Dias",
  "Rafael Leão", "João Félix", "João Cancelo", "Gonçalo Ramos",

  // France
  "Kylian Mbappé", "Aurélien Tchouaméni", "Marcus Thuram", "Ousmane Dembélé",
  "N'Golo Kanté", "Mike Maignan", "William Saliba", "Bradley Barcola",

  // Brazil
  "Vinícius Júnior", "Raphinha", "Lucas Paquetá", "Endrick",
  "Neymar", "Casemiro", "Marquinhos", "Alisson",

  // England
  "Jude Bellingham", "Harry Kane", "Bukayo Saka", "Marcus Rashford",
  "Declan Rice", "Jordan Pickford", "Phil Foden",

  // Spain
  "Pedri", "Gavi", "Rodri", "Lamine Yamal",
  "Nico Williams", "Dani Olmo", "Mikel Oyarzabal", "Ferran Torres",

  // Germany
  "Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Leroy Sané",
  "Manuel Neuer", "Joshua Kimmich", "Antonio Rüdiger", "Leon Goretzka",

  // Netherlands
  "Virgil van Dijk", "Memphis Depay", "Cody Gakpo", "Frenkie de Jong",
  "Ryan Gravenberch", "Tijjani Reijnders", "Teun Koopmeiners",

  // Belgium
  "Kevin De Bruyne", "Romelu Lukaku", "Thibaut Courtois", "Leandro Trossard",
  "Jérémy Doku", "Amadou Onana", "Charles De Ketelaere",

  // Croatia
  "Luka Modrić", "Ivan Perišić", "Mateo Kovačić",
  "Joško Gvardiol", "Andrej Kramarić",

  // Morocco
  "Achraf Hakimi", "Yassine Bounou", "Sofyan Amrabat",
  "Brahim Díaz", "Nayef Aguerd",

  // Uruguay
  "Darwin Núñez", "Federico Valverde", "Rodrigo Bentancur",
  "Ronald Araújo", "Giorgian de Arrascaeta",

  // Colombia
  "James Rodríguez", "Luis Díaz", "Cucho Hernández", "Richard Ríos",

  // Sweden
  "Alexander Isak", "Viktor Gyökeres", "Lucas Bergvall",

  // Norway
  "Erling Haaland", "Martin Ødegaard", "Alexander Sørloth",

  // Australia
  "Mathew Leckie", "Nestory Irankunda", "Harry Souttar",

  // Mexico
  "Raúl Jiménez", "Edson Álvarez", "Santiago Giménez", "Guillermo Ochoa",

  // Canada
  "Alphonso Davies", "Jonathan David", "Tajon Buchanan",

  // Korea Republic
  "Son Heung-min", "Lee Kang-in",

  // Japan
  "Takefusa Kubo", "Daichi Kamada", "Ritsu Dōan", "Wataru Endo",

  // Senegal
  "Sadio Mané", "Édouard Mendy", "Ismaïla Sarr",
  "Kalidou Koulibaly", "Nicolas Jackson",

  // Egypt
  "Mohamed Salah", "Omar Marmoush",

  // USA
  "Christian Pulisic", "Tyler Adams", "Weston McKennie",
  "Giovanni Reyna", "Folarin Balogun",

  // Austria
  "David Alaba", "Marcel Sabitzer", "Marko Arnautović", "Konrad Laimer",
];

async function main() {
  await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_star BOOLEAN DEFAULT false`);
  await query(`UPDATE players SET is_star = false`);

  let updated = 0;
  const notFound: string[] = [];

  for (const name of STAR_PLAYERS) {
    const res = await query(`UPDATE players SET is_star = true WHERE name = $1`, [name]);
    if ((res.rowCount ?? 0) > 0) updated++;
    else notFound.push(name);
  }

  if (notFound.length) console.log(`\nNot found in DB:\n  ${notFound.join("\n  ")}`);
  console.log(`\nDone — ${updated}/${STAR_PLAYERS.length} players marked as star.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
