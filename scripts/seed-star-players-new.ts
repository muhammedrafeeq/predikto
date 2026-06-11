import { query } from "../lib/db";

const INPUT_DATA = [
  {
    "team": "Argentina",
    "players": ["Lionel Messi", "Julián Álvarez", "Enzo Fernández", "Rodrigo De Paul", "Lautaro Martínez"]
  },
  {
    "team": "Brazil",
    "players": ["Vinicius Jr.", "Rodrygo", "Raphinha", "Lucas Paquetá", "Endrick"]
  },
  {
    "team": "Colombia",
    "players": ["James Rodríguez", "Luis Díaz", "Jhon Córdoba", "Juan Cuadrado", "Matheus Uribe"]
  },
  {
    "team": "Uruguay",
    "players": ["Federico Valverde", "Darwin Núñez", "Rodrigo Bentancur", "Luis Suárez", "José María Giménez"]
  },
  {
    "team": "Ecuador",
    "players": ["Moisés Caicedo", "Enner Valencia", "Piero Hincapié", "Jeremy Sarmiento", "Djorkaeff Reasco"]
  },
  {
    "team": "Venezuela",
    "players": ["Yangel Herrera", "Salomón Rondón", "Jefferson Savarino", "Jan Hoffmann", "Jhonder Cádiz"]
  },
  {
    "team": "France",
    "players": ["Kylian Mbappé", "Antoine Griezmann", "Ousmane Dembélé", "Aurélien Tchouaméni", "Mike Maignan"]
  },
  {
    "team": "England",
    "players": ["Jude Bellingham", "Harry Kane", "Phil Foden", "Bukayo Saka", "Declan Rice"]
  },
  {
    "team": "Spain",
    "players": ["Pedri", "Lamine Yamal", "Rodri", "Ferran Torres", "Aymeric Laporte"]
  },
  {
    "team": "Germany",
    "players": ["Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Joshua Kimmich", "Toni Kroos"]
  },
  {
    "team": "Portugal",
    "players": ["Cristiano Ronaldo", "Bruno Fernandes", "Rafael Leão", "Bernardo Silva", "Rúben Dias"]
  },
  {
    "team": "Netherlands",
    "players": ["Virgil van Dijk", "Xavi Simons", "Cody Gakpo", "Frenkie de Jong", "Memphis Depay"]
  },
  {
    "team": "Belgium",
    "players": ["Kevin De Bruyne", "Romelu Lukaku", "Yannick Carrasco", "Axel Witsel", "Wout Faes"]
  },
  {
    "team": "Italy",
    "players": ["Gianluigi Donnarumma", "Federico Chiesa", "Nicolò Barella", "Lorenzo Pellegrini", "Alessandro Bastoni"]
  },
  {
    "team": "Croatia",
    "players": ["Luka Modrić", "Mateo Kovačić", "Ivan Perišić", "Marcelo Brozović", "Joško Gvardiol"]
  },
  {
    "team": "Austria",
    "players": ["David Alaba", "Marcel Sabitzer", "Marko Arnautović", "Florian Grillitsch", "Christoph Baumgartner"]
  },
  {
    "team": "Denmark",
    "players": ["Christian Eriksen", "Pierre-Emile Højbjerg", "Rasmus Højlund", "Kasper Schmeichel", "Andreas Christensen"]
  },
  {
    "team": "Serbia",
    "players": ["Dušan Vlahović", "Aleksandar Mitrović", "Sergej Milinković-Savić", "Dušan Tadić", "Predrag Rajković"]
  },
  {
    "team": "Switzerland",
    "players": ["Granit Xhaka", "Xherdan Shaqiri", "Yann Sommer", "Manuel Akanji", "Breel Embolo"]
  },
  {
    "team": "Scotland",
    "players": ["Andy Robertson", "Scott McTominay", "John McGinn", "Kieran Tierney", "Ryan Christie"]
  },
  {
    "team": "Hungary",
    "players": ["Dominik Szoboszlai", "Roland Sallai", "Péter Gulácsi", "Ádám Szalai", "Attila Fiola"]
  },
  {
    "team": "Turkey",
    "players": ["Hakan Çalhanoğlu", "Arda Güler", "Kenan Yıldız", "Çağlar Söyüncü", "Burak Yılmaz"]
  },
  {
    "team": "Poland",
    "players": ["Robert Lewandowski", "Piotr Zieliński", "Kamil Grosicki", "Wojciech Szczęsny", "Jan Bednarek"]
  },
  {
    "team": "Morocco",
    "players": ["Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri", "Sofyan Amrabat", "Romain Saïss"]
  },
  {
    "team": "Senegal",
    "players": ["Sadio Mané", "Edouard Mendy", "Kalidou Koulibaly", "Idrissa Gueye", "Ismaïla Sarr"]
  },
  {
    "team": "Egypt",
    "players": ["Mohamed Salah", "Mohamed El Shenawy", "Mostafa Mohamed", "Ahmed Hegazi", "Omar Marmoush"]
  },
  {
    "team": "Nigeria",
    "players": ["Victor Osimhen", "Wilfred Ndidi", "Alex Iwobi", "Taiwo Awoniyi", "Samuel Chukwueze"]
  },
  {
    "team": "South Africa",
    "players": ["Percy Tau", "Bongani Zungu", "Ronwen Williams", "Themba Zwane", "Lyle Foster"]
  },
  {
    "team": "DR Congo",
    "players": ["Silas Wissa", "Chancel Mbemba", "Arthur Masuaku", "Cédric Bakambu", "Yoane Wissa"]
  },
  {
    "team": "Côte d'Ivoire",
    "players": ["Sébastien Haller", "Franck Kessié", "Nicolas Pépé", "Serge Aurier", "Wilfried Zaha"]
  },
  {
    "team": "Cameroon",
    "players": ["André Onana", "Vincent Aboubakar", "Karl Toko Ekambi", "Frank Zambo Anguissa", "Jean-Charles Castelletto"]
  },
  {
    "team": "Algeria",
    "players": ["Riyad Mahrez", "Islam Slimani", "Youcef Atal", "Ismael Bennacer", "Andy Delort"]
  },
  {
    "team": "USA",
    "players": ["Christian Pulisic", "Tyler Adams", "Gio Reyna", "Weston McKennie", "Sergiño Dest"]
  },
  {
    "team": "Mexico",
    "players": ["Guillermo Ochoa", "Hirving Lozano", "Raúl Jiménez", "Edson Álvarez", "Héctor Herrera"]
  },
  {
    "team": "Canada",
    "players": ["Alphonso Davies", "Jonathan David", "Tajon Buchanan", "Cyle Larin", "Alistair Johnston"]
  },
  {
    "team": "Costa Rica",
    "players": ["Keylor Navas", "Bryan Ruiz", "Joel Campbell", "Celso Borges", "Kendall Waston"]
  },
  {
    "team": "Honduras",
    "players": ["Alberth Elis", "Romell Quioto", "Anthony Lozano", "Jorge Benguché", "Denil Maldonado"]
  },
  {
    "team": "Panama",
    "players": ["Rolando Blackburn", "Cecilio Waterman", "Adalberto Carrasquilla", "Fidel Escobar", "Édgar Barcenas"]
  },
  {
    "team": "Japan",
    "players": ["Takumi Minamino", "Wataru Endo", "Daichi Kamada", "Ritsu Doan", "Ao Tanaka"]
  },
  {
    "team": "South Korea",
    "players": ["Son Heung-min", "Lee Kang-in", "Hwang Hee-chan", "Kim Min-jae", "Hwang In-beom"]
  },
  {
    "team": "Australia",
    "players": ["Mathew Ryan", "Mitchell Duke", "Ajdin Hrustic", "Aaron Mooy", "Miloš Degenek"]
  },
  {
    "team": "Iran",
    "players": ["Mehdi Taremi", "Sardar Azmoun", "Ali Gholizadeh", "Alireza Beiranvand", "Milad Mohammadi"]
  },
  {
    "team": "Saudi Arabia",
    "players": ["Salem Al-Dawsari", "Mohammed Al-Owais", "Saleh Al-Shehri", "Firas Al-Buraikan", "Ali Al-Bulayhi"]
  },
  {
    "team": "Qatar",
    "players": ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos", "Abdulaziz Hatem", "Bassam Al-Rawi"]
  },
  {
    "team": "Iraq",
    "players": ["Aymen Hussein", "Amjed Attwan", "Mohanad Ali", "Ali Adnan", "Ahmad Yasin"]
  },
  {
    "team": "Uzbekistan",
    "players": ["Eldor Shomurodov", "Jaloliddin Masharipov", "Otabek Shukurov", "Dostonbek Khamdamov", "Abdoukodir Khusanov"]
  },
  {
    "team": "Indonesia",
    "players": ["Marselino Ferdinan", "Ragnar Oratmangoen", "Jay Idzes", "Sandy Walsh", "Thom Haye"]
  },
  {
    "team": "New Zealand",
    "players": ["Chris Wood", "Winston Reid", "Clayton Lewis", "Liberato Cacace", "Bill Tuilagi"]
  }
];

function normalizeTeam(t: string): string {
  if (t.toLowerCase() === "côte d'ivoire") return "Ivory Coast";
  return t;
}

function cleanText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

async function main() {
  console.log("Adding is_star column if not exists...");
  await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_star BOOLEAN DEFAULT false`);

  console.log("Resetting all players is_star to false...");
  await query(`UPDATE players SET is_star = false`);

  // Load all players from database
  const dbRes = await query(`SELECT name, team_name FROM players`);
  const dbPlayers = dbRes.rows;

  let matchedCount = 0;
  let skippedCount = 0;

  for (const entry of INPUT_DATA) {
    const teamName = normalizeTeam(entry.team);
    const dbTeamPlayers = dbPlayers.filter(p => p.team_name.toLowerCase() === teamName.toLowerCase());

    if (dbTeamPlayers.length === 0) {
      console.log(`Skipping entire team [${entry.team}] (not in database)`);
      skippedCount += entry.players.length;
      continue;
    }

    for (const pName of entry.players) {
      const cleanPName = cleanText(pName);
      
      // Find matching player
      let match = dbTeamPlayers.find(p => p.name.toLowerCase() === pName.toLowerCase());
      if (!match) {
        match = dbTeamPlayers.find(p => cleanText(p.name) === cleanPName);
      }
      if (!match) {
        // Try fuzzy word overlap match (like "Abdoukodir Khusanov" vs "Abdukodir Khusanov")
        match = dbTeamPlayers.find(p => {
          const dbClean = cleanText(p.name);
          const inputWords = cleanPName.split(" ").filter(w => w.length > 2 && w !== "jr" && w !== "junior");
          if (inputWords.length === 0) return false;
          // If any of the significant words match the db name
          return inputWords.some(word => dbClean.includes(word));
        });
      }

      if (match) {
        const updateRes = await query(
          `UPDATE players SET is_star = true WHERE name = $1 AND team_name = $2`,
          [match.name, match.team_name]
        );
        if ((updateRes.rowCount ?? 0) > 0) {
          console.log(`Marked star: [${match.team_name}] ${match.name} (input: "${pName}")`);
          matchedCount++;
        } else {
          console.log(`Failed to update: [${match.team_name}] ${match.name}`);
          skippedCount++;
        }
      } else {
        console.log(`Skipped player (not found in DB): [${teamName}] "${pName}"`);
        skippedCount++;
      }
    }
  }

  console.log(`\nFinished seeding star players!`);
  console.log(`Matched: ${matchedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
